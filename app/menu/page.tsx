import { meals as staticMeals } from '@/data/meals'
import { getCustomMeals } from '@/lib/recipes-db'
import MealCard from '@/components/MealCard'

export const dynamic = 'force-dynamic'

export default async function MenuPage() {
  const customMeals = await getCustomMeals()
  const allMeals = [...staticMeals, ...customMeals]

  return (
    <div className="min-h-screen bg-[#f0ebe0]">
      <header className="bg-[#2b2b2b] px-4 py-4 border-b-4 border-[#c0492b]">
        <h1 className="text-white font-bold text-lg tracking-[0.2em] uppercase">
          Dinner Menu
        </h1>
      </header>

      <main className="max-w-3xl mx-auto p-4">
        <div className="space-y-3 mt-2">
          {allMeals.map((meal) => (
            <MealCard key={meal.id} meal={meal} />
          ))}
        </div>
      </main>
    </div>
  )
}
