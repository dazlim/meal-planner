'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import Header from '@/components/Header'
import { clearMealCart, getCartUpdatedEventName, getMealCart, type CartMeal } from '@/lib/meal-cart'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface CollatedItem {
  key: string
  name: string
  count: number
  recipeCount: number
  variants: string[]
  recipes: string[]
  optionalIn: string[]
  optionalNoteText?: string
  isStaple: boolean
}

interface SharedItemRow {
  id: string
  ingredient_key: string
  ingredient_name: string
  quantity_text: string | null
  category: string | null
  is_staple: boolean
  optional_note: string | null
  contributed_recipes: string[] | null
  checked: boolean
}

type SortMode = 'alpha' | 'category'
type ListMode = 'personal' | 'shared'

const CHECKED_KEY = 'full-shopping-checked-v1'
const SORT_MODE_KEY = 'full-shopping-sort-v1'
const MODE_KEY = 'full-shopping-mode-v1'
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

const HOUSEHOLD_STAPLE_PATTERN =
  /(salt|pepper|olive oil|vegetable oil|sesame oil|soy sauce|honey|herb|spice|oregano|paprika|curry|vinegar|mustard|ketchup|worcestershire)/

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
  if (/(onion|garlic|ginger|carrot|broccoli|capsicum|tomato|lettuce|zucchini|celery|potato|avocado|spring onion|mushroom|lemon|parsley|bok choy)/.test(t)) return 'Vegetables & Fruit'
  return 'Pantry & Other'
}

function looksOptional(ingredientVariant: string) {
  const t = ingredientVariant.toLowerCase()
  return /(optional|to serve|if using|to taste)/.test(t)
}

function isHouseholdStaple(name: string) {
  return HOUSEHOLD_STAPLE_PATTERN.test(name.toLowerCase())
}

function collateIngredients(meals: CartMeal[]): CollatedItem[] {
  const map = new Map<
    string,
    { name: string; count: number; recipes: Set<string>; optionalIn: Set<string>; variants: Set<string> }
  >()

  for (const meal of meals) {
    for (const ingredient of meal.ingredients) {
      const key = normalizeIngredientName(ingredient) || ingredient.toLowerCase()
      const existing = map.get(key)
      if (existing) {
        existing.count += 1
        existing.recipes.add(meal.title)
        existing.variants.add(ingredient)
        if (looksOptional(ingredient)) existing.optionalIn.add(meal.title)
      } else {
        map.set(key, {
          name: displayIngredientName(ingredient),
          count: 1,
          recipes: new Set([meal.title]),
          optionalIn: looksOptional(ingredient) ? new Set([meal.title]) : new Set<string>(),
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
      recipes: Array.from(value.recipes).sort((a, b) => a.localeCompare(b)),
      optionalIn: Array.from(value.optionalIn).sort((a, b) => a.localeCompare(b)),
      variants: Array.from(value.variants),
      isStaple: isHouseholdStaple(value.name),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

function collateFromShared(rows: SharedItemRow[]): CollatedItem[] {
  return rows
    .map((row) => ({
      key: row.ingredient_key,
      name: row.ingredient_name,
      count: row.quantity_text?.startsWith('x') ? Number(row.quantity_text.slice(1)) || 1 : 1,
      recipeCount: (row.contributed_recipes ?? []).length,
      recipes: row.contributed_recipes ?? [],
      optionalIn: [],
      optionalNoteText: row.optional_note ?? undefined,
      variants: [],
      isStaple: row.is_staple,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

function weekStartIso() {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

export default function FullShoppingListPage() {
  const [listMode, setListMode] = useState<ListMode>('personal')
  const [cartMeals, setCartMeals] = useState<CartMeal[]>([])
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [sortMode, setSortMode] = useState<SortMode>('category')
  const [hydrated, setHydrated] = useState(false)

  const [authOpen, setAuthOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [authMessageKind, setAuthMessageKind] = useState<'error' | 'success'>('error')
  const [authBusy, setAuthBusy] = useState(false)
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [isApproved, setIsApproved] = useState(false)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [sharedItems, setSharedItems] = useState<SharedItemRow[]>([])
  const [sharedBusy, setSharedBusy] = useState(false)

  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient()
    } catch {
      return null
    }
  }, [])
  useEffect(() => {
    const update = () => setCartMeals(getMealCart())

    try {
      const raw = window.localStorage.getItem(CHECKED_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as string[]
        if (Array.isArray(parsed)) setChecked(new Set(parsed))
      }
      const savedSort = window.localStorage.getItem(SORT_MODE_KEY)
      if (savedSort === 'alpha' || savedSort === 'category') setSortMode(savedSort)
      const savedMode = window.localStorage.getItem(MODE_KEY)
      const urlMode = new URLSearchParams(window.location.search).get('mode')
      if (urlMode === 'personal' || urlMode === 'shared') setListMode(urlMode)
      else if (savedMode === 'personal' || savedMode === 'shared') setListMode(savedMode)
    } catch {
      // ignore local storage parse issues
    }

    update()
    setHydrated(true)
    window.addEventListener(getCartUpdatedEventName(), update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener(getCartUpdatedEventName(), update)
      window.removeEventListener('storage', update)
    }
  }, [])

  const personalItems = useMemo(() => collateIngredients(cartMeals), [cartMeals])
  const collatedShared = useMemo(() => collateFromShared(sharedItems), [sharedItems])
  const activeItems = listMode === 'shared' ? collatedShared : personalItems

  const activeStaples = useMemo(
    () => activeItems.filter((item) => item.isStaple),
    [activeItems]
  )
  const activeCoreItems = useMemo(
    () => activeItems.filter((item) => !item.isStaple),
    [activeItems]
  )

  const categories = useMemo(() => {
    const grouped = new Map<string, CollatedItem[]>()
    for (const item of activeCoreItems) {
      const category = resolveIngredientCategory(item.name)
      const list = grouped.get(category) ?? []
      list.push(item)
      grouped.set(category, list)
    }
    grouped.forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)))
    return CATEGORY_ORDER.map((category) => ({ category, items: grouped.get(category) ?? [] })).filter(
      (group) => group.items.length > 0
    )
  }, [activeCoreItems])

  useEffect(() => {
    if (!hydrated || listMode !== 'personal') return
    const validKeys = new Set(personalItems.map((item) => item.key))
    setChecked((prev) => {
      const next = new Set(Array.from(prev).filter((key) => validKeys.has(key)))
      window.localStorage.setItem(CHECKED_KEY, JSON.stringify(Array.from(next)))
      return next
    })
  }, [personalItems, hydrated, listMode])

  useEffect(() => {
    if (!supabase) return
    let mounted = true

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return
      setSessionUserId(data.user?.id ?? null)
      setSessionEmail(data.user?.email ?? null)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUserId(session?.user?.id ?? null)
      setSessionEmail(session?.user?.email ?? null)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  async function loadFamilyContext(_userId?: string) {
    if (!supabase) return
    const { data, error } = await supabase.rpc('get_my_family_context')
    if (error) {
      setIsApproved(false)
      setFamilyId(null)
      setSharedItems([])
      return
    }
    const ctx = data as { is_approved: boolean; family_id: string | null } | null
    const approved = ctx?.is_approved ?? false
    setIsApproved(approved)
    if (!approved) {
      setFamilyId(null)
      setSharedItems([])
      return
    }
    const nextFamilyId = ctx?.family_id ?? null
    setFamilyId(nextFamilyId)
    if (!nextFamilyId) setSharedItems([])
  }

  useEffect(() => {
    if (!sessionUserId) {
      setIsApproved(false)
      setFamilyId(null)
      setSharedItems([])
      return
    }
    loadFamilyContext(sessionUserId).catch(() => {
      setAuthMessage('Could not load family context.')
    })
  }, [sessionUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function ensureSharedPlan(targetFamilyId?: string): Promise<string | null> {
    const effectiveFamilyId = targetFamilyId ?? familyId
    if (!supabase || !effectiveFamilyId) return null
    const weekStart = weekStartIso()

    const { data: existing } = await supabase
      .from('weekly_plans')
      .select('id')
      .eq('family_id', effectiveFamilyId)
      .eq('week_start', weekStart)
      .limit(1)
      .maybeSingle()

    if (existing?.id) return existing.id

    const { data: inserted, error } = await supabase
      .from('weekly_plans')
      .insert({ family_id: effectiveFamilyId, week_start: weekStart })
      .select('id')
      .single()

    if (error) {
      setAuthMessage(`Plan error: ${error.message}`)
      setAuthMessageKind('error')
      return null
    }
    return inserted.id as string
  }

  async function loadSharedItems(targetFamilyId?: string) {
    const effectiveFamilyId = targetFamilyId ?? familyId
    if (!supabase || !effectiveFamilyId || !isApproved) return
    setSharedBusy(true)
    const planId = await ensureSharedPlan(effectiveFamilyId)
    if (!planId) {
      setSharedBusy(false)
      return
    }

    const { data, error } = await supabase
      .from('shopping_items')
      .select(
        'id, ingredient_key, ingredient_name, quantity_text, category, is_staple, optional_note, contributed_recipes, checked'
      )
      .eq('plan_id', planId)
      .order('ingredient_name', { ascending: true })

    if (!error && data) setSharedItems(data as SharedItemRow[])
    setSharedBusy(false)
  }

  useEffect(() => {
    if (listMode !== 'shared' || !familyId || !isApproved) return
    loadSharedItems().catch(() => setAuthMessage('Could not load shared checklist.'))
    const id = window.setInterval(() => {
      loadSharedItems().catch(() => null)
    }, 4000)
    return () => window.clearInterval(id)
  }, [listMode, familyId, isApproved]) // eslint-disable-line react-hooks/exhaustive-deps

  function togglePersonalItem(key: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      window.localStorage.setItem(CHECKED_KEY, JSON.stringify(Array.from(next)))
      return next
    })
  }

  async function toggleSharedItem(key: string) {
    if (!supabase || !sessionUserId) return
    const row = sharedItems.find((item) => item.ingredient_key === key)
    if (!row) return
    const nextChecked = !row.checked
    await supabase
      .from('shopping_items')
      .update({
        checked: nextChecked,
        checked_by: nextChecked ? sessionUserId : null,
        checked_at: nextChecked ? new Date().toISOString() : null,
      })
      .eq('id', row.id)
    await loadSharedItems()
  }

  function isItemChecked(item: CollatedItem) {
    if (listMode === 'shared') {
      return !!sharedItems.find((row) => row.ingredient_key === item.key)?.checked
    }
    return checked.has(item.key)
  }

  async function handleSignInWithGoogle() {
    if (!supabase) return
    setAuthBusy(true)
    setAuthMessage('')
    const redirectTo = `${window.location.origin}/menu/shopping?mode=shared`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) {
      setAuthMessageKind('error')
      setAuthMessage(error.message)
      setAuthBusy(false)
    }
  }

  async function handleSignOut() {
    if (!supabase) return
    setAuthBusy(true)
    await supabase.auth.signOut()
    setAuthBusy(false)
    setAuthMessage('')
    setAuthMessageKind('error')
  }

  async function handleRedeemInvite() {
    if (!supabase) return
    if (!inviteCode.trim()) return
    setAuthBusy(true)
    setAuthMessage('')
    setAuthMessageKind('error')
    const { error } = await supabase.rpc('redeem_invite_code', {
      input_code: inviteCode.trim(),
      desired_family_name: 'Family',
    })
    if (error) {
      setAuthMessageKind('error')
      setAuthMessage(error.message)
      setAuthBusy(false)
      return
    }

    // Re-fetch context via security-definer RPC (same auth path as redeem_invite_code)
    const { data: ctxData } = await supabase.rpc('get_my_family_context')
    const ctx = ctxData as { is_approved: boolean; family_id: string | null } | null
    const redeemedFamilyId = ctx?.family_id ?? null

    setInviteCode('')
    setIsApproved(true)
    if (redeemedFamilyId) setFamilyId(redeemedFamilyId)
    setAuthMessageKind('success')
    setAuthMessage('Invite redeemed. Collaboration is now active.')
    await handleSyncPersonalToShared(redeemedFamilyId ?? undefined)
    await loadSharedItems(redeemedFamilyId ?? undefined)
    setAuthBusy(false)
  }

  async function handleSyncPersonalToShared(targetFamilyId?: string) {
    const effectiveFamilyId = targetFamilyId ?? familyId
    if (!supabase || !effectiveFamilyId) return
    setSharedBusy(true)
    setAuthMessage('')

    const planId = await ensureSharedPlan(effectiveFamilyId)
    if (!planId) {
      setAuthOpen(true)
      setSharedBusy(false)
      return
    }

    const { data: existingRows } = await supabase
      .from('shopping_items')
      .select('ingredient_key, checked, checked_by, checked_at')
      .eq('plan_id', planId)

    const existingMap = new Map(
      (existingRows ?? []).map((row) => [row.ingredient_key as string, row])
    )

    const payload = personalItems.map((item) => {
      const existing = existingMap.get(item.key)
      return {
        plan_id: planId,
        ingredient_key: item.key,
        ingredient_name: item.name,
        quantity_text: item.count > 1 ? `x${item.count}` : null,
        category: item.isStaple ? 'Household Staples' : resolveIngredientCategory(item.name),
        is_staple: item.isStaple,
        optional_note: item.optionalIn.length > 0 ? `Can be left off in: ${item.optionalIn.join(', ')}` : null,
        contributed_recipes: item.recipes,
        checked: existing?.checked ?? false,
        checked_by: existing?.checked_by ?? null,
        checked_at: existing?.checked_at ?? null,
      }
    })

    const { error: upsertError } = await supabase
      .from('shopping_items')
      .upsert(payload, { onConflict: 'plan_id,ingredient_key' })

    if (upsertError) {
      setAuthMessage(`Sync failed: ${upsertError.message}`)
      setAuthMessageKind('error')
      setAuthOpen(true)
      setSharedBusy(false)
      return
    }

    await loadSharedItems(effectiveFamilyId)
    setSharedBusy(false)
  }

  function handleSetSortMode(mode: SortMode) {
    setSortMode(mode)
    window.localStorage.setItem(SORT_MODE_KEY, mode)
  }

  function handleSetListMode(mode: ListMode) {
    setListMode(mode)
    window.localStorage.setItem(MODE_KEY, mode)
  }

  function IngredientRow({ item }: { item: CollatedItem }) {
    const isChecked = isItemChecked(item)
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
            onChange={() => (listMode === 'shared' ? toggleSharedItem(item.key) : togglePersonalItem(item.key))}
            className="mt-1 w-4 h-4 accent-[#b85476] flex-shrink-0 cursor-pointer"
          />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${isChecked ? 'line-through text-[#2b2b2b]/40' : 'text-[#2b2b2b]'}`}>
              {item.name}
              {item.count > 1 ? ` ×${item.count}` : ''}
            </p>
            {item.recipes.length > 0 && (
              <p className="text-xs text-[#2b2b2b]/55 mt-1">Contributes to: {item.recipes.join(', ')}</p>
            )}
            {item.optionalIn.length > 0 && (
              <p className="text-xs text-[#2b2b2b]/55 mt-1">Can be left off in: {item.optionalIn.join(', ')}</p>
            )}
            {!!item.optionalNoteText && (
              <p className="text-xs text-[#2b2b2b]/55 mt-1">{item.optionalNoteText}</p>
            )}
            {!isChecked && item.variants.length > 0 && (
              <p className="text-xs text-[#7a5a90] mt-2">e.g. {item.variants.slice(0, 2).join(' • ')}</p>
            )}
          </div>
        </label>
      </div>
    )
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
          <span className="text-[#f0ebe0] font-bold uppercase tracking-[0.2em] text-sm">Full Shopping List</span>
        </div>

        <div className="border-2 border-[#2b2b2b] bg-white shadow-[4px_4px_0px_#2b2b2b] px-4 py-3 mb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs text-[#2b2b2b]/70 uppercase tracking-[0.12em]">
              {listMode === 'personal'
                ? `${cartMeals.length} recipes in cart • ${activeCoreItems.length} combined ingredients`
                : `${activeCoreItems.length} shared ingredients for this week`}
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleSetListMode('personal')}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] border-2 border-[#2b2b2b] ${
                  listMode === 'personal' ? 'bg-[#b85476] text-[#f0ebe0]' : 'bg-[#f0ebe0] text-[#2b2b2b]'
                }`}
              >
                Personal
              </button>
              <button
                onClick={() => handleSetListMode('shared')}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] border-2 border-[#2b2b2b] ${
                  listMode === 'shared' ? 'bg-[#b85476] text-[#f0ebe0]' : 'bg-[#f0ebe0] text-[#2b2b2b]'
                }`}
              >
                Collaboration
              </button>
              {supabase && isApproved && listMode === 'shared' && (
                <button
                  onClick={() => handleSyncPersonalToShared()}
                  disabled={sharedBusy}
                  className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] border-2 border-[#2b2b2b] bg-[#7a5a90] text-[#f0ebe0]"
                >
                  Sync
                </button>
              )}
            </div>
          </div>
        </div>

        {listMode === 'shared' && (
          <div className="border-2 border-[#2b2b2b] bg-white mb-4">
            {!supabase ? (
              <div className="px-4 py-3">
                <p className="text-xs text-[#2b2b2b]/70">
                  Supabase is not configured in this deployment.
                </p>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setAuthOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-4 py-3"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#2b2b2b]/70">
                    {sessionEmail ? `Signed in as ${sessionEmail}` : 'Account'}
                  </span>
                  <span className="text-[#2b2b2b]/40 text-xs">{authOpen ? '\u25b2' : '\u25bc'}</span>
                </button>
                {authOpen && (
                  <div className="px-4 pb-4 border-t border-[#2b2b2b]/20 pt-3 space-y-3">
                    {sessionUserId ? (
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-xs text-[#2b2b2b]/70">
                          Signed in{sessionEmail ? ` as ${sessionEmail}` : ''}.
                        </p>
                        <button
                          onClick={handleSignOut}
                          disabled={authBusy}
                          className="px-3 py-2 bg-[#f0ebe0] text-[#2b2b2b] text-[10px] font-bold uppercase tracking-[0.12em] border-2 border-[#2b2b2b]"
                        >
                          Sign out
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <p className="text-xs text-[#2b2b2b]/70">Sign in with Google to use the shared checklist.</p>
                        <button
                          onClick={handleSignInWithGoogle}
                          disabled={authBusy}
                          className="px-3 py-2 bg-[#7a5a90] text-[#f0ebe0] text-[10px] font-bold uppercase tracking-[0.12em] border-2 border-[#2b2b2b]"
                        >
                          Sign in with Google
                        </button>
                      </div>
                    )}
                    {sessionUserId && !isApproved && (
                      <div className="space-y-2">
                        <p className="text-xs text-[#2b2b2b]/70">Enter your invite code to unlock collaboration.</p>
                        <div className="flex gap-2 flex-wrap">
                          <input
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            placeholder="Invite code"
                            className="px-3 py-2 border-2 border-[#2b2b2b] text-xs flex-1 min-w-[180px]"
                          />
                          <button
                            onClick={handleRedeemInvite}
                            disabled={authBusy || !inviteCode.trim()}
                            className="px-3 py-2 bg-[#7a5a90] text-[#f0ebe0] text-[10px] font-bold uppercase tracking-[0.12em] border-2 border-[#2b2b2b]"
                          >
                            Redeem
                          </button>
                        </div>
                      </div>
                    )}
                    {authMessage && (
                      <p className={`text-xs ${authMessageKind === 'success' ? 'text-[#3f7f53]' : 'text-[#b85476]'}`}>
                        {authMessage}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

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

        {activeItems.length === 0 ? (
          <div className="border-2 border-[#2b2b2b] bg-white p-6">
            <p className="text-sm text-[#2b2b2b]/70">
              {listMode === 'shared'
                ? 'No shared items yet. Sync your personal cart to create the weekly shared list.'
                : 'Your cart is empty. Add meals from the menu and your combined list will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortMode === 'alpha' && (
              <div className="space-y-2">
                {activeCoreItems.map((item) => (
                  <IngredientRow key={item.key} item={item} />
                ))}
              </div>
            )}

            {sortMode === 'category' &&
              categories.map((group) => (
                <section key={group.category}>
                  <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#2b2b2b]/65 mb-2">{group.category}</h3>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <IngredientRow key={item.key} item={item} />
                    ))}
                  </div>
                </section>
              ))}

            {activeStaples.length > 0 && (
              <section>
                <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#2b2b2b]/65 mb-2">
                  Household Staples (likely already have)
                </h3>
                <p className="text-xs text-[#2b2b2b]/55 mb-2">
                  Common pantry basics are grouped here so you can decide if you still need to buy them.
                </p>
                <div className="space-y-2">
                  {activeStaples.map((item) => (
                    <IngredientRow key={item.key} item={item} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        <div className="border-2 border-[#2b2b2b] bg-[#7a5a90] p-4 mt-6">
          <p className="text-[#f0ebe0] text-xs font-bold uppercase tracking-[0.1em]">
            {activeItems.length === 0
              ? 'Add meals to cart or sync to shared list.'
              : listMode === 'shared'
              ? `${activeItems.filter((item) => isItemChecked(item)).length} of ${activeItems.length} shared items collected.`
              : checked.size === activeItems.length
              ? '✓ Everything collected.'
              : `${checked.size} of ${activeItems.length} collated items collected.`}
          </p>
        </div>
      </main>
    </div>
  )
}
