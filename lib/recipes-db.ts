export interface CustomMeal {
  id: string
  title: string
  description: string
  emoji: string
  ingredients: string[]
  steps: { ingredients: string[]; instruction: string }[]
  source: 'ai'
  createdAt: number
}

const KV_KEY = 'custom-recipes'

function isKvConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

export async function getCustomMeals(): Promise<CustomMeal[]> {
  if (!isKvConfigured()) return []
  try {
    const { kv } = await import('@vercel/kv')
    return (await kv.get<CustomMeal[]>(KV_KEY)) ?? []
  } catch {
    return []
  }
}

export async function saveCustomMeal(meal: CustomMeal): Promise<void> {
  if (!isKvConfigured()) throw new Error('Vercel KV is not configured.')
  const { kv } = await import('@vercel/kv')
  const existing = (await kv.get<CustomMeal[]>(KV_KEY)) ?? []
  await kv.set(KV_KEY, [...existing, meal])
}

export async function deleteCustomMeal(id: string): Promise<void> {
  if (!isKvConfigured()) throw new Error('Vercel KV is not configured.')
  const { kv } = await import('@vercel/kv')
  const existing = (await kv.get<CustomMeal[]>(KV_KEY)) ?? []
  await kv.set(KV_KEY, existing.filter((m) => m.id !== id))
}
