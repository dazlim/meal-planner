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

interface JsonStoreClient {
  getJson<T>(key: string): Promise<T | null>
  setJson(key: string, value: unknown): Promise<void>
}

let redisStorePromise: Promise<JsonStoreClient> | null = null
let kvStorePromise: Promise<JsonStoreClient> | null = null

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

function isKvConfigured() {
  const { url, token } = getKvConfig()
  return !!(url && token)
}

function isRedisUrlConfigured() {
  return !!process.env.REDIS_URL
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

async function getRedisStoreClient(): Promise<JsonStoreClient> {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is not configured.')
  }

  if (!redisStorePromise) {
    redisStorePromise = (async () => {
      let redisModule: any

      try {
        redisModule = await import('redis')
      } catch {
        throw new Error('REDIS_URL is configured but the `redis` package is missing. Add dependency: npm install redis')
      }

      if (!redisModule?.createClient) {
        throw new Error('Could not initialize Redis client.')
      }

      const client = redisModule.createClient({ url: process.env.REDIS_URL })
      if (!client.isOpen) await client.connect()

      return {
        async getJson<T>(key: string): Promise<T | null> {
          const raw = await client.get(key)
          if (!raw) return null
          try {
            return JSON.parse(raw) as T
          } catch {
            return null
          }
        },
        async setJson(key: string, value: unknown): Promise<void> {
          await client.set(key, JSON.stringify(value))
        },
      }
    })()
  }

  return redisStorePromise
}

async function getKvStoreClient(): Promise<JsonStoreClient> {
  if (!kvStorePromise) {
    kvStorePromise = (async () => {
      const client = await getKvClient()
      return {
        async getJson<T>(key: string): Promise<T | null> {
          return (await client.get<T>(key)) ?? null
        },
        async setJson(key: string, value: unknown): Promise<void> {
          await client.set(key, value)
        },
      }
    })()
  }
  return kvStorePromise
}

async function getStoreClient(): Promise<JsonStoreClient> {
  if (isRedisUrlConfigured()) {
    return getRedisStoreClient()
  }
  if (isKvConfigured()) {
    return getKvStoreClient()
  }
  throw new Error(`${kvConfigErrorMessage()} Or configure REDIS_URL.`)
}

export async function getCustomMeals(): Promise<CustomMeal[]> {
  if (!isRedisUrlConfigured() && !isKvConfigured()) return []
  try {
    const store = await getStoreClient()
    return (await store.getJson<CustomMeal[]>(KV_KEY)) ?? []
  } catch {
    return []
  }
}

export async function saveCustomMeal(meal: CustomMeal): Promise<void> {
  const store = await getStoreClient()
  const existing = (await store.getJson<CustomMeal[]>(KV_KEY)) ?? []
  await store.setJson(KV_KEY, [...existing, meal])
}

export async function deleteCustomMeal(id: string): Promise<void> {
  const store = await getStoreClient()
  const existing = (await store.getJson<CustomMeal[]>(KV_KEY)) ?? []
  await store.setJson(KV_KEY, existing.filter((m) => m.id !== id))
}
