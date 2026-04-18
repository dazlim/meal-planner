import { meals as staticMeals } from '@/data/meals'
import { getCustomMeals } from '@/lib/recipes-db'
import MealCard from '@/components/MealCard'
import Header from '@/components/Header'

export const dynamic = 'force-dynamic'

export default async function MenuPage() {
  const customMeals = await getCustomMeals()
  const allMeals = [...staticMeals, ...customMeals]

  return (
    <div className="min-h-screen bg-[#f0ebe0]">
      <Header />

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
