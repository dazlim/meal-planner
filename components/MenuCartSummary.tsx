'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { clearMealCart, getCartUpdatedEventName, getMealCart } from '@/lib/meal-cart'

export default function MenuCartSummary() {
  const [count, setCount] = useState(0)

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
