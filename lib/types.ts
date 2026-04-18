export interface AnyMeal {
  id: string
  title: string
  emoji: string
  description?: string
  ingredients: string[]
  steps: { ingredients: string[]; instruction: string }[]
}
