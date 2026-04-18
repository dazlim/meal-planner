import { meals } from '@/data/meals'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  return meals.map((meal) => ({ id: meal.id }))
}

export default function MealPage({ params }: { params: { id: string } }) {
  const meal = meals.find((m) => m.id === params.id)

  if (!meal) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#f0ebe0]">
      <header className="bg-[#2b2b2b] px-4 py-4 border-b-4 border-[#c0492b]">
        <h1 className="text-white font-bold text-lg tracking-[0.2em] uppercase">
          Dinner Menu
        </h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <Link
          href="/menu"
          className="inline-block px-4 py-2 bg-[#c0492b] text-[#f0ebe0] font-bold uppercase tracking-[0.15em] text-sm border-2 border-[#2b2b2b] shadow-[3px_3px_0px_#2b2b2b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#2b2b2b] transition-all duration-100 mb-6"
        >
          ← Back
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{meal.emoji}</span>
          <h2 className="text-xl md:text-3xl font-bold uppercase tracking-[0.1em] text-[#2b2b2b]">
            {meal.title}
          </h2>
        </div>

        <div className="h-1 bg-[#c0492b] mb-6" />

        <div className="bg-[#6b7c52] px-4 py-3 border-2 border-[#2b2b2b] mb-4">
          <span className="text-[#f0ebe0] font-bold uppercase tracking-[0.2em] text-sm">
            Instructions
          </span>
        </div>

        <div className="space-y-4">
          {meal.steps.map((step, index) => (
            <div key={index} className="border-2 border-[#2b2b2b] shadow-[4px_4px_0px_#2b2b2b] bg-[#f0ebe0] p-5">
              <div className="bg-[#6b7c52] p-3 mb-4">
                <p className="text-[#f0ebe0] font-bold uppercase tracking-[0.15em] text-xs mb-2">
                  Ingredients:
                </p>
                <div className="flex flex-wrap gap-2">
                  {step.ingredients.map((ing, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-[#f0ebe0] text-[#2b2b2b] border border-[#2b2b2b] text-xs font-bold"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-[#2b2b2b] text-sm leading-relaxed">
                <span className="text-[#c0492b] font-bold mr-2">{index + 1}.</span>
                {step.instruction}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
