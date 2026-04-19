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

interface KvLikeClient {
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown): Promise<unknown>
}

function getKvConfig() {
  const hasVkTypo = !!(process.env.VK_REST_API_URL || process.env.VK_REST_API_TOKEN)

  const url =
    process.env.KV_REST_API_URL ??
    process.env.UPSTASH_REDIS_REST_URL ??
    process.env.VK_REST_API_URL

  const token =
    process.env.KV_REST_API_TOKEN ??
    process.env.UPSTASH_REDIS_REST_TOKEN ??
    process.env.VK_REST_API_TOKEN

  return { url, token, hasVkTypo }
}

function isKvConfigured(): boolean {
  const { url, token } = getKvConfig()
  return !!(url && token)
}

function kvConfigErrorMessage(): string {
  const { hasVkTypo } = getKvConfig()
  const typoHint = hasVkTypo ? ' It looks like VK_* may be a typo — use KV_*.' : ''
  return `Vercel KV is not configured. Add either KV_REST_API_URL + KV_REST_API_TOKEN, or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.${typoHint}`
}

async function getKvClient(): Promise<KvLikeClient> {
  const { url, token } = getKvConfig()
  if (!url || !token) {
    throw new Error(kvConfigErrorMessage())
  }

  const { createClient, kv } = await import('@vercel/kv')
  if (typeof createClient === 'function') {
    return createClient({ url, token }) as KvLikeClient
  }

  return kv as KvLikeClient
}

export async function getCustomMeals(): Promise<CustomMeal[]> {
  if (!isKvConfigured()) return []
  try {
    const client = await getKvClient()
    return (await client.get<CustomMeal[]>(KV_KEY)) ?? []
  } catch {
    return []
  }
}

export async function saveCustomMeal(meal: CustomMeal): Promise<void> {
  const client = await getKvClient()
  const existing = (await client.get<CustomMeal[]>(KV_KEY)) ?? []
  await client.set(KV_KEY, [...existing, meal])
}

export async function deleteCustomMeal(id: string): Promise<void> {
  const client = await getKvClient()
  const existing = (await client.get<CustomMeal[]>(KV_KEY)) ?? []
  await client.set(KV_KEY, existing.filter((m) => m.id !== id))
}
