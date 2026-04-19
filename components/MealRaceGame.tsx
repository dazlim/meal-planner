'use client'

import { useState, useEffect, useRef } from 'react'
import { meals as staticMeals } from '@/data/meals'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Meal {
  id: string
  title: string
  emoji: string
}

type RacerStatus = 'ready' | 'racing' | 'hit' | 'finished'

interface Racer {
  id: string
  isLilah: boolean
  meal: Meal | null
  x: number            // 0–100
  baseSpeed: number
  status: RacerStatus
  hitDone: boolean[]   // one per obstacle
  hitsObstacle: boolean[]
  respawnAt: number | null
  hitSeq: number       // increments each time racer is hit, used as animation key
}

type Phase = 'welcome' | 'ready' | 'racing' | 'result' | 'done'

// ─── Constants ────────────────────────────────────────────────────────────────

const OBSTACLE_X = [27, 54, 78]   // % positions along track
const HIT_CHANCE = 0.45
const EXPLOSION_MS = 1800
const TICK_MS = 50
const NUM_MEAL_RACERS = 4          // + Lilah = 5 lanes
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildRacers(pool: Meal[]): Racer[] {
  const chosen = shuffle(pool).slice(0, NUM_MEAL_RACERS)
  const defs = [
    { id: 'lilah', isLilah: true, meal: null },
    ...chosen.map(m => ({ id: m.id, isLilah: false, meal: m })),
  ]
  return defs.map(d => ({
    ...d,
    x: 0,
    baseSpeed: 0.75 + Math.random() * 0.55,
    status: 'ready' as RacerStatus,
    hitDone: OBSTACLE_X.map(() => false),
    hitsObstacle: OBSTACLE_X.map(() => Math.random() < HIT_CHANCE),
    respawnAt: null,
    hitSeq: 0,
  }))
}

function tickRacers(racers: Racer[], now: number): Racer[] {
  return racers.map(r => {
    if (r.status === 'finished') return r

    if (r.status === 'hit') {
      if (r.respawnAt && now >= r.respawnAt) {
        return { ...r, status: 'racing' as RacerStatus, respawnAt: null }
      }
      return r
    }

    const speed = r.baseSpeed * (0.82 + Math.random() * 0.36)
    let newX = r.x + speed
    const hitDone = [...r.hitDone]

    for (let i = 0; i < OBSTACLE_X.length; i++) {
      if (!hitDone[i] && newX >= OBSTACLE_X[i]) {
        hitDone[i] = true
        if (r.hitsObstacle[i]) {
          return {
            ...r,
            x: OBSTACLE_X[i] - 1.5,
            status: 'hit' as RacerStatus,
            hitDone,
            respawnAt: now + EXPLOSION_MS,
            hitSeq: r.hitSeq + 1,
          }
        }
      }
    }

    if (newX >= 100) {
      return { ...r, x: 100, status: 'finished' as RacerStatus, hitDone }
    }

    return { ...r, x: newX, hitDone }
  })
}

function computeWinner(racers: Racer[]): Racer {
  let sim: Racer[] = racers.map(r => ({
    ...r,
    x: 0,
    status: 'racing' as RacerStatus,
    hitDone: r.hitDone.map(() => false),
    respawnAt: null,
  }))

  for (let t = 0; t < 200000; t++) {
    sim = tickRacers(sim, t * TICK_MS)
    const w = sim.find(r => r.status === 'finished')
    if (w) return w
  }
  return sim[0]
}

function pickAssignedMeal(winner: Racer, racers: Racer[]): Meal {
  if (!winner.isLilah && winner.meal) return winner.meal
  // Lilah wins — randomly pick one of the meal racers
  const meals = racers.filter(r => !r.isLilah && r.meal).map(r => r.meal!)
  return meals[Math.floor(Math.random() * meals.length)]
}

// ─── Lilah Face (emoji-sized, for race lane) ──────────────────────────────────

function LilahFace() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" style={{ display: 'block' }}>
      {/* Side hair */}
      <rect x="2" y="8" width="5" height="15" rx="2.5" fill="#1a0f0a" />
      <rect x="23" y="8" width="5" height="15" rx="2.5" fill="#1a0f0a" />
      {/* Hair top */}
      <ellipse cx="15" cy="10" rx="10" ry="8" fill="#1a0f0a" />
      {/* Face */}
      <ellipse cx="15" cy="18" rx="9" ry="10" fill="#f5c4a0" />
      {/* Fringe */}
      <ellipse cx="15" cy="8" rx="9" ry="5" fill="#1a0f0a" />
      {/* Eyes */}
      <circle cx="11.5" cy="17" r="1.5" fill="#2b2b2b" />
      <circle cx="18.5" cy="17" r="1.5" fill="#2b2b2b" />
      <circle cx="12" cy="16.5" r="0.6" fill="white" />
      <circle cx="19" cy="16.5" r="0.6" fill="white" />
      {/* Cheeks */}
      <ellipse cx="9" cy="20" rx="2.2" ry="1.4" fill="#f0a0a0" opacity="0.45" />
      <ellipse cx="21" cy="20" rx="2.2" ry="1.4" fill="#f0a0a0" opacity="0.45" />
      {/* Smile */}
      <path d="M11 23 Q15 27 19 23" stroke="#2b2b2b" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

// ─── Race Lane ────────────────────────────────────────────────────────────────

function RaceLane({ racer, isLeader }: { racer: Racer; isLeader: boolean }) {
  const isHit = racer.status === 'hit'
  const isFinished = racer.status === 'finished'
  const clampedX = Math.min(racer.x, 97)

  return (
    <div className={`flex items-stretch border-b border-[#f0ebe0]/8 last:border-0 ${isLeader && !isHit ? 'bg-[#2e1a28]' : ''}`}>
      {/* Label */}
      <div className="w-[72px] flex-shrink-0 flex items-center px-2 py-0 bg-[#1a1a1a] border-r border-[#f0ebe0]/10">
        <span className={`text-[9px] font-bold uppercase tracking-wide truncate leading-tight ${
          racer.isLilah ? 'text-[#b85476]' : isLeader ? 'text-yellow-300' : 'text-white/50'
        }`}>
          {racer.isLilah ? 'LILAH' : (racer.meal?.title.split(' ').slice(0, 2).join(' ') ?? '')}
        </span>
      </div>

      {/* Track */}
      <div className="flex-1 relative h-11 bg-[#242424] overflow-hidden">
        {/* Road dashes */}
        <div className="absolute top-1/2 left-0 right-0 h-px"
          style={{ backgroundImage: 'repeating-linear-gradient(90deg,rgba(255,255,255,0.08) 0px,rgba(255,255,255,0.08) 20px,transparent 20px,transparent 40px)' }}
        />

        {/* Obstacles */}
        {OBSTACLE_X.map(pos => (
          <div
            key={pos}
            style={{ left: `${pos}%` }}
            className="absolute top-0 h-full flex items-center justify-center z-0 text-base opacity-25 pointer-events-none"
          >
            🚧
          </div>
        ))}

        {/* Finish line */}
        <div
          className="absolute right-0 top-0 h-full w-3 z-10"
          style={{ background: 'repeating-conic-gradient(#fff 0% 25%,#000 0% 50%) 0 0/6px 6px' }}
        />

        {/* Racer */}
        <div
          key={`${racer.id}-${racer.hitSeq}`}
          style={{
            left: `${clampedX}%`,
            transition: isHit ? 'none' : `left ${TICK_MS}ms linear`,
          }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20"
        >
          {isHit ? (
            <span
              style={{ animation: 'race-explode 0.4s ease-out forwards' }}
              className="text-[26px] inline-block"
            >
              💥
            </span>
          ) : isFinished ? (
            <span className="text-[26px] inline-block">🏆</span>
          ) : racer.isLilah ? (
            <LilahFace />
          ) : (
            <span className="text-[26px] inline-block leading-none">{racer.meal?.emoji}</span>
          )}
        </div>

        {/* Smoke trail for hit state */}
        {isHit && (
          <div
            style={{ left: `${clampedX}%` }}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-15 pointer-events-none"
          >
            <span style={{ animation: 'race-smoke 1.4s ease-out 0.4s both' }} className="text-xl inline-block opacity-0">
              💨
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Day Strip ────────────────────────────────────────────────────────────────

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

// ─── Done Screen ──────────────────────────────────────────────────────────────

function DoneScreen({ picks, onPlayAgain }: { picks: Meal[]; onPlayAgain: () => void }) {
  const [orderedPicks, setOrderedPicks] = useState<Meal[]>(picks)
  const [selected, setSelected] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  function handleRowTap(i: number) {
    if (selected === null) {
      setSelected(i)
    } else if (selected === i) {
      setSelected(null)
    } else {
      const next = [...orderedPicks]
      ;[next[selected], next[i]] = [next[i], next[selected]]
      setOrderedPicks(next)
      setSelected(null)
    }
  }

  const planText = DAYS.slice(0, orderedPicks.length)
    .map((day, i) => `${day}  ${orderedPicks[i].emoji}  ${orderedPicks[i].title}`)
    .join('\n')
  const shareText = `🏁 Lilah's Race Week!\n\n${planText}`

  async function handleShare() {
    if (navigator.share) {
      try { await navigator.share({ title: "Lilah's Meal Plan", text: shareText }); return }
      catch { /* fall through */ }
    }
    await navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center px-6 py-10 text-center max-w-sm mx-auto">
      <div className="text-5xl mb-4">🏁</div>
      <h2 className="text-xl font-bold uppercase tracking-[0.15em] text-[#2b2b2b] mb-1">
        Week Planned!
      </h2>
      <p className="text-[10px] text-[#2b2b2b]/40 uppercase tracking-widest mb-5">
        Tap two meals to swap their days
      </p>
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MealRaceGame() {
  const [phase, setPhase] = useState<Phase>('welcome')
  const [racers, setRacers] = useState<Racer[]>([])
  const [winner, setWinner] = useState<Racer | null>(null)
  const [assignedMeal, setAssignedMeal] = useState<Meal | null>(null)
  const [picks, setPicks] = useState<Meal[]>([])
  const [mealPool, setMealPool] = useState<Meal[]>(staticMeals as Meal[])
  const stoppedRef = useRef(false)

  const dayNum = picks.length + 1

  function initRace(pool: Meal[]) {
    setRacers(buildRacers(pool))
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

  // Race animation loop
  useEffect(() => {
    if (phase !== 'racing') return
    stoppedRef.current = false

    // Mark all racers as racing
    setRacers(prev => prev.map(r => ({ ...r, status: r.status === 'ready' ? 'racing' : r.status })))

    const id = setInterval(() => {
      if (stoppedRef.current) return
      const now = Date.now()

      setRacers(prev => {
        const updated = tickRacers(prev, now)
        const w = updated.find(r => r.status === 'finished')
        if (w && !stoppedRef.current) {
          stoppedRef.current = true
          const meal = pickAssignedMeal(w, updated)
          setWinner(w)
          setAssignedMeal(meal)
          setTimeout(() => setPhase('result'), 800)
        }
        return updated
      })
    }, TICK_MS)

    return () => { stoppedRef.current = true; clearInterval(id) }
  }, [phase])

  function handleStartRace() {
    setPhase('racing')
  }

  function handleSkip() {
    stoppedRef.current = true
    const w = computeWinner(racers)
    const meal = pickAssignedMeal(w, racers)
    setWinner(w)
    setAssignedMeal(meal)
    setPhase('result')
  }

  function handleNextDay() {
    if (!assignedMeal) return
    const newPicks = [...picks, assignedMeal]
    const newPool = mealPool.filter(m => m.id !== assignedMeal.id)
    setPicks(newPicks)
    setMealPool(newPool)
    if (newPicks.length >= 7) {
      setPhase('done')
    } else {
      initRace(newPool)
    }
  }

  function handleSimulateAll() {
    let pool = [...mealPool]
    const newPicks = [...picks]
    const remaining = 7 - picks.length
    for (let i = 0; i < remaining; i++) {
      const tempRacers = buildRacers(pool)
      const w = computeWinner(tempRacers)
      const meal = pickAssignedMeal(w, tempRacers)
      newPicks.push(meal)
      pool = pool.filter(m => m.id !== meal.id)
    }
    setPicks(newPicks)
    setMealPool(pool)
    setPhase('done')
  }

  function handleSimulateFromScratch() {
    const pool = staticMeals as Meal[]
    let remaining = [...pool]
    const newPicks: Meal[] = []
    for (let i = 0; i < 7; i++) {
      const tempRacers = buildRacers(remaining)
      const w = computeWinner(tempRacers)
      const meal = pickAssignedMeal(w, tempRacers)
      newPicks.push(meal)
      remaining = remaining.filter(m => m.id !== meal.id)
    }
    setPicks(newPicks)
    setMealPool(remaining)
    setPhase('done')
  }

  // Leader = furthest non-finished racer (or most recently finished)
  const leaderId = racers.reduce<string | null>((best, r) => {
    if (!best) return r.id
    const bestR = racers.find(x => x.id === best)!
    return r.x > bestR.x ? r.id : best
  }, null)

  // ── Welcome ────────────────────────────────────────────────────────────────

  if (phase === 'welcome') {
    return (
      <main className="flex flex-col items-center justify-center min-h-[65vh] px-6 py-10 text-center">
        <div className="text-6xl mb-6">🏎️</div>
        <h1 className="text-2xl font-bold uppercase tracking-[0.2em] text-[#2b2b2b] mb-2">
          Lilah&apos;s Meal Race
        </h1>
        <p className="text-sm text-[#2b2b2b]/50 uppercase tracking-widest mb-3 max-w-xs">
          Race meals to plan your week — 7 races, 7 winners!
        </p>
        <p className="text-xs text-[#2b2b2b]/40 mb-10 max-w-xs">
          Hit an obstacle 💥 and you slow down. First to the flag wins the day.
        </p>
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

  // ── Done ──────────────────────────────────────────────────────────────────

  if (phase === 'done') {
    return (
      <main>
        <DoneScreen picks={picks} onPlayAgain={startGame} />
      </main>
    )
  }

  // ── Ready / Racing / Result ────────────────────────────────────────────────

  return (
    <main className="max-w-lg mx-auto px-3 py-4">
      <style>{`
        @keyframes race-explode {
          0%   { transform: scale(0.6); opacity: 1; }
          50%  { transform: scale(2);   opacity: 0.9; }
          100% { transform: scale(2.5); opacity: 0.5; }
        }
        @keyframes race-smoke {
          0%   { opacity: 0.8; transform: translateY(0) scale(1); }
          100% { opacity: 0;   transform: translateY(-14px) scale(1.6); }
        }
      `}</style>

      {/* Day strip */}
      <DayStrip picks={picks} />

      {/* Day counter + controls row */}
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

      {/* Track */}
      <div className="border-2 border-[#2b2b2b] overflow-hidden shadow-[4px_4px_0px_#2b2b2b] mb-4">
        {/* Track header */}
        <div className="flex bg-[#1a1a1a] border-b-2 border-[#2b2b2b]">
          <div className="w-[72px] flex-shrink-0 px-2 py-1 border-r border-[#f0ebe0]/10">
            <span className="text-[8px] text-white/20 uppercase tracking-widest">Lane</span>
          </div>
          <div className="flex-1 relative py-1 px-2">
            <span className="text-[8px] text-white/20 uppercase tracking-widest">Start</span>
            <span className="absolute right-3 text-[8px] text-white/30 uppercase tracking-widest">🏁 Finish</span>
          </div>
        </div>

        {racers.map(racer => (
          <RaceLane
            key={racer.id}
            racer={racer}
            isLeader={racer.id === leaderId && phase === 'racing'}
          />
        ))}
      </div>

      {/* Result banner */}
      {phase === 'result' && assignedMeal && (
        <div className="border-2 border-[#2b2b2b] bg-[#2b2b2b] text-[#f0ebe0] px-4 py-4 mb-4 shadow-[4px_4px_0px_#b85476]">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#f0ebe0]/50 mb-1">
            {winner?.isLilah ? "Lilah wins! She picks..." : "Winner!"}
          </p>
          <p className="text-xl font-bold uppercase tracking-[0.1em]">
            {assignedMeal.emoji} {assignedMeal.title}
          </p>
          <p className="text-[9px] text-[#f0ebe0]/40 uppercase tracking-widest mt-1">
            → added to {DAYS[picks.length]}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 justify-center">
        {phase === 'ready' && (
          <>
            <button
              onClick={handleStartRace}
              className="px-8 py-3 bg-[#b85476] text-[#f0ebe0] font-bold uppercase tracking-[0.2em] text-sm border-2 border-[#2b2b2b] shadow-[4px_4px_0px_#2b2b2b] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#2b2b2b] transition-all duration-100"
            >
              ▶ Race!
            </button>
            <button
              onClick={handleSkip}
              className="px-6 py-3 bg-[#f0ebe0] text-[#2b2b2b] font-bold uppercase tracking-[0.15em] text-sm border-2 border-[#2b2b2b] shadow-[4px_4px_0px_#2b2b2b] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#2b2b2b] transition-all duration-100"
            >
              ⚡ Sim
            </button>
          </>
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
