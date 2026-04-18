'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

interface Meal {
  id: string
  title: string
  description: string
  emoji: string
  image: string
  ingredients: string[]
}

interface MealCardProps {
  meal: Meal
}

export default function MealCard({ meal }: MealCardProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <Link 
      href={`/meal/${meal.id}`}
      className="meal-card block hover:scale-105 hover:shadow-lg transition-all duration-200"
    >
      {/* Image */}
      <div className="relative h-40 bg-gradient-to-br from-fun-yellow/20 to-fun-orange/20">
        {meal.image && !imageError ? (
          <Image
            src={`/images/${meal.image}`}
            alt={meal.title}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-6xl">
            {meal.emoji}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="meal-card-title flex items-center gap-1">
          <span className="text-xl">{meal.emoji}</span>
          <span className="text-sm leading-tight">{meal.title}</span>
        </h3>
      </div>
    </Link>
  )
}
