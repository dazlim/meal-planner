import { meals } from '@/data/meals'
import MealCard from '@/components/MealCard'

export default function MenuPage() {
  return (
    <div className="min-h-screen bg-[#f0ebe0]">
      <header className="bg-[#2b2b2b] px-4 py-4 border-b-4 border-[#c0492b]">
        <h1 className="text-white font-bold text-lg tracking-[0.2em] uppercase">
          Dinner Menu
        </h1>
      </header>

      <main className="max-w-3xl mx-auto p-4">
        <div className="space-y-3 mt-2">
          {meals.map((meal) => (
            <MealCard key={meal.id} meal={meal} />
          ))}
        </div>
      </main>
    </div>
  )
}
