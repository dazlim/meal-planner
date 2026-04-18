'use client'

import { useState } from 'react'
import { meals as staticMeals } from '@/data/meals'
import { getHintForIngredient } from '@/data/shopping-hints'
import type { AnyMeal } from '@/lib/types'

interface Props {
  meal: AnyMeal
  initialView?: 'instructions' | 'shopping'
}

export default function MealDetailView({ meal, initialView = 'instructions' }: Props) {
  const [activeTab, setActiveTab] = useState<'instructions' | 'shopping'>(initialView)
  const [checked, setChecked] = useState<Set<string>>(new Set())

  function toggleChecked(ingredient: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(ingredient)) {
        next.delete(ingredient)
      } else {
        next.add(ingredient)
      }
      return next
    })
  }

  return (
    <>
      {/* Tab switcher */}
      <div className="flex gap-0 mb-6 border-2 border-[#2b2b2b]">
        <button
          onClick={() => setActiveTab('instructions')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-[0.15em] transition-colors ${
            activeTab === 'instructions'
              ? 'bg-[#2b2b2b] text-[#f0ebe0]'
              : 'bg-[#f0ebe0] text-[#2b2b2b] hover:bg-[#2b2b2b]/10'
          }`}
        >
          Instructions
        </button>
        <button
          onClick={() => setActiveTab('shopping')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-[0.15em] transition-colors border-l-2 border-[#2b2b2b] ${
            activeTab === 'shopping'
              ? 'bg-[#c0492b] text-[#f0ebe0]'
              : 'bg-[#f0ebe0] text-[#2b2b2b] hover:bg-[#c0492b]/10'
          }`}
        >
          🛒 Shopping List
        </button>
      </div>

      {activeTab === 'instructions' && (
        <div className="space-y-4">
          <div className="bg-[#6b7c52] px-4 py-3 border-2 border-[#2b2b2b] mb-4">
            <span className="text-[#f0ebe0] font-bold uppercase tracking-[0.2em] text-sm">
              Instructions
            </span>
          </div>
          {meal.steps.map((step, index) => (
            <div
              key={index}
              className="border-2 border-[#2b2b2b] shadow-[4px_4px_0px_#2b2b2b] bg-[#f0ebe0] p-5"
            >
              {step.ingredients.length > 0 && (
                <div className="bg-[#6b7c52] p-3 mb-4">
                  <p className="text-[#f0ebe0] font-bold uppercase tracking-[0.15em] text-xs mb-2">
                    Ingredients:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {step.ingredients.map((ing, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-[#f0ebe0] text-[#2b2b2b] border border-[#2b2b2b] text-xs font-bold"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-[#2b2b2b] text-sm leading-relaxed">
                <span className="text-[#c0492b] font-bold mr-2">{index + 1}.</span>
                {step.instruction}
              </p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'shopping' && (
        <div>
          <div className="bg-[#c0492b] px-4 py-3 border-2 border-[#2b2b2b] mb-4">
            <span className="text-[#f0ebe0] font-bold uppercase tracking-[0.2em] text-sm">
              Shopping List — Serves 4
            </span>
          </div>

          <div className="space-y-2 mb-6">
            {meal.ingredients.map((ingredient, index) => {
              const hint = getHintForIngredient(ingredient, meal.id)
              const crossMealTitles = hint?.crossMealIds
                .map((id) => staticMeals.find((m) => m.id === id)?.title)
                .filter(Boolean) as string[]
              const isChecked = checked.has(ingredient)

              return (
                <div
                  key={index}
                  className={`border-2 border-[#2b2b2b] p-4 transition-colors ${
                    isChecked ? 'bg-[#2b2b2b]/10' : 'bg-[#f0ebe0]'
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleChecked(ingredient)}
                      className="mt-1 w-4 h-4 accent-[#c0492b] flex-shrink-0 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-sm font-bold ${
                          isChecked ? 'line-through text-[#2b2b2b]/40' : 'text-[#2b2b2b]'
                        }`}
                      >
                        {ingredient}
                      </span>

                      {hint && !isChecked && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-[#6b7c52] leading-snug">
                            📦 {hint.packageHint}
                          </p>
                          {crossMealTitles.length > 0 && (
                            <p className="text-xs text-[#2b2b2b]/60 leading-snug">
                              💡 Also used in:{' '}
                              <span className="font-bold text-[#2b2b2b]/80">
                                {crossMealTitles.join(', ')}
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              )
            })}
          </div>

          <div className="border-2 border-[#2b2b2b] bg-[#6b7c52] p-4">
            <p className="text-[#f0ebe0] text-xs font-bold uppercase tracking-[0.1em]">
              {checked.size === 0
                ? 'Tap each item as you add it to your trolley.'
                : checked.size === meal.ingredients.length
                ? '✓ All done — happy cooking!'
                : `${checked.size} of ${meal.ingredients.length} items collected.`}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
