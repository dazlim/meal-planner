import { meals } from '@/data/meals'
import MealCard from '@/components/MealCard'

export default function MenuPage() {
  return (
    <main className="min-h-screen py-8 px-4">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-fun-pink via-fun-orange to-fun-yellow mb-2">
          What's for Dinner? 🍽️
        </h1>
        <p className="text-gray-600 text-lg">Tap a meal to see ingredients!</p>
      </header>

      {/* Meal Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {meals.map((meal, index) => (
          <MealCard key={meal.id} meal={meal} />
        ))}
      </div>

      {/* Footer */}
      <footer className="text-center mt-12 text-gray-500 text-sm">
        Made with ❤️ for little food choosers
      </footer>
    </main>
  )
}
