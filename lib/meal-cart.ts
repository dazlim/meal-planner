export interface CartMeal {
  id: string
  title: string
  emoji: string
  ingredients: string[]
}

const CART_KEY = 'meal-cart-v1'
const CART_UPDATED_EVENT = 'meal-cart-updated'

function isBrowser() {
  return typeof window !== 'undefined'
}

function dispatchCartUpdated() {
  if (!isBrowser()) return
  window.dispatchEvent(new Event(CART_UPDATED_EVENT))
}

export function getCartUpdatedEventName() {
  return CART_UPDATED_EVENT
}

export function getMealCart(): CartMeal[] {
  if (!isBrowser()) return []
  try {
    const raw = window.localStorage.getItem(CART_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartMeal[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter((meal) => meal?.id && Array.isArray(meal?.ingredients))
  } catch {
    return []
  }
}

function saveMealCart(cart: CartMeal[]) {
  if (!isBrowser()) return
  window.localStorage.setItem(CART_KEY, JSON.stringify(cart))
  dispatchCartUpdated()
}

export function isMealInCart(id: string): boolean {
  return getMealCart().some((meal) => meal.id === id)
}

export function toggleMealInCart(meal: CartMeal): boolean {
  const current = getMealCart()
  const exists = current.some((m) => m.id === meal.id)
  const next = exists ? current.filter((m) => m.id !== meal.id) : [...current, meal]
  saveMealCart(next)
  return !exists
}

export function clearMealCart() {
  saveMealCart([])
}
