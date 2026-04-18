import Link from 'next/link'
import Image from 'next/image'

export default function CoverPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Cover Image */}
      <div className="relative w-full max-w-md h-64 md:h-80 mb-8 rounded-2xl overflow-hidden shadow-xl">
        <Image
          src="/images/kids-dinner-menu_b35b1ab6.png"
          alt="Kids Dinner Menu"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Title */}
      <h1 className="text-4xl md:text-6xl font-extrabold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-fun-pink via-fun-orange to-fun-yellow">
        What&apos;s for Dinner? 🍽️
      </h1>

      {/* Subtitle */}
      <p className="text-lg md:text-xl text-gray-600 text-center mb-8 max-w-md">
        Tap to choose with your little one!
      </p>

      {/* CTA Button */}
      <Link
        href="/menu"
        className="px-8 py-4 bg-gradient-to-r from-fun-pink to-fun-orange text-white font-bold rounded-full text-xl shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200"
      >
        Let&apos;s Choose! 🎉
      </Link>

      {/* Footer hint */}
      <p className="mt-12 text-gray-400 text-sm text-center">
        21 yummy meals to explore ✨
      </p>
    </main>
  )
}
