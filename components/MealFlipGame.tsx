'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { meals as staticMeals } from '@/data/meals'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Meal {
  id: string
  title: string
  emoji: string
  image: string
}

interface Card {
  id: string      // `${meal.id}-a` or `${meal.id}-b`
  mealId: string
  meal: Meal
}

type Phase = 'welcome' | 'playing' | 'done'
type LilaState = 'idle' | 'happy' | 'sad'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildCards(): Card[] {
  const chosen = shuffle(staticMeals as Meal[]).slice(0, 8)
  return shuffle([
    ...chosen.map(m => ({ id: `${m.id}-a`, mealId: m.id, meal: m })),
    ...chosen.map(m => ({ id: `${m.id}-b`, mealId: m.id, meal: m })),
  ])
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#b85476', '#7a5a90', '#f0ebe0', '#2b2b2b']

function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    key: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.8,
    duration: 2 + Math.random() * 2,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 8 + Math.floor(Math.random() * 8),
  }))

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          0%   { top: -5%; transform: rotate(0deg); opacity: 1; }
          100% { top: 108vh; transform: rotate(720deg); opacity: 0.6; }
        }
      `}</style>
      {pieces.map(p => (
        <div
          key={p.key}
          style={{
            position: 'fixed',
            left: `${p.left}%`,
            top: '-5%',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.size > 12 ? '50%' : '2px',
            animationName: 'confetti-fall',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            animationTimingFunction: 'linear',
            animationFillMode: 'both',
            pointerEvents: 'none',
            zIndex: 50,
          }}
        />
      ))}
    </>
  )
}

// ─── Lilah SVG Mascot ─────────────────────────────────────────────────────────

function LilahCharacter({ state }: { state: LilaState }) {
  return (
    <>
      <style>{`
        @keyframes lila-idle {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-4px); }
        }
        @keyframes lila-happy {
          0%   { transform: translateY(0px) scale(1); }
          30%  { transform: translateY(-14px) scale(1.25); }
          60%  { transform: translateY(-4px) scale(1.1); }
          100% { transform: translateY(0px) scale(1); }
        }
        @keyframes lila-sad {
          0%   { transform: translateX(0); }
          15%  { transform: translateX(-7px); }
          30%  { transform: translateX(7px); }
          45%  { transform: translateX(-7px); }
          60%  { transform: translateX(7px); }
          75%  { transform: translateX(-4px); }
          100% { transform: translateX(0); }
        }
        .lila-idle  { animation: lila-idle  2.4s ease-in-out infinite; }
        .lila-happy { animation: lila-happy 0.6s ease-in-out; }
        .lila-sad   { animation: lila-sad   0.7s ease-in-out; }
      `}</style>
      <svg
        width="70"
        height="90"
        viewBox="0 0 70 90"
        className={`lila-${state}`}
        aria-label="Lilah character"
      >
        {/* Long side hair strands — sit OUTSIDE face x-extent (face spans x 21–49) */}
        <rect x="12" y="16" width="10" height="58" rx="5" fill="#1a0f0a" />
        <rect x="48" y="16" width="10" height="58" rx="5" fill="#1a0f0a" />
        {/* Hair top blob */}
        <ellipse cx="35" cy="18" rx="17" ry="13" fill="#1a0f0a" />
        {/* Neck */}
        <rect x="29" y="43" width="12" height="10" fill="#f5c4a0" />
        {/* Body / sweater */}
        <path d="M16 53 Q35 48 54 53 L57 84 Q35 89 13 84 Z" fill="#7a5a90" />
        {/* Sweater neckline */}
        <path d="M23 55 Q35 63 47 55" stroke="#9070b0" strokeWidth="1.5" fill="none" />
        {/* Arms */}
        <path d="M16 58 Q7 66 9 76" stroke="#7a5a90" strokeWidth="8" strokeLinecap="round" fill="none" />
        <path d="M54 58 Q63 66 61 76" stroke="#7a5a90" strokeWidth="8" strokeLinecap="round" fill="none" />
        {/* Hands */}
        <circle cx="9" cy="77" r="5" fill="#f5c4a0" />
        <circle cx="61" cy="77" r="5" fill="#f5c4a0" />
        {/* Face — oval, rendered after hair so it covers any edge overlap */}
        <ellipse cx="35" cy="28" rx="14" ry="16" fill="#f5c4a0" />
        {/* Fringe / bangs */}
        <ellipse cx="35" cy="14" rx="14" ry="8" fill="#1a0f0a" />
        <path d="M22 18 Q29 12 35 14 Q41 12 48 18" fill="#1a0f0a" />
        {/* Eyes */}
        <circle cx="29.5" cy="27" r="2.5" fill="#2b2b2b" />
        <circle cx="40.5" cy="27" r="2.5" fill="#2b2b2b" />
        {/* Eye shine */}
        <circle cx="30.5" cy="26" r="0.9" fill="white" />
        <circle cx="41.5" cy="26" r="0.9" fill="white" />
        {/* Rosy cheeks */}
        <ellipse cx="23" cy="34" rx="4" ry="2.5" fill="#f0a0a0" opacity="0.5" />
        <ellipse cx="47" cy="34" rx="4" ry="2.5" fill="#f0a0a0" opacity="0.5" />
        {/* Smile */}
        {state === 'sad' ? (
          <path d="M28 40 Q35 37 42 40" stroke="#2b2b2b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M28 38 Q35 43 42 38" stroke="#2b2b2b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        )}
      </svg>
    </>
  )
}

// ─── Day Strip ────────────────────────────────────────────────────────────────

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

interface DayStripProps {
  picks: Meal[]
  selectedDay: number | null
  onDayTap: (i: number) => void
}

function DayStrip({ picks, selectedDay, onDayTap }: DayStripProps) {
  return (
    <div className="grid grid-cols-7 gap-1 mb-4">
      {DAYS.map((day, i) => {
        const filled = !!picks[i]
        const isSelected = selectedDay === i
        return (
          <div
            key={day}
            onClick={() => filled && onDayTap(i)}
            className={`flex flex-col items-center border-2 py-1 transition-colors duration-200
              ${filled ? 'cursor-pointer' : 'cursor-default'}
              ${isSelected
                ? 'bg-[#b85476] border-[#b85476]'
                : filled
                  ? 'bg-[#7a5a90] border-[#2b2b2b] active:bg-[#5a3a70]'
                  : 'bg-[#f0ebe0] border-[#2b2b2b]'
              }`}
          >
            <span className={`text-[8px] font-bold uppercase tracking-wide ${
              filled ? 'text-[#f0ebe0]' : 'text-[#2b2b2b]/40'
            }`}>
              {day}
            </span>
            <span className="text-base leading-none">{picks[i]?.emoji ?? '·'}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Welcome Screen ───────────────────────────────────────────────────────────

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-10 text-center">
      <div className="mb-6">
        <LilahCharacter state="idle" />
      </div>
      <h1 className="text-2xl font-bold uppercase tracking-[0.2em] text-[#2b2b2b] mb-2">
        Lilah&apos;s Meal Picker
      </h1>
      <p className="text-sm text-[#2b2b2b]/60 uppercase tracking-widest mb-10 max-w-xs">
        Flip the cards to match meals and plan your week!
      </p>
      <button
        onClick={onStart}
        className="px-10 py-3 bg-[#b85476] text-[#f0ebe0] font-bold uppercase tracking-[0.2em] text-sm border-2 border-[#2b2b2b] shadow-[4px_4px_0px_#2b2b2b] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#2b2b2b] transition-all duration-100"
      >
        Let&apos;s Go!
      </button>
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
  const shareText = `🎉 Lilah's Week is Planned!\n\n${planText}`

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
      <div className="mb-4">
        <LilahCharacter state="happy" />
      </div>
      <h2 className="text-xl font-bold uppercase tracking-[0.15em] text-[#2b2b2b] mb-1">
        🎉 Lilah&apos;s Week is Planned!
      </h2>
      <p className="text-[10px] text-[#2b2b2b]/40 uppercase tracking-widest mb-5">
        Tap two meals to swap their days
      </p>
      <div className="w-full border-2 border-[#2b2b2b] bg-white shadow-[4px_4px_0px_#2b2b2b] mb-8">
        {orderedPicks.map((meal, i) => {
          const isSelected = selected === i
          return (
            <div
              key={meal.id + i}
              onClick={() => handleRowTap(i)}
              className={`flex items-center gap-3 px-4 py-3 border-b border-[#2b2b2b]/10 last:border-0 cursor-pointer transition-colors duration-150
                ${isSelected ? 'bg-[#7a5a90]' : 'hover:bg-[#f0ebe0] active:bg-[#e8e0d0]'}`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-widest w-8 ${
                isSelected ? 'text-[#f0ebe0]' : 'text-[#2b2b2b]/40'
              }`}>
                {DAYS[i]}
              </span>
              <span className="text-xl">{meal.emoji}</span>
              <span className={`text-sm font-bold uppercase tracking-[0.1em] flex-1 text-left ${
                isSelected ? 'text-[#f0ebe0]' : 'text-[#2b2b2b]'
              }`}>
                {meal.title}
              </span>
              {isSelected && (
                <span className="text-[#f0ebe0] text-xs">↕</span>
              )}
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

// ─── Main Game ────────────────────────────────────────────────────────────────

export default function MealFlipGame() {
  const [phase, setPhase] = useState<Phase>('welcome')
  const [cards, setCards] = useState<Card[]>([])
  const [flipped, setFlipped] = useState<string[]>([])
  const [matched, setMatched] = useState<string[]>([])
  const [picks, setPicks] = useState<Meal[]>([])
  const [canFlip, setCanFlip] = useState(true)
  const [lilaState, setLilaState] = useState<LilaState>('idle')
  const [showConfetti, setShowConfetti] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  function startGame() {
    setCards(buildCards())
    setFlipped([])
    setMatched([])
    setPicks([])
    setCanFlip(true)
    setLilaState('idle')
    setShowConfetti(false)
    setSelectedDay(null)
    setPhase('playing')
  }

  function handleDayTap(i: number) {
    if (selectedDay === null) {
      setSelectedDay(i)
    } else if (selectedDay === i) {
      setSelectedDay(null)
    } else {
      setPicks(prev => {
        const next = [...prev]
        ;[next[selectedDay], next[i]] = [next[i], next[selectedDay]]
        return next
      })
      setSelectedDay(null)
    }
  }

  const handleFlip = useCallback((card: Card) => {
    if (!canFlip) return
    if (matched.includes(card.id)) return
    if (flipped.includes(card.id)) return
    if (flipped.length === 2) return

    const next = [...flipped, card.id]
    setFlipped(next)

    if (next.length === 2) {
      const [a, b] = next.map(id => cards.find(c => c.id === id)!)

      if (a.mealId === b.mealId) {
        // Match!
        setTimeout(() => {
          setMatched(prev => {
            const newMatched = [...prev, a.id, b.id]
            return newMatched
          })
          setPicks(prev => {
            const newPicks = prev.length < 7 ? [...prev, a.meal] : prev
            if (newPicks.length === 7) {
              setShowConfetti(true)
              setTimeout(() => {
                setPhase('done')
                setShowConfetti(false)
              }, 2500)
            }
            return newPicks
          })
          setFlipped([])
          setLilaState('happy')
          setTimeout(() => setLilaState('idle'), 700)
        }, 500)
      } else {
        // No match
        setCanFlip(false)
        setLilaState('sad')
        setTimeout(() => {
          setFlipped([])
          setCanFlip(true)
          setLilaState('idle')
        }, 800)
      }
    }
  }, [canFlip, matched, flipped, cards])

  if (phase === 'welcome') {
    return (
      <main>
        <WelcomeScreen onStart={startGame} />
      </main>
    )
  }

  if (phase === 'done') {
    return (
      <main>
        {showConfetti && <Confetti />}
        <DoneScreen picks={picks} onPlayAgain={startGame} />
      </main>
    )
  }

  // Playing
  return (
    <main className="max-w-lg mx-auto px-3 py-4">
      {showConfetti && <Confetti />}

      {/* Day strip */}
      <DayStrip picks={picks} selectedDay={selectedDay} onDayTap={handleDayTap} />

      {/* Score + Lilah row */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#2b2b2b]/40">
            Matched
          </p>
          <p className="text-2xl font-bold text-[#2b2b2b]">
            {picks.length}
            <span className="text-sm font-normal text-[#2b2b2b]/40"> / 7</span>
          </p>
        </div>
        <LilahCharacter state={lilaState} />
      </div>

      {/* 4×4 card grid */}
      <div className="grid grid-cols-4 gap-2">
        {cards.map(card => {
          const isFaceUp = flipped.includes(card.id) || matched.includes(card.id)
          const isMatched = matched.includes(card.id)

          return (
            <div
              key={card.id}
              onClick={() => handleFlip(card)}
              style={{ perspective: '600px' }}
              className="cursor-pointer aspect-square"
            >
              <div
                style={{
                  transition: 'transform 0.45s',
                  transformStyle: 'preserve-3d',
                  transform: isFaceUp ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                }}
              >
                {/* Face DOWN */}
                <div
                  style={{ backfaceVisibility: 'hidden' }}
                  className="absolute inset-0 bg-[#2b2b2b] border-2 border-[#2b2b2b] flex items-center justify-center"
                >
                  <span className="text-2xl text-[#f0ebe0]/30">?</span>
                </div>

                {/* Face UP */}
                <div
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                  className="absolute inset-0 border-2 border-[#2b2b2b] overflow-hidden"
                >
                  <Image
                    src={`/images/${card.meal.image}`}
                    alt={card.meal.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 512px) 25vw, 128px"
                  />
                  {isMatched && (
                    <div className="absolute inset-0 bg-[#7a5a90]/70 flex items-center justify-center">
                      <span className="text-3xl text-white">✓</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-center text-[10px] text-[#2b2b2b]/30 uppercase tracking-widest mt-4">
        Match 7 pairs to fill the week
      </p>
    </main>
  )
}
