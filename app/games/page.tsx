import Link from 'next/link'
import Header from '@/components/Header'

const GAMES = [
  {
    href: '/game',
    title: "Meal Flip",
    tagline: 'Memory Match',
    description: 'Flip cards to find matching meals and fill your whole week!',
    icon: '🃏',
    accent: '#7a5a90',
  },
  {
    href: '/games/race',
    title: "Meal Race",
    tagline: 'Racing',
    description: 'Race meal emojis against Lilah to decide your weekly dinner plan!',
    icon: '🏎️',
    accent: '#b85476',
  },
]

export default function GamesPage() {
  return (
    <div className="min-h-screen bg-[#f0ebe0]">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold uppercase tracking-[0.2em] text-[#2b2b2b]">
            Lilah&apos;s Games
          </h1>
          <p className="text-xs text-[#2b2b2b]/40 uppercase tracking-widest mt-2">
            Pick a game to plan your week
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {GAMES.map(game => (
            <Link
              key={game.href}
              href={game.href}
              className="block border-2 border-[#2b2b2b] bg-white shadow-[6px_6px_0px_#2b2b2b] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_#2b2b2b] transition-all duration-100"
            >
              <div className="flex items-stretch">
                <div
                  style={{ backgroundColor: game.accent }}
                  className="w-24 flex items-center justify-center text-5xl flex-shrink-0 border-r-2 border-[#2b2b2b]"
                >
                  {game.icon}
                </div>
                <div className="px-4 py-4 flex-1 min-w-0">
                  <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#2b2b2b]/40 mb-1">
                    {game.tagline}
                  </div>
                  <h2 className="text-base font-bold uppercase tracking-[0.1em] text-[#2b2b2b] mb-1">
                    {game.title}
                  </h2>
                  <p className="text-[11px] text-[#2b2b2b]/60 leading-relaxed">
                    {game.description}
                  </p>
                </div>
                <div className="flex items-center pr-4 text-[#2b2b2b]/30 text-lg flex-shrink-0">
                  →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
