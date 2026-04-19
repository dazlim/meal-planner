'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getCartUpdatedEventName, isMealInCart, toggleMealInCart } from '@/lib/meal-cart'

interface MealCardProps {
  meal: {
    id: string
    title: string
    emoji: string
    ingredients: string[]
  }
}

export default function MealCard({ meal }: MealCardProps) {
  const [inCart, setInCart] = useState(false)

  useEffect(() => {
    const update = () => setInCart(isMealInCart(meal.id))
    update()
    window.addEventListener(getCartUpdatedEventName(), update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener(getCartUpdatedEventName(), update)
      window.removeEventListener('storage', update)
    }
  }, [meal.id])

  function handleToggleCart() {
    const next = toggleMealInCart({
      id: meal.id,
      title: meal.title,
      emoji: meal.emoji,
      ingredients: meal.ingredients,
    })
    setInCart(next)
  }

  return (
    <div className="flex items-stretch border-2 border-[#2b2b2b] shadow-[4px_4px_0px_#2b2b2b] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#2b2b2b] transition-all duration-100 bg-[#f0ebe0]">
      <Link
        href={`/meal/${meal.id}`}
        className="flex items-center gap-4 flex-1 p-5"
      >
        <span className="text-2xl flex-shrink-0">{meal.emoji}</span>
        <span className="text-[#2b2b2b] font-bold uppercase tracking-[0.15em] text-sm">
          {meal.title}
        </span>
      </Link>
      <button
        onClick={handleToggleCart}
        className={`flex items-center justify-center px-4 border-l-2 border-[#2b2b2b] transition-colors duration-100 flex-shrink-0 ${
          inCart ? 'bg-[#b85476] text-[#f0ebe0] border-[#b85476]' : 'text-[#2b2b2b]/50 hover:bg-[#b85476] hover:text-[#f0ebe0] hover:border-[#b85476]'
        }`}
        title={inCart ? 'Remove from cart' : 'Add to cart'}
        aria-label={`${inCart ? 'Remove' : 'Add'} ${meal.title} ${inCart ? 'from' : 'to'} cart`}
        aria-pressed={inCart}
      >
        <span className="text-lg">🛒</span>
      </button>
    </div>
  )
}
