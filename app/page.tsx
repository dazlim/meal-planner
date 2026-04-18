import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'

export default function CoverPage() {
  return (
    <div className="min-h-screen bg-[#f0ebe0]">
      <Header />

      <main className="flex flex-col items-center justify-center px-6 py-16">
        <div className="relative w-full max-w-sm h-56 md:h-72 mb-10 overflow-hidden border-4 border-[#2b2b2b] shadow-[8px_8px_0px_#2b2b2b]">
          <Image
            src="/images/kids-dinner-menu_b35b1ab6.png"
            alt="Kids Dinner Menu"
            fill
            className="object-cover"
            priority
          />
        </div>

        <h2 className="text-2xl md:text-4xl font-bold text-center mb-3 text-[#2b2b2b] uppercase tracking-[0.15em]">
          What&apos;s for Dinner?
        </h2>

        <p className="text-sm text-[#2b2b2b]/50 text-center mb-10 tracking-wider uppercase">
          Pick tonight&apos;s meal
        </p>

        <Link
          href="/menu"
          className="px-8 py-3 bg-[#c0492b] text-[#f0ebe0] font-bold uppercase tracking-[0.15em] text-sm border-2 border-[#2b2b2b] shadow-[4px_4px_0px_#2b2b2b] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#2b2b2b] transition-all duration-100"
        >
          See the Menu →
        </Link>
      </main>
    </div>
  )
}
