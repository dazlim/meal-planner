import { meals } from '@/data/meals'
import Image from 'next/image'
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
    <main className="min-h-screen bg-white">
      {/* Back Navigation */}
      <nav className="sticky top-0 bg-white/90 backdrop-blur-sm z-10 px-4 py-3 border-b border-gray-100">
        <Link 
          href="/menu" 
          className="inline-flex items-center gap-2 text-fun-pink hover:text-fun-orange transition-colors font-medium"
        >
          <span className="text-xl">←</span>
          <span>Back to menu</span>
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-4 pb-12">
        {/* Hero Image */}
        <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden shadow-lg mt-4">
          <Image
            src={`/images/${meal.image}`}
            alt={meal.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Title & Description */}
        <div className="mt-6 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 flex items-center justify-center gap-2">
            <span className="text-4xl">{meal.emoji}</span>
            {meal.title}
          </h1>
          <p className="mt-2 text-lg text-gray-600">{meal.description}</p>
        </div>

        {/* Ingredients Section */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Ingredients</h2>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Available at Aldi
            </span>
          </div>
          
          <ul className="space-y-2">
            {meal.ingredients.map((ingredient, index) => (
              <li 
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-xl text-fun-pink">☐</span>
                <span className="text-gray-700">{ingredient}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Fun Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            🛒 All ingredients can be found at your local Aldi!
          </p>
        </div>
      </div>
    </main>
  )
}
