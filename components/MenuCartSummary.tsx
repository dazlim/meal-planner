'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { clearMealCart, getCartUpdatedEventName, getMealCart } from '@/lib/meal-cart'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function MenuCartSummary() {
  const [count, setCount] = useState(0)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [authBusy, setAuthBusy] = useState(false)

  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient()
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    const update = () => setCount(getMealCart().length)
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
      setSessionEmail(data.session?.user?.email ?? null)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user?.email ?? null)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  async function handleSignIn() {
    if (!supabase) return
    setAuthBusy(true)
    const redirectTo = `${window.location.origin}/menu/shopping?mode=shared`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) setAuthBusy(false)
  }

  async function handleSignOut() {
    if (!supabase) return
    setAuthBusy(true)
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className="flex items-center justify-between border-2 border-[#2b2b2b] bg-white shadow-[4px_4px_0px_#2b2b2b] px-4 py-3 mb-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#2b2b2b]">
        Cart: {count} {count === 1 ? 'meal' : 'meals'}
      </p>
      <div className="flex items-center gap-2">
        <Link
          href="/menu/shopping"
          className="px-3 py-2 bg-[#7a5a90] text-[#f0ebe0] text-[10px] font-bold uppercase tracking-[0.12em] border-2 border-[#2b2b2b]"
        >
          Full Shopping List
        </Link>
        {supabase && !!sessionEmail && (
          <>
            <span className="hidden sm:inline text-[9px] uppercase tracking-[0.1em] text-[#2b2b2b]/55">
              Signed in
            </span>
            <Link
              href="/menu/shopping?mode=shared"
              className="px-3 py-2 bg-[#b85476] text-[#f0ebe0] text-[10px] font-bold uppercase tracking-[0.12em] border-2 border-[#2b2b2b]"
            >
              Shared List
            </Link>
            <button
              onClick={handleSignOut}
              disabled={authBusy}
              className="px-3 py-2 bg-[#f0ebe0] text-[#2b2b2b]/70 text-[10px] font-bold uppercase tracking-[0.12em] border-2 border-[#2b2b2b]"
            >
              Logout
            </button>
          </>
        )}
        <button
          onClick={() => clearMealCart()}
          className="px-3 py-2 bg-[#f0ebe0] text-[#2b2b2b]/70 text-[10px] font-bold uppercase tracking-[0.12em] border-2 border-[#2b2b2b]"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
