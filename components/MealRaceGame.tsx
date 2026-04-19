'use client'

import { type PointerEvent, useEffect, useRef, useState } from 'react'
import { meals as staticMeals } from '@/data/meals'

interface Meal {
  id: string
  title: string
  emoji: string
}

interface Opponent {
  id: string
  meal: Meal
  progress: number
  speed: number
  laneX: number
  slowUntil: number
  nextEventAt: number
}

interface TrackObstacle {
  id: string
  progress: number
  laneX: number
  hit: boolean
}

interface RaceSnapshot {
  playerX: number
  playerProgress: number
  playerSlowUntil: number
  steerEnergy: number
  opponents: Opponent[]
  obstacles: TrackObstacle[]
}

interface RaceWinner {
  id: string
  isLilah: boolean
  meal: Meal | null
}

type Phase = 'welcome' | 'ready' | 'racing' | 'result' | 'done'

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const NUM_MEAL_RACERS = 4
const RACE_LENGTH = 100
const TICK_MS = 50
const PLAYER_BASE_SPEED = 5.2
const PLAYER_HIT_SLOW_MS = 900
const PLAYER_HIT_MULTIPLIER = 0.42
const OPPONENT_EVENT_MIN_MS = 850
const OPPONENT_EVENT_MAX_MS = 1650

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function laneXs(count: number): number[] {
  const base = [0.16, 0.35, 0.65, 0.84]
  return shuffle(base).slice(0, count)
}

function buildOpponents(pool: Meal[]): Opponent[] {
  const chosen = shuffle(pool).slice(0, NUM_MEAL_RACERS)
  const lanes = laneXs(chosen.length)
  return chosen.map((meal, i) => ({
    id: meal.id,
    meal,
    progress: 0,
    speed: randomBetween(4.6, 5.9),
    laneX: lanes[i] ?? randomBetween(0.14, 0.86),
    slowUntil: 0,
    nextEventAt: Date.now() + randomBetween(OPPONENT_EVENT_MIN_MS, OPPONENT_EVENT_MAX_MS),
  }))
}

function buildObstacles(): TrackObstacle[] {
  const count = 12
  const spacing = (RACE_LENGTH - 16) / count
  const obstacles: TrackObstacle[] = []
  for (let i = 0; i < count; i++) {
    obstacles.push({
      id: `obs-${i}`,
      progress: 8 + i * spacing + randomBetween(-1.8, 1.8),
      laneX: randomBetween(0.12, 0.88),
      hit: false,
    })
  }
  return obstacles
}

function buildRace(pool: Meal[]): RaceSnapshot {
  return {
    playerX: 0.5,
    playerProgress: 0,
    playerSlowUntil: 0,
    steerEnergy: 0,
    opponents: buildOpponents(pool),
    obstacles: buildObstacles(),
  }
}

function pickAssignedMeal(winner: RaceWinner, opponents: Opponent[]): Meal {
  if (!winner.isLilah && winner.meal) return winner.meal
  const pool = opponents.map(o => o.meal)
  return pool[Math.floor(Math.random() * pool.length)]
}

function resolveWinner(playerProgress: number, opponents: Opponent[]): RaceWinner {
  const bestOpponent = opponents.reduce<Opponent | null>((best, o) => {
    if (!best) return o
    return o.progress > best.progress ? o : best
  }, null)

  if (!bestOpponent || playerProgress >= bestOpponent.progress) {
    return { id: 'lilah', isLilah: true, meal: null }
  }

  return { id: bestOpponent.id, isLilah: false, meal: bestOpponent.meal }
}

function simulateRace(pool: Meal[]) {
  const opponents = buildOpponents(pool)
  const lilahScore = randomBetween(4.9, 6.5) + randomBetween(0, 1.3)

  const bestOpponent = opponents.reduce<Opponent | null>((best, o) => {
    const score = o.speed + randomBetween(0, 1.5)
    if (!best) return { ...o, speed: score }
    return score > best.speed ? { ...o, speed: score } : best
  }, null)

  const winner: RaceWinner =
    !bestOpponent || lilahScore >= bestOpponent.speed
      ? { id: 'lilah', isLilah: true, meal: null }
      : { id: bestOpponent.id, isLilah: false, meal: bestOpponent.meal }

  return {
    winner,
    assignedMeal: pickAssignedMeal(winner, opponents),
  }
}

function LilahFace() {
  return (
    <svg width="34" height="34" viewBox="0 0 30 30" style={{ display: 'block' }}>
      <rect x="2" y="8" width="5" height="15" rx="2.5" fill="#1a0f0a" />
      <rect x="23" y="8" width="5" height="15" rx="2.5" fill="#1a0f0a" />
      <ellipse cx="15" cy="10" rx="10" ry="8" fill="#1a0f0a" />
      <ellipse cx="15" cy="18" rx="9" ry="10" fill="#f5c4a0" />
      <ellipse cx="15" cy="8" rx="9" ry="5" fill="#1a0f0a" />
      <circle cx="11.5" cy="17" r="1.5" fill="#2b2b2b" />
      <circle cx="18.5" cy="17" r="1.5" fill="#2b2b2b" />
      <circle cx="12" cy="16.5" r="0.6" fill="white" />
      <circle cx="19" cy="16.5" r="0.6" fill="white" />
      <ellipse cx="9" cy="20" rx="2.2" ry="1.4" fill="#f0a0a0" opacity="0.45" />
      <ellipse cx="21" cy="20" rx="2.2" ry="1.4" fill="#f0a0a0" opacity="0.45" />
      <path d="M11 23 Q15 27 19 23" stroke="#2b2b2b" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function DayStrip({ picks }: { picks: Meal[] }) {
  return (
    <div className="grid grid-cols-7 gap-1 mb-3">
      {DAYS.map((day, i) => (
        <div
          key={day}
          className={`flex flex-col items-center border-2 border-[#2b2b2b] py-1 transition-colors duration-300 ${
            picks[i] ? 'bg-[#b85476]' : 'bg-[#f0ebe0]'
          }`}
        >
          <span className={`text-[8px] font-bold uppercase tracking-wide ${picks[i] ? 'text-[#f0ebe0]' : 'text-[#2b2b2b]/30'}`}>
            {day}
          </span>
          <span className="text-base leading-none">{picks[i]?.emoji ?? '·'}</span>
        </div>
      ))}
    </div>
  )
}

function DoneScreen({ picks, onPlayAgain }: { picks: Meal[]; onPlayAgain: () => void }) {
  const [orderedPicks, setOrderedPicks] = useState<Meal[]>(picks)
  const [selected, setSelected] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  function handleRowTap(i: number) {
    if (selected === null) {
      setSelected(i)
      return
    }

    if (selected === i) {
      setSelected(null)
      return
    }

    const next = [...orderedPicks]
    ;[next[selected], next[i]] = [next[i], next[selected]]
    setOrderedPicks(next)
    setSelected(null)
  }

  const planText = DAYS.slice(0, orderedPicks.length)
    .map((day, i) => `${day}  ${orderedPicks[i].emoji}  ${orderedPicks[i].title}`)
    .join('\n')
  const shareText = `🏁 Lilah's Race Week!\n\n${planText}`

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Lilah's Meal Plan", text: shareText })
        return
      } catch {
        // fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center px-6 py-10 text-center max-w-sm mx-auto">
      <div className="text-5xl mb-4">🏁</div>
      <h2 className="text-xl font-bold uppercase tracking-[0.15em] text-[#2b2b2b] mb-1">Week Planned!</h2>
      <p className="text-[10px] text-[#2b2b2b]/40 uppercase tracking-widest mb-5">Tap two meals to swap their days</p>
      <div className="w-full border-2 border-[#2b2b2b] bg-white shadow-[4px_4px_0px_#2b2b2b] mb-8">
        {orderedPicks.map((meal, i) => {
          const isSel = selected === i
          return (
            <div
              key={meal.id + i}
              onClick={() => handleRowTap(i)}
              className={`flex items-center gap-3 px-4 py-3 border-b border-[#2b2b2b]/10 last:border-0 cursor-pointer transition-colors ${
                isSel ? 'bg-[#b85476]' : 'hover:bg-[#f0ebe0]'
              }`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-widest w-8 ${isSel ? 'text-[#f0ebe0]' : 'text-[#2b2b2b]/40'}`}>
                {DAYS[i]}
              </span>
              <span className="text-xl">{meal.emoji}</span>
              <span className={`text-sm font-bold uppercase tracking-[0.1em] flex-1 text-left ${isSel ? 'text-[#f0ebe0]' : 'text-[#2b2b2b]'}`}>
                {meal.title}
              </span>
              {isSel && <span className="text-[#f0ebe0] text-xs">↕</span>}
            </div>
          )
        })}
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleShare}
          className="px-5 py-2.5 bg-[#7a5a90] text-[#f0ebe0] font-bold uppercase tracking-[0.15em] text-xs border-2 border-[#2b2b2b] shadow-[3px_3px_0px_#2b2b2b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#2b2b2b] transition-all duration-100"
        >
          {copied ? '✓ Copied!' : '📤 Share Plan'}
        </button>
        <button
          onClick={onPlayAgain}
          className="px-5 py-2.5 bg-[#b85476] text-[#f0ebe0] font-bold uppercase tracking-[0.15em] text-xs border-2 border-[#2b2b2b] shadow-[3px_3px_0px_#2b2b2b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#2b2b2b] transition-all duration-100"
        >
          🔁 Play Again
        </button>
      </div>
    </div>
  )
}

export default function MealRaceGame() {
  const [phase, setPhase] = useState<Phase>('welcome')
  const [winner, setWinner] = useState<RaceWinner | null>(null)
  const [assignedMeal, setAssignedMeal] = useState<Meal | null>(null)
  const [picks, setPicks] = useState<Meal[]>([])
  const [mealPool, setMealPool] = useState<Meal[]>(staticMeals as Meal[])

  const [playerX, setPlayerX] = useState(0.5)
  const [playerProgress, setPlayerProgress] = useState(0)
  const [playerSlowUntil, setPlayerSlowUntil] = useState(0)
  const [opponents, setOpponents] = useState<Opponent[]>([])
  const [obstacles, setObstacles] = useState<TrackObstacle[]>([])

  const raceRef = useRef<RaceSnapshot | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef(false)
  const stopRef = useRef(false)

  const dayNum = picks.length + 1

  function syncRaceState(next: RaceSnapshot) {
    raceRef.current = next
    setPlayerX(next.playerX)
    setPlayerProgress(next.playerProgress)
    setPlayerSlowUntil(next.playerSlowUntil)
    setOpponents(next.opponents)
    setObstacles(next.obstacles)
  }

  function initRace(pool: Meal[]) {
    const next = buildRace(pool)
    syncRaceState(next)
    setWinner(null)
    setAssignedMeal(null)
    setPhase('ready')
  }

  function startGame() {
    const pool = staticMeals as Meal[]
    setMealPool(pool)
    setPicks([])
    initRace(pool)
  }

  function setPlayerLaneFromClientX(clientX: number) {
    const track = trackRef.current
    const race = raceRef.current
    if (!track || !race) return

    const rect = track.getBoundingClientRect()
    const nextX = clamp((clientX - rect.left) / rect.width, 0.08, 0.92)

    race.steerEnergy = clamp(race.steerEnergy + Math.abs(nextX - race.playerX) * 7, 0, 2.4)
    race.playerX = nextX
    setPlayerX(nextX)
  }

  useEffect(() => {
    if (phase !== 'racing') return
    stopRef.current = false

    const id = setInterval(() => {
      const race = raceRef.current
      if (!race || stopRef.current) return

      const now = Date.now()
      const dt = TICK_MS / 1000

      race.steerEnergy = Math.max(0, race.steerEnergy - 1.8 * dt)

      let playerSpeed = PLAYER_BASE_SPEED + Math.min(2.4, race.steerEnergy * 1.6)
      if (now < race.playerSlowUntil) {
        playerSpeed *= PLAYER_HIT_MULTIPLIER
      }
      playerSpeed *= randomBetween(0.96, 1.04)
      race.playerProgress = Math.min(RACE_LENGTH, race.playerProgress + playerSpeed * dt)

      race.obstacles = race.obstacles.map(obs => {
        if (obs.hit) return obs
        const reached = race.playerProgress >= obs.progress - 0.4 && race.playerProgress <= obs.progress + 0.65
        const collided = Math.abs(race.playerX - obs.laneX) < 0.12
        if (reached && collided) {
          race.playerSlowUntil = now + PLAYER_HIT_SLOW_MS
          return { ...obs, hit: true }
        }
        return obs
      })

      race.opponents = race.opponents.map(o => {
        let next = { ...o }
        if (now >= next.nextEventAt) {
          const getsSlowed = Math.random() < 0.34
          next.nextEventAt = now + randomBetween(OPPONENT_EVENT_MIN_MS, OPPONENT_EVENT_MAX_MS)
          if (getsSlowed) next.slowUntil = now + randomBetween(650, 1100)
        }

        let speed = next.speed * randomBetween(0.94, 1.06)
        if (now < next.slowUntil) speed *= 0.46
        next.progress = Math.min(RACE_LENGTH, next.progress + speed * dt)
        return next
      })

      const bestOpponent = race.opponents.reduce<Opponent | null>((best, o) => {
        if (!best) return o
        return o.progress > best.progress ? o : best
      }, null)

      if (race.playerProgress >= RACE_LENGTH || (bestOpponent && bestOpponent.progress >= RACE_LENGTH)) {
        stopRef.current = true
        const finalWinner = resolveWinner(race.playerProgress, race.opponents)
        const meal = pickAssignedMeal(finalWinner, race.opponents)
        setWinner(finalWinner)
        setAssignedMeal(meal)
        setTimeout(() => setPhase('result'), 400)
      }

      setPlayerProgress(race.playerProgress)
      setPlayerSlowUntil(race.playerSlowUntil)
      setOpponents(race.opponents)
      setObstacles(race.obstacles)
    }, TICK_MS)

    return () => {
      stopRef.current = true
      clearInterval(id)
    }
  }, [phase])

  function handleStartRace() {
    setPhase('racing')
  }

  function handleSkip() {
    const race = raceRef.current
    if (!race) return
    stopRef.current = true
    const finalWinner = resolveWinner(race.playerProgress, race.opponents)
    const meal = pickAssignedMeal(finalWinner, race.opponents)
    setWinner(finalWinner)
    setAssignedMeal(meal)
    setPhase('result')
  }

  function handleNextDay() {
    if (!assignedMeal) return
    const nextPicks = [...picks, assignedMeal]
    const nextPool = mealPool.filter(m => m.id !== assignedMeal.id)
    setPicks(nextPicks)
    setMealPool(nextPool)

    if (nextPicks.length >= 7) {
      setPhase('done')
      return
    }

    initRace(nextPool)
  }

  function handleSimulateAll() {
    let pool = [...mealPool]
    const nextPicks = [...picks]
    const remainingDays = 7 - picks.length

    for (let i = 0; i < remainingDays; i++) {
      const sim = simulateRace(pool)
      nextPicks.push(sim.assignedMeal)
      pool = pool.filter(m => m.id !== sim.assignedMeal.id)
    }

    setPicks(nextPicks)
    setMealPool(pool)
    setPhase('done')
  }

  function handleSimulateFromScratch() {
    let remaining = [...(staticMeals as Meal[])]
    const nextPicks: Meal[] = []

    for (let i = 0; i < 7; i++) {
      const sim = simulateRace(remaining)
      nextPicks.push(sim.assignedMeal)
      remaining = remaining.filter(m => m.id !== sim.assignedMeal.id)
    }

    setPicks(nextPicks)
    setMealPool(remaining)
    setPhase('done')
  }

  function onTrackPointerDown(e: PointerEvent<HTMLDivElement>) {
    dragRef.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    setPlayerLaneFromClientX(e.clientX)
  }

  function onTrackPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return
    setPlayerLaneFromClientX(e.clientX)
  }

  function onTrackPointerUp(e: PointerEvent<HTMLDivElement>) {
    dragRef.current = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  if (phase === 'welcome') {
    return (
      <main className="flex flex-col items-center justify-center min-h-[65vh] px-6 py-10 text-center">
        <div className="text-6xl mb-6">🏎️</div>
        <h1 className="text-2xl font-bold uppercase tracking-[0.2em] text-[#2b2b2b] mb-2">Lilah&apos;s Meal Race</h1>
        <p className="text-sm text-[#2b2b2b]/55 uppercase tracking-widest mb-3 max-w-xs">Vertical racer mode is live</p>
        <p className="text-xs text-[#2b2b2b]/40 mb-10 max-w-xs">Drag Lilah left and right to dodge cones. First to the finish chooses dinner.</p>
        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={startGame}
            className="px-10 py-3 bg-[#b85476] text-[#f0ebe0] font-bold uppercase tracking-[0.2em] text-sm border-2 border-[#2b2b2b] shadow-[4px_4px_0px_#2b2b2b] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#2b2b2b] transition-all duration-100"
          >
            Start Racing!
          </button>
          <button
            onClick={handleSimulateFromScratch}
            className="px-8 py-2.5 bg-[#f0ebe0] text-[#2b2b2b] font-bold uppercase tracking-[0.15em] text-xs border-2 border-[#2b2b2b] shadow-[3px_3px_0px_#2b2b2b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#2b2b2b] transition-all duration-100"
          >
            ⚡ Simulate All 7 Days
          </button>
        </div>
      </main>
    )
  }

  if (phase === 'done') {
    return (
      <main>
        <DoneScreen picks={picks} onPlayAgain={startGame} />
      </main>
    )
  }

  return (
    <main className="max-w-lg mx-auto px-3 py-4">
      <DayStrip picks={picks} />

      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#2b2b2b]/40">Race</p>
          <p className="text-2xl font-bold text-[#2b2b2b]">
            {Math.min(dayNum, 7)}
            <span className="text-sm font-normal text-[#2b2b2b]/40"> / 7</span>
          </p>
        </div>

        {phase !== 'result' && (
          <button
            onClick={handleSimulateAll}
            className="text-[9px] font-bold uppercase tracking-widest text-[#2b2b2b]/40 border border-[#2b2b2b]/20 px-2 py-1 hover:text-[#2b2b2b] transition-colors"
          >
            ⚡ Simulate Rest
          </button>
        )}
      </div>

      <div className="border-2 border-[#2b2b2b] bg-[#1f1f1f] shadow-[4px_4px_0px_#2b2b2b] mb-4">
        <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
          <p className="text-[9px] uppercase tracking-[0.15em] font-bold text-white/45">Vertical Track</p>
          <p className="text-[9px] uppercase tracking-[0.12em] text-white/30">Drag Left / Right</p>
        </div>

        <div
          ref={trackRef}
          onPointerDown={onTrackPointerDown}
          onPointerMove={onTrackPointerMove}
          onPointerUp={onTrackPointerUp}
          onPointerCancel={onTrackPointerUp}
          className="relative h-[460px] overflow-hidden"
          style={{ touchAction: 'none' }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#2b2b2b_0%,#252525_45%,#202020_100%)]" />
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                'repeating-linear-gradient(180deg,transparent 0px,transparent 18px,rgba(255,255,255,0.1) 18px,rgba(255,255,255,0.1) 26px)',
            }}
          />
          <div className="absolute top-3 left-0 right-0 text-center text-[9px] uppercase tracking-[0.3em] text-white/45 font-bold">Finish</div>
          <div className="absolute top-8 left-0 right-0 h-2 bg-[repeating-conic-gradient(#fff_0%_25%,#000_0%_50%)] bg-[length:8px_8px] opacity-85" />

          {obstacles.map(obs => {
            const y = 84 - (obs.progress - playerProgress) * 2.15
            if (y < -8 || y > 90) return null
            return (
              <div
                key={obs.id}
                className={`absolute -translate-x-1/2 -translate-y-1/2 text-[20px] transition-opacity ${
                  obs.hit ? 'opacity-20' : 'opacity-70'
                }`}
                style={{ left: `${obs.laneX * 100}%`, top: `${y}%` }}
              >
                {obs.hit ? '💨' : '🚧'}
              </div>
            )
          })}

          {opponents.map(o => {
            const y = 84 - (o.progress - playerProgress) * 2.15
            if (y < -8 || y > 88) return null
            return (
              <div
                key={o.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${o.laneX * 100}%`, top: `${y}%` }}
              >
                <span className="text-[9px] uppercase tracking-widest text-white/50 mb-0.5">{o.meal.title.split(' ')[0]}</span>
                <span className="text-[30px] leading-none drop-shadow-[0_1px_0_#000]">{o.meal.emoji}</span>
              </div>
            )
          })}

          <div
            className={`absolute bottom-5 -translate-x-1/2 transition-transform ${
              Date.now() < playerSlowUntil ? 'scale-95' : 'scale-100'
            }`}
            style={{ left: `${playerX * 100}%` }}
          >
            <div className="px-1.5 py-0.5 bg-[#b85476] border border-[#2b2b2b] text-[8px] font-bold tracking-widest text-[#f0ebe0] text-center mb-1">
              LILAH
            </div>
            <LilahFace />
          </div>
        </div>

        <div className="px-3 py-2 border-t border-white/10">
          <div className="grid grid-cols-5 gap-1.5">
            <div className="col-span-2 border border-white/10 bg-black/25 px-2 py-1">
              <p className="text-[8px] uppercase tracking-widest text-white/45">Lilah</p>
              <p className="text-xs font-bold text-white">{Math.round(playerProgress)}%</p>
            </div>
            {opponents.slice(0, 3).map(o => (
              <div key={`${o.id}-progress`} className="border border-white/10 bg-black/25 px-2 py-1">
                <p className="text-[8px] uppercase tracking-widest text-white/35 truncate">{o.meal.title.split(' ')[0]}</p>
                <p className="text-xs font-bold text-white">{Math.round(o.progress)}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {phase === 'result' && assignedMeal && (
        <div className="border-2 border-[#2b2b2b] bg-[#2b2b2b] text-[#f0ebe0] px-4 py-4 mb-4 shadow-[4px_4px_0px_#b85476]">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#f0ebe0]/50 mb-1">
            {winner?.isLilah ? "Lilah wins! She picks..." : "Winner!"}
          </p>
          <p className="text-xl font-bold uppercase tracking-[0.1em]">
            {assignedMeal.emoji} {assignedMeal.title}
          </p>
          <p className="text-[9px] text-[#f0ebe0]/40 uppercase tracking-widest mt-1">→ added to {DAYS[picks.length]}</p>
        </div>
      )}

      <div className="flex gap-3 justify-center">
        {phase === 'ready' && (
          <button
            onClick={handleStartRace}
            className="px-8 py-3 bg-[#b85476] text-[#f0ebe0] font-bold uppercase tracking-[0.2em] text-sm border-2 border-[#2b2b2b] shadow-[4px_4px_0px_#2b2b2b] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#2b2b2b] transition-all duration-100"
          >
            ▶ Start Race
          </button>
        )}

        {phase === 'racing' && (
          <button
            onClick={handleSkip}
            className="px-8 py-3 bg-[#f0ebe0] text-[#2b2b2b] font-bold uppercase tracking-[0.15em] text-sm border-2 border-[#2b2b2b] shadow-[4px_4px_0px_#2b2b2b] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#2b2b2b] transition-all duration-100"
          >
            ⚡ Skip to Result
          </button>
        )}

        {phase === 'result' && (
          <button
            onClick={handleNextDay}
            className="px-8 py-3 bg-[#b85476] text-[#f0ebe0] font-bold uppercase tracking-[0.2em] text-sm border-2 border-[#2b2b2b] shadow-[4px_4px_0px_#2b2b2b] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#2b2b2b] transition-all duration-100"
          >
            {picks.length >= 6 ? '🏁 See Full Plan' : `Next Race →`}
          </button>
        )}
      </div>
    </main>
  )
}
