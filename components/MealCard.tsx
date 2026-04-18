import Link from 'next/link'

interface MealCardProps {
  meal: {
    id: string
    title: string
    emoji: string
  }
}

export default function MealCard({ meal }: MealCardProps) {
  return (
    <div className="flex items-stretch border-2 border-[#2b2b2b] shadow-[4px_4px_0px_#2b2b2b] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#2b2b2b] transition-all duration-100 bg-[#f0ebe0]">
      <Link
        href={`/meal/${meal.id}`}
        className="flex items-center gap-4 flex-1 p-5"
      >
        <span className="text-2xl flex-shrink-0">{meal.emoji}</span>
        <span className="text-[#2b2b2b] font-bold uppercase tracking-[0.15em] text-sm">
          {meal.title}
        </span>
      </Link>
      <Link
        href={`/meal/${meal.id}?view=shopping`}
        className="flex items-center justify-center px-4 border-l-2 border-[#2b2b2b] text-[#2b2b2b]/50 hover:bg-[#b85476] hover:text-[#f0ebe0] hover:border-[#b85476] transition-colors duration-100 flex-shrink-0"
        title="Shopping list"
        aria-label={`Shopping list for ${meal.title}`}
      >
        <span className="text-lg">🛒</span>
      </Link>
    </div>
  )
}
