'use client'

import { useState, useRef, useEffect } from 'react'
import { meals as staticMeals } from '@/data/meals'
import { getHintForIngredient } from '@/data/shopping-hints'
import { mealAlternatives } from '@/data/meal-alternatives'
import type { AnyMeal } from '@/lib/types'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  meal: AnyMeal
  initialView?: 'instructions' | 'shopping'
}

export default function MealDetailView({ meal, initialView = 'instructions' }: Props) {
  const [activeTab, setActiveTab] = useState<'instructions' | 'shopping'>(initialView)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [activeMethod, setActiveMethod] = useState('standard')

  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  const alternatives = mealAlternatives[meal.id] ?? []
  const selectedAlt = alternatives.find((a) => a.method === activeMethod)
  const currentSteps = selectedAlt ? selectedAlt.steps : meal.steps

  useEffect(() => {
    if (chatOpen) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }, [messages, chatOpen])

  function toggleChecked(ingredient: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(ingredient)) next.delete(ingredient)
      else next.add(ingredient)
      return next
    })
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMessage = input.trim()
    setInput('')
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/recipe-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meal: { title: meal.title, ingredients: meal.ingredients, steps: meal.steps },
          history: messages,
          userMessage,
        }),
      })
      const data = await res.json()
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: res.ok ? data.message : data.error ?? 'Something went wrong. Please try again.',
        },
      ])
    } catch {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Could not connect. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Tab switcher */}
      <div className="flex border-2 border-[#2b2b2b] mb-6">
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
              ? 'bg-[#b85476] text-[#f0ebe0]'
              : 'bg-[#f0ebe0] text-[#2b2b2b] hover:bg-[#b85476]/10'
          }`}
        >
          🛒 Shopping List
        </button>
      </div>

      {/* ── INSTRUCTIONS TAB ── */}
      {activeTab === 'instructions' && (
        <div className="space-y-4">
          {/* Cooking method selector */}
          {alternatives.length > 0 && (
            <div className="border-2 border-[#2b2b2b] p-4 bg-[#f0ebe0]">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2b2b2b]/50 mb-3">
                Cooking Method
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveMethod('standard')}
                  className={`px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] border-2 transition-colors ${
                    activeMethod === 'standard'
                      ? 'bg-[#2b2b2b] text-[#f0ebe0] border-[#2b2b2b]'
                      : 'bg-[#f0ebe0] text-[#2b2b2b] border-[#2b2b2b] hover:bg-[#2b2b2b]/10'
                  }`}
                >
                  🍳 Standard
                </button>
                {alternatives.map((alt) => (
                  <button
                    key={alt.method}
                    onClick={() => setActiveMethod(alt.method)}
                    className={`px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] border-2 transition-colors ${
                      activeMethod === alt.method
                        ? 'bg-[#b85476] text-[#f0ebe0] border-[#b85476]'
                        : 'bg-[#f0ebe0] text-[#2b2b2b] border-[#2b2b2b] hover:bg-[#b85476]/10'
                    }`}
                  >
                    {alt.icon} {alt.label}
                  </button>
                ))}
              </div>
              {selectedAlt?.note && (
                <p className="mt-3 text-xs text-[#7a5a90] leading-snug">
                  ℹ️ {selectedAlt.note}
                </p>
              )}
            </div>
          )}

          <div className="bg-[#7a5a90] px-4 py-3 border-2 border-[#2b2b2b]">
            <span className="text-[#f0ebe0] font-bold uppercase tracking-[0.2em] text-sm">
              {selectedAlt ? `${selectedAlt.label} Instructions` : 'Instructions'}
            </span>
          </div>

          {currentSteps.map((step, index) => (
            <div
              key={`${activeMethod}-${index}`}
              className="border-2 border-[#2b2b2b] shadow-[4px_4px_0px_#2b2b2b] bg-[#f0ebe0] p-5"
            >
              {step.ingredients.length > 0 && (
                <div className="bg-[#7a5a90] p-3 mb-4">
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
                <span className="text-[#b85476] font-bold mr-2">{index + 1}.</span>
                {step.instruction}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── SHOPPING TAB ── */}
      {activeTab === 'shopping' && (
        <div>
          <div className="bg-[#b85476] px-4 py-3 border-2 border-[#2b2b2b] mb-4">
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
                      className="mt-1 w-4 h-4 accent-[#b85476] flex-shrink-0 cursor-pointer"
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
                          <p className="text-xs text-[#7a5a90] leading-snug">
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

          <div className="border-2 border-[#2b2b2b] bg-[#7a5a90] p-4">
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

      {/* ── CHAT SECTION ── */}
      <div className="mt-8" ref={chatRef}>
        <button
          onClick={() => setChatOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 bg-[#2b2b2b] text-[#f0ebe0] font-bold uppercase tracking-[0.15em] text-sm border-2 border-[#2b2b2b] shadow-[4px_4px_0px_#b85476] hover:shadow-[2px_2px_0px_#b85476] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
        >
          <span>💬 Ask the Chef</span>
          <span className="text-[#b85476]">{chatOpen ? '▲' : '▼'}</span>
        </button>

        {chatOpen && (
          <div className="border-2 border-t-0 border-[#2b2b2b]">
            {/* Message history */}
            <div className="p-4 space-y-3 max-h-80 overflow-y-auto bg-[#f0ebe0]">
              {messages.length === 0 && (
                <p className="text-xs text-[#2b2b2b]/50 text-center py-6 leading-relaxed">
                  Got a question about this recipe?<br />
                  Ask about substitutions, serving sizes, cooking tips...
                </p>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#2b2b2b] text-[#f0ebe0]'
                        : 'bg-[#7a5a90] text-[#f0ebe0]'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#7a5a90] px-4 py-3">
                    <span className="flex gap-1 items-center">
                      <span className="w-2 h-2 bg-[#f0ebe0] rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 bg-[#f0ebe0] rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 bg-[#f0ebe0] rounded-full animate-bounce [animation-delay:300ms]" />
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input row */}
            <div className="flex border-t-2 border-[#2b2b2b]">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="e.g. Can I use chicken thighs instead?"
                className="flex-1 px-4 py-3 bg-[#f0ebe0] text-[#2b2b2b] text-sm placeholder-[#2b2b2b]/40 outline-none"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="px-5 py-3 bg-[#b85476] text-[#f0ebe0] font-bold uppercase tracking-[0.1em] text-xs border-l-2 border-[#2b2b2b] disabled:opacity-40 hover:bg-[#943058] transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
