'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import Header from '@/components/Header'
import { clearMealCart, getCartUpdatedEventName, getMealCart, type CartMeal } from '@/lib/meal-cart'

interface CollatedItem {
  key: string
  name: string
  count: number
  recipeCount: number
  variants: string[]
}

function normalizeIngredientName(ingredient: string) {
  return ingredient
    .split('(')[0]
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
}

function displayIngredientName(ingredient: string) {
  return ingredient.split('(')[0].trim()
}

function collateIngredients(meals: CartMeal[]): CollatedItem[] {
  const map = new Map<string, { name: string; count: number; recipes: Set<string>; variants: Set<string> }>()

  for (const meal of meals) {
    for (const ingredient of meal.ingredients) {
      const key = normalizeIngredientName(ingredient) || ingredient.toLowerCase()
      const existing = map.get(key)
      if (existing) {
        existing.count += 1
        existing.recipes.add(meal.title)
        existing.variants.add(ingredient)
      } else {
        map.set(key, {
          name: displayIngredientName(ingredient),
          count: 1,
          recipes: new Set([meal.title]),
          variants: new Set([ingredient]),
        })
      }
    }
  }

  return Array.from(map.entries())
    .map(([key, value]) => ({
      key,
      name: value.name,
      count: value.count,
      recipeCount: value.recipes.size,
      variants: Array.from(value.variants),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export default function FullShoppingListPage() {
  const [cartMeals, setCartMeals] = useState<CartMeal[]>([])
  const [checked, setChecked] = useState<Set<string>>(new Set())

  useEffect(() => {
    const update = () => setCartMeals(getMealCart())
    update()
    window.addEventListener(getCartUpdatedEventName(), update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener(getCartUpdatedEventName(), update)
      window.removeEventListener('storage', update)
    }
  }, [])

  const items = useMemo(() => collateIngredients(cartMeals), [cartMeals])

  function toggleItem(key: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-[#f0ebe0]">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <Link
            href="/menu"
            className="inline-block px-4 py-2 bg-[#b85476] text-[#f0ebe0] font-bold uppercase tracking-[0.15em] text-sm border-2 border-[#2b2b2b] shadow-[3px_3px_0px_#2b2b2b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#2b2b2b] transition-all duration-100"
          >
            ← Back to Menu
          </Link>
          <button
            onClick={() => {
              clearMealCart()
              setChecked(new Set())
            }}
            className="inline-block px-4 py-2 bg-[#f0ebe0] text-[#2b2b2b]/70 font-bold uppercase tracking-[0.15em] text-sm border-2 border-[#2b2b2b]"
          >
            Clear Cart
          </button>
        </div>

        <div className="bg-[#b85476] px-4 py-3 border-2 border-[#2b2b2b] mb-4">
          <span className="text-[#f0ebe0] font-bold uppercase tracking-[0.2em] text-sm">
            Full Shopping List
          </span>
        </div>

        <div className="border-2 border-[#2b2b2b] bg-white shadow-[4px_4px_0px_#2b2b2b] px-4 py-3 mb-4">
          <p className="text-xs text-[#2b2b2b]/70 uppercase tracking-[0.12em]">
            {cartMeals.length} recipes in cart • {items.length} combined ingredients
          </p>
        </div>

        {items.length === 0 ? (
          <div className="border-2 border-[#2b2b2b] bg-white p-6">
            <p className="text-sm text-[#2b2b2b]/70">
              Your cart is empty. Add meals from the menu and your combined list will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const isChecked = checked.has(item.key)
              return (
                <div
                  key={item.key}
                  className={`border-2 border-[#2b2b2b] p-4 transition-colors ${
                    isChecked ? 'bg-[#2b2b2b]/10' : 'bg-[#f0ebe0]'
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleItem(item.key)}
                      className="mt-1 w-4 h-4 accent-[#b85476] flex-shrink-0 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${isChecked ? 'line-through text-[#2b2b2b]/40' : 'text-[#2b2b2b]'}`}>
                        {item.name}
                        {item.count > 1 ? ` ×${item.count}` : ''}
                      </p>
                      <p className="text-xs text-[#2b2b2b]/55 mt-1">
                        Used across {item.recipeCount} {item.recipeCount === 1 ? 'recipe' : 'recipes'}
                      </p>
                      {!isChecked && item.variants.length > 0 && (
                        <p className="text-xs text-[#7a5a90] mt-2">
                          e.g. {item.variants.slice(0, 2).join(' • ')}
                        </p>
                      )}
                    </div>
                  </label>
                </div>
              )
            })}
          </div>
        )}

        <div className="border-2 border-[#2b2b2b] bg-[#7a5a90] p-4 mt-6">
          <p className="text-[#f0ebe0] text-xs font-bold uppercase tracking-[0.1em]">
            {items.length === 0
              ? 'Add meals to cart from the menu.'
              : checked.size === items.length
                ? '✓ Everything collected.'
                : `${checked.size} of ${items.length} collated items collected.`}
          </p>
        </div>
      </main>
    </div>
  )
}
