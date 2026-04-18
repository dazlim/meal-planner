import { meals as staticMeals } from '@/data/meals'
import { getCustomMeals } from '@/lib/recipes-db'
import type { CustomMeal } from '@/lib/recipes-db'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import MealDetailView from '@/components/MealDetailView'
import type { AnyMeal } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function MealPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { view?: string }
}) {
  const initialView = searchParams.view === 'shopping' ? 'shopping' : 'instructions'

  const staticMeal = staticMeals.find((m) => m.id === params.id)

  if (staticMeal) {
    return <MealDetail meal={staticMeal} initialView={initialView} />
  }

  const customMeals = await getCustomMeals()
  const customMeal = customMeals.find((m: CustomMeal) => m.id === params.id)

  if (!customMeal) notFound()

  return <MealDetail meal={customMeal} initialView={initialView} />
}

function MealDetail({
  meal,
  initialView,
}: {
  meal: AnyMeal
  initialView: 'instructions' | 'shopping'
}) {
  return (
    <div className="min-h-screen bg-[#f0ebe0]">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-6">
        <Link
          href="/menu"
          className="inline-block px-4 py-2 bg-[#b85476] text-[#f0ebe0] font-bold uppercase tracking-[0.15em] text-sm border-2 border-[#2b2b2b] shadow-[3px_3px_0px_#2b2b2b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#2b2b2b] transition-all duration-100 mb-6"
        >
          ← Back
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{meal.emoji}</span>
          <h2 className="text-xl md:text-3xl font-bold uppercase tracking-[0.1em] text-[#2b2b2b]">
            {meal.title}
          </h2>
        </div>

        {meal.description && (
          <p className="text-sm text-[#2b2b2b]/60 mb-4 tracking-wide">{meal.description}</p>
        )}

        {meal.image && (
          <div className="mb-4 border-2 border-[#2b2b2b] shadow-[6px_6px_0px_#2b2b2b] overflow-hidden">
            <Image
              src={`/images/${meal.image}`}
              alt={meal.title}
              width={800}
              height={500}
              className="w-full h-auto block"
              priority
            />
          </div>
        )}

        <div className="h-1 bg-[#b85476] mb-6" />

        <MealDetailView meal={meal} initialView={initialView} />
      </main>
    </div>
  )
}
