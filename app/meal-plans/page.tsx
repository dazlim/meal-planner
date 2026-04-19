'use client'

import { useEffect, useMemo, useState } from 'react'
import Header from '@/components/Header'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface MealPlanItem {
  id: string
  title: string
  emoji: string | null
  sort_order: number
}

interface MealPlanRow {
  id: string
  name: string
  week_slot: 'current' | 'next' | 'future'
  position: number
  created_at: string
  meal_plan_items: MealPlanItem[]
}

type WeekSlot = 'current' | 'next' | 'future'

export default function MealPlansPage() {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [isApproved, setIsApproved] = useState(false)
  const [plans, setPlans] = useState<MealPlanRow[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient()
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    if (!supabase) return
    let mounted = true

    // getUser() makes a live API call to validate the JWT and fully hydrates
    // the client's auth state — ensures subsequent DB calls include the Bearer token.
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return
      setSessionUserId(data.user?.id ?? null)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUserId(session?.user?.id ?? null)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (!supabase || !sessionUserId) {
      setIsApproved(false)
      setFamilyId(null)
      setPlans([])
      return
    }
    const sb = supabase

    async function loadFamilyContext() {
      try {
        const { data, error } = await sb.rpc('get_my_family_context')
        if (error) {
          setMessage(`Error loading family context: ${error.message}`)
          setIsApproved(false)
          setFamilyId(null)
          setPlans([])
          return
        }
        const ctx = data as { is_approved: boolean; family_id: string | null } | null
        setIsApproved(ctx?.is_approved ?? false)
        setFamilyId(ctx?.family_id ?? null)
        if (!(ctx?.is_approved)) setPlans([])
      } catch (e) {
        setMessage(`Unexpected error: ${e instanceof Error ? e.message : String(e)}`)
        setIsApproved(false)
        setFamilyId(null)
      }
    }

    void loadFamilyContext()
  }, [supabase, sessionUserId])

  async function loadPlans() {
    if (!supabase || !familyId) return
    setBusy(true)
    const { data, error } = await supabase
      .from('meal_plans')
      .select('id, name, week_slot, position, created_at, meal_plan_items(id, title, emoji, sort_order)')
      .eq('family_id', familyId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(error.message)
      setBusy(false)
      return
    }

    setPlans((data ?? []) as MealPlanRow[])
    setBusy(false)
  }

  useEffect(() => {
    if (!familyId || !isApproved) return
    void loadPlans()
  }, [familyId, isApproved]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSignIn() {
    if (!supabase) return
    setBusy(true)
    const redirectTo = `${window.location.origin}/meal-plans`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) {
      setMessage(error.message)
      setBusy(false)
    }
  }

  async function handleSetSlot(planId: string, weekSlot: WeekSlot) {
    if (!supabase || !familyId) return
    setBusy(true)
    setMessage('')

    if (weekSlot === 'current' || weekSlot === 'next') {
      const existing = plans.find((plan) => plan.week_slot === weekSlot && plan.id !== planId)
      if (existing) {
        await supabase
          .from('meal_plans')
          .update({ week_slot: 'future', position: Date.now() % 1000000 })
          .eq('id', existing.id)
      }
      await supabase.from('meal_plans').update({ week_slot: weekSlot, position: 0 }).eq('id', planId)
    } else {
      const futureMax = plans
        .filter((plan) => plan.week_slot === 'future')
        .reduce((max, plan) => Math.max(max, plan.position), 0)
      await supabase
        .from('meal_plans')
        .update({ week_slot: 'future', position: futureMax + 1 })
        .eq('id', planId)
    }

    await loadPlans()
    setBusy(false)
  }

  async function handleRename(planId: string, currentName: string) {
    if (!supabase) return
    const nextName = window.prompt('New meal plan name', currentName)?.trim()
    if (!nextName || nextName === currentName) return
    setBusy(true)
    const { error } = await supabase.from('meal_plans').update({ name: nextName }).eq('id', planId)
    if (error) setMessage(error.message)
    await loadPlans()
    setBusy(false)
  }

  async function handleDelete(planId: string) {
    if (!supabase) return
    const ok = window.confirm('Delete this meal plan?')
    if (!ok) return
    setBusy(true)
    const { error } = await supabase.from('meal_plans').delete().eq('id', planId)
    if (error) setMessage(error.message)
    await loadPlans()
    setBusy(false)
  }

  function plansForSlot(slot: WeekSlot) {
    return plans
      .filter((plan) => plan.week_slot === slot)
      .sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at))
  }

  function slotTitle(slot: WeekSlot) {
    if (slot === 'current') return 'Current Week'
    if (slot === 'next') return 'Next Week'
    return 'Future Plans'
  }

  function SlotSection({ slot }: { slot: WeekSlot }) {
    const slotPlans = plansForSlot(slot)
    return (
      <section className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-[#2b2b2b]/65">{slotTitle(slot)}</h2>
        {slotPlans.length === 0 ? (
          <div className="border-2 border-[#2b2b2b] bg-white p-4 text-xs text-[#2b2b2b]/60">
            No meal plans in this section yet.
          </div>
        ) : (
          <div className="space-y-3">
            {slotPlans.map((plan) => (
              <article key={plan.id} className="border-2 border-[#2b2b2b] bg-white p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[#2b2b2b]">{plan.name}</h3>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#2b2b2b]/55 mt-1">
                      {plan.meal_plan_items.length} meals
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleRename(plan.id, plan.name)}
                      disabled={busy}
                      className="px-2 py-1 bg-[#f0ebe0] text-[#2b2b2b] text-[10px] font-bold uppercase tracking-[0.12em] border-2 border-[#2b2b2b]"
                    >
                      Rename
                    </button>
                    {slot !== 'current' && (
                      <button
                        onClick={() => handleSetSlot(plan.id, 'current')}
                        disabled={busy}
                        className="px-2 py-1 bg-[#f0ebe0] text-[#2b2b2b] text-[10px] font-bold uppercase tracking-[0.12em] border-2 border-[#2b2b2b]"
                      >
                        Set Current
                      </button>
                    )}
                    {slot !== 'next' && (
                      <button
                        onClick={() => handleSetSlot(plan.id, 'next')}
                        disabled={busy}
                        className="px-2 py-1 bg-[#f0ebe0] text-[#2b2b2b] text-[10px] font-bold uppercase tracking-[0.12em] border-2 border-[#2b2b2b]"
                      >
                        Set Next
                      </button>
                    )}
                    {slot !== 'future' && (
                      <button
                        onClick={() => handleSetSlot(plan.id, 'future')}
                        disabled={busy}
                        className="px-2 py-1 bg-[#f0ebe0] text-[#2b2b2b] text-[10px] font-bold uppercase tracking-[0.12em] border-2 border-[#2b2b2b]"
                      >
                        Move Future
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(plan.id)}
                      disabled={busy}
                      className="px-2 py-1 bg-[#b85476] text-[#f0ebe0] text-[10px] font-bold uppercase tracking-[0.12em] border-2 border-[#2b2b2b]"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {plan.meal_plan_items
                    .slice()
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((item) => (
                      <span
                        key={item.id}
                        className="inline-flex items-center gap-1 px-2 py-1 border border-[#2b2b2b]/50 text-[10px] uppercase tracking-[0.1em] text-[#2b2b2b]/75"
                      >
                        <span>{item.emoji ?? '🍽️'}</span>
                        <span>{item.title}</span>
                      </span>
                    ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    )
  }

  return (
    <div className="min-h-screen bg-[#f0ebe0]">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-[#b85476] px-4 py-3 border-2 border-[#2b2b2b]">
          <span className="text-[#f0ebe0] font-bold uppercase tracking-[0.2em] text-sm">Meal Plans</span>
        </div>

        {!supabase && (
          <div className="border-2 border-[#2b2b2b] bg-white p-4 text-sm text-[#2b2b2b]/70">
            Supabase is not configured in this deployment.
          </div>
        )}

        {supabase && !sessionUserId && (
          <div className="border-2 border-[#2b2b2b] bg-white p-4">
            <p className="text-sm text-[#2b2b2b]/70 mb-3">Login to view and manage shared family meal plans.</p>
            <button
              onClick={handleSignIn}
              disabled={busy}
              className="px-3 py-2 bg-[#7a5a90] text-[#f0ebe0] text-[10px] font-bold uppercase tracking-[0.12em] border-2 border-[#2b2b2b]"
            >
              Sign in with Google
            </button>
          </div>
        )}

        {supabase && sessionUserId && !isApproved && (
          <div className="border-2 border-[#2b2b2b] bg-white p-4 text-sm text-[#2b2b2b]/70">
            Your account is signed in, but invite approval is still required for family meal plans.
          </div>
        )}

        {supabase && sessionUserId && isApproved && <SlotSection slot="current" />}
        {supabase && sessionUserId && isApproved && <SlotSection slot="next" />}
        {supabase && sessionUserId && isApproved && <SlotSection slot="future" />}

        {message && <p className="text-xs text-[#b85476]">{message}</p>}
      </main>
    </div>
  )
}
