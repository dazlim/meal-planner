import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import { meals } from '@/data/meals'

export default function CoverPage() {
  return (
    <div className="min-h-screen bg-[#f0ebe0]">
      <Header />

      <main>
        {/* Hero section */}
        <div className="flex flex-col items-center px-6 pt-16 pb-12">
          <div className="relative w-full max-w-sm h-56 md:h-72 mb-10 overflow-hidden border-4 border-[#2b2b2b] shadow-[8px_8px_0px_#2b2b2b]">
            <Image
              src="/images/kids-dinner-menu_b35b1ab6.png"
              alt="Kids Dinner Menu"
              fill
              className="object-cover"
              priority
            />
          </div>

          <h2 className="text-2xl md:text-4xl font-bold text-center mb-3 text-[#2b2b2b] uppercase tracking-[0.15em]">
            What&apos;s for Dinner?
          </h2>

          <p className="text-sm text-[#2b2b2b]/50 text-center mb-10 tracking-wider uppercase">
            Pick tonight&apos;s meal
          </p>

          <Link
            href="/menu"
            className="px-8 py-3 bg-[#b85476] text-[#f0ebe0] font-bold uppercase tracking-[0.15em] text-sm border-2 border-[#2b2b2b] shadow-[4px_4px_0px_#2b2b2b] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#2b2b2b] transition-all duration-100"
          >
            See the Menu →
          </Link>
        </div>

        {/* Meal grid */}
        <div className="max-w-3xl mx-auto px-4 pb-16">
          <div className="flex items-center gap-4 mb-5">
            <div className="h-px flex-1 bg-[#2b2b2b]/20" />
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#2b2b2b]/40">
              Tonight&apos;s Options
            </span>
            <div className="h-px flex-1 bg-[#2b2b2b]/20" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {meals.map((meal) => (
              <Link
                key={meal.id}
                href={`/meal/${meal.id}`}
                className="group border-2 border-[#2b2b2b] shadow-[4px_4px_0px_#2b2b2b] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#2b2b2b] transition-all duration-100 overflow-hidden bg-[#f0ebe0]"
              >
                <div className="relative h-28 md:h-32 overflow-hidden border-b-2 border-[#2b2b2b]">
                  <Image
                    src={`/images/${meal.image}`}
                    alt={meal.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <div className="px-3 py-2">
                  <span className="text-base leading-none">{meal.emoji}</span>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#2b2b2b] mt-1 leading-tight">
                    {meal.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
