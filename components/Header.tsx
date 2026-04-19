'use client'

import { useState } from 'react'
import Link from 'next/link'

interface HeaderProps {
  badge?: React.ReactNode
  right?: React.ReactNode
}

export default function Header({ badge, right }: HeaderProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative z-50">
      <header className="bg-[#2b2b2b] px-4 py-4 border-b-4 border-[#b85476] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-white font-bold text-lg tracking-[0.2em] uppercase hover:text-white/70 transition-colors"
          >
            Dinner Menu
          </Link>
          {badge}
        </div>

        <div className="flex items-center gap-4">
          {right}
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="flex flex-col justify-center gap-[5px] w-7 h-7 flex-shrink-0"
          >
            <span
              className={`block w-6 h-[2px] bg-white transition-all duration-200 origin-center ${
                open ? 'rotate-45 translate-y-[7px]' : ''
              }`}
            />
            <span
              className={`block w-6 h-[2px] bg-white transition-all duration-200 ${
                open ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block w-6 h-[2px] bg-white transition-all duration-200 origin-center ${
                open ? '-rotate-45 -translate-y-[7px]' : ''
              }`}
            />
          </button>
        </div>
      </header>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 bg-[#2b2b2b] border-b-4 border-[#b85476] z-50">
            <Link
              href="/menu"
              onClick={() => setOpen(false)}
              className="flex items-center px-5 py-4 text-white font-bold uppercase tracking-[0.15em] text-sm border-b border-white/10 hover:bg-white/5 transition-colors"
            >
              → Dinner Menu
            </Link>
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center px-5 py-4 text-white font-bold uppercase tracking-[0.15em] text-sm border-b border-white/10 hover:bg-white/5 transition-colors"
            >
              → Admin Panel
            </Link>
            <div className="px-5 pt-3 pb-1">
              <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/25">Games</span>
            </div>
            <Link
              href="/games"
              onClick={() => setOpen(false)}
              className="flex items-center px-5 py-3 text-white font-bold uppercase tracking-[0.15em] text-sm border-b border-white/10 hover:bg-white/5 transition-colors"
            >
              → All Games
            </Link>
            <Link
              href="/game"
              onClick={() => setOpen(false)}
              className="flex items-center px-5 py-3 text-white/70 font-bold uppercase tracking-[0.12em] text-xs border-b border-white/10 hover:bg-white/5 transition-colors"
            >
              &nbsp;&nbsp;🃏 Meal Flip
            </Link>
            <Link
              href="/games/race"
              onClick={() => setOpen(false)}
              className="flex items-center px-5 py-3 text-white/70 font-bold uppercase tracking-[0.12em] text-xs hover:bg-white/5 transition-colors"
            >
              &nbsp;&nbsp;🏎️ Meal Race
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
