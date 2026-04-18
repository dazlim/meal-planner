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
    <Link
      href={`/meal/${meal.id}`}
      className="flex items-center gap-4 bg-[#f0ebe0] border-2 border-[#2b2b2b] shadow-[4px_4px_0px_#2b2b2b] p-5 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#2b2b2b] transition-all duration-100"
    >
      <span className="text-2xl flex-shrink-0">{meal.emoji}</span>
      <span className="text-[#2b2b2b] font-bold uppercase tracking-[0.15em] text-sm">
        {meal.title}
      </span>
    </Link>
  )
}
