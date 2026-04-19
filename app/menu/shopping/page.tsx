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

type SortMode = 'alpha' | 'category'

const CHECKED_KEY = 'full-shopping-checked-v1'
const SORT_MODE_KEY = 'full-shopping-sort-v1'

const CATEGORY_ORDER = [
  'Vegetables & Fruit',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Rice, Pasta & Grains',
  'Bread & Bakery',
  'Canned & Jarred',
  'Sauces, Spices & Oils',
  'Frozen',
  'Pantry & Other',
] as const

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

function resolveIngredientCategory(ingredientName: string) {
  const t = ingredientName.toLowerCase()

  if (/(chicken|beef|lamb|pork|sausage|mince|fish|salmon|prawn|tuna|bacon|pepperoni)/.test(t)) return 'Meat & Seafood'
  if (/(milk|cheese|mozzarella|parmesan|butter|cream|yoghurt|yogurt|egg)/.test(t)) return 'Dairy & Eggs'
  if (/(rice|pasta|spaghetti|linguine|penne|noodle|flour|grain|quinoa|couscous|oat)/.test(t)) return 'Rice, Pasta & Grains'
  if (/(bread|bun|roll|taco shell|pizza base|nori|wrap)/.test(t)) return 'Bread & Bakery'
  if (/(canned|can|jar|beans|tomatoes|stock|broth)/.test(t)) return 'Canned & Jarred'
  if (/(sauce|soy|oil|vinegar|salt|pepper|paprika|oregano|curry|spice|sesame|honey|mustard|ketchup|worcestershire)/.test(t)) return 'Sauces, Spices & Oils'
  if (/(frozen|chips|peas|fish fingers)/.test(t)) return 'Frozen'
  if (/(onion|garlic|ginger|carrot|broccoli|capsicum|tomato|lettuce|zucchini|celery|potato|avocado|spring onion|mushroom|lemon|parsley)/.test(t)) return 'Vegetables & Fruit'
  return 'Pantry & Other'
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
  const [sortMode, setSortMode] = useState<SortMode>('category')

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

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CHECKED_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as string[]
      if (Array.isArray(parsed)) setChecked(new Set(parsed))
    } catch {
      // ignore invalid local storage
    }

    const savedSort = window.localStorage.getItem(SORT_MODE_KEY)
    if (savedSort === 'alpha' || savedSort === 'category') {
      setSortMode(savedSort)
    }
  }, [])

  const items = useMemo(() => collateIngredients(cartMeals), [cartMeals])
  const categories = useMemo(() => {
    const grouped = new Map<string, CollatedItem[]>()
    for (const item of items) {
      const category = resolveIngredientCategory(item.name)
      const list = grouped.get(category) ?? []
      list.push(item)
      grouped.set(category, list)
    }
    for (const [, list] of grouped) {
      list.sort((a, b) => a.name.localeCompare(b.name))
    }
    return CATEGORY_ORDER
      .map((category) => ({ category, items: grouped.get(category) ?? [] }))
      .filter((group) => group.items.length > 0)
  }, [items])

  useEffect(() => {
    const validKeys = new Set(items.map((item) => item.key))
    setChecked((prev) => {
      const next = new Set(Array.from(prev).filter((key) => validKeys.has(key)))
      window.localStorage.setItem(CHECKED_KEY, JSON.stringify(Array.from(next)))
      return next
    })
  }, [items])

  function toggleItem(key: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      window.localStorage.setItem(CHECKED_KEY, JSON.stringify(Array.from(next)))
      return next
    })
  }

  function handleSetSortMode(mode: SortMode) {
    setSortMode(mode)
    window.localStorage.setItem(SORT_MODE_KEY, mode)
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
              window.localStorage.setItem(CHECKED_KEY, JSON.stringify([]))
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

        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#2b2b2b]/60">Sort</span>
          <button
            onClick={() => handleSetSortMode('category')}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] border-2 border-[#2b2b2b] ${
              sortMode === 'category' ? 'bg-[#b85476] text-[#f0ebe0]' : 'bg-[#f0ebe0] text-[#2b2b2b]'
            }`}
          >
            By Category
          </button>
          <button
            onClick={() => handleSetSortMode('alpha')}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] border-2 border-[#2b2b2b] ${
              sortMode === 'alpha' ? 'bg-[#b85476] text-[#f0ebe0]' : 'bg-[#f0ebe0] text-[#2b2b2b]'
            }`}
          >
            Alphabetical
          </button>
        </div>

        {items.length === 0 ? (
          <div className="border-2 border-[#2b2b2b] bg-white p-6">
            <p className="text-sm text-[#2b2b2b]/70">
              Your cart is empty. Add meals from the menu and your combined list will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortMode === 'alpha' && (
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

            {sortMode === 'category' && categories.map((group) => (
              <section key={group.category}>
                <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#2b2b2b]/65 mb-2">
                  {group.category}
                </h3>
                <div className="space-y-2">
                  {group.items.map((item) => {
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
              </section>
            ))}
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
