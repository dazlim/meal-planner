'use client'

import { useEffect, useMemo, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { getCartUpdatedEventName, getMealCart, type CartMeal } from '@/lib/meal-cart'

function resolveMealSource(mealId: string): 'static' | 'custom' | 'ai' {
  if (mealId.startsWith('custom-')) return 'custom'
  if (mealId.startsWith('ai-')) return 'ai'
  return 'static'
}

export default function MenuPlanActions() {
  const [cartMeals, setCartMeals] = useState<CartMeal[]>([])
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [isApproved, setIsApproved] = useState(false)
  const [planName, setPlanName] = useState('')
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
    if (!supabase) return
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSessionUserId(data.session?.user?.id ?? null)
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
      setFamilyId(null)
      setIsApproved(false)
      return
    }

    supabase
      .from('profiles')
      .select('approved_at')
      .eq('user_id', sessionUserId)
      .maybeSingle()
      .then(({ data }) => {
        const approved = !!data?.approved_at
        setIsApproved(approved)
        if (!approved) {
          setFamilyId(null)
          return
        }
        supabase
          .from('family_members')
          .select('family_id')
          .eq('user_id', sessionUserId)
          .limit(1)
          .maybeSingle()
          .then(({ data: membership }) => {
            setFamilyId(membership?.family_id ?? null)
          })
      })
      .catch(() => {
        setFamilyId(null)
        setIsApproved(false)
      })
  }, [supabase, sessionUserId])

  async function handleSignIn() {
    if (!supabase) return
    setBusy(true)
    setMessage('')
    const redirectTo = `${window.location.origin}/menu`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) {
      setMessage(error.message)
      setBusy(false)
    }
  }

  async function handleSavePlan() {
    if (!supabase || !familyId || !sessionUserId || cartMeals.length === 0) return
    const trimmedName = planName.trim()
    if (!trimmedName) {
      setMessage('Please add a meal plan name first.')
      return
    }

    setBusy(true)
    setMessage('')

    const { data: inserted, error: insertError } = await supabase
      .from('meal_plans')
      .insert({
        family_id: familyId,
        name: trimmedName,
        week_slot: 'future',
        created_by: sessionUserId,
      })
      .select('id')
      .single()

    if (insertError || !inserted?.id) {
      setMessage(insertError?.message ?? 'Could not save meal plan.')
      setBusy(false)
      return
    }

    const payload = cartMeals.map((meal, index) => ({
      meal_plan_id: inserted.id as string,
      meal_id: meal.id,
      title: meal.title,
      emoji: meal.emoji,
      source: resolveMealSource(meal.id),
      sort_order: index,
    }))

    const { error: itemsError } = await supabase.from('meal_plan_items').insert(payload)
    if (itemsError) {
      setMessage(itemsError.message)
      setBusy(false)
      return
    }

    setPlanName('')
    setMessage('Meal plan saved. Open Meal Plans from the menu to manage it.')
    setBusy(false)
  }

  if (!supabase) {
    return null
  }

  if (!sessionUserId) {
    return (
      <div className="border-2 border-[#2b2b2b] bg-white shadow-[4px_4px_0px_#2b2b2b] px-4 py-3 mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#2b2b2b]/65">
            Login to save named meal plans for shared family use.
          </p>
          <button
            onClick={handleSignIn}
            disabled={busy}
            className="px-3 py-2 bg-[#7a5a90] text-[#f0ebe0] text-[10px] font-bold uppercase tracking-[0.12em] border-2 border-[#2b2b2b]"
          >
            Login
          </button>
        </div>
        {message && <p className="text-xs text-[#b85476] mt-2">{message}</p>}
      </div>
    )
  }

  if (!isApproved || !familyId) {
    return (
      <div className="border-2 border-[#2b2b2b] bg-white shadow-[4px_4px_0px_#2b2b2b] px-4 py-3 mb-4">
        <p className="text-[10px] uppercase tracking-[0.12em] text-[#2b2b2b]/65">
          Collaboration account detected, but invite approval is still required before saving shared meal plans.
        </p>
      </div>
    )
  }

  return (
    <div className="border-2 border-[#2b2b2b] bg-white shadow-[4px_4px_0px_#2b2b2b] px-4 py-3 mb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[10px] uppercase tracking-[0.12em] text-[#2b2b2b]/65">
          Save current cart as a reusable meal plan
        </p>
        <p className="text-[10px] uppercase tracking-[0.12em] text-[#2b2b2b]/45">
          {cartMeals.length} meals selected
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap mt-3">
        <input
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          placeholder="e.g. Weeknight Rotation"
          className="px-3 py-2 border-2 border-[#2b2b2b] text-xs flex-1 min-w-[220px]"
        />
        <button
          onClick={handleSavePlan}
          disabled={busy || cartMeals.length === 0 || !planName.trim()}
          className="px-3 py-2 bg-[#b85476] text-[#f0ebe0] text-[10px] font-bold uppercase tracking-[0.12em] border-2 border-[#2b2b2b]"
        >
          Save Meal Plan
        </button>
      </div>
      {message && <p className="text-xs text-[#7a5a90] mt-2">{message}</p>}
    </div>
  )
}
