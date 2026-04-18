import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'Chat is not configured — OPENAI_API_KEY is missing.' },
      { status: 503 }
    )
  }

  const { meal, history, userMessage } = await req.json()

  if (!userMessage?.trim()) {
    return NextResponse.json({ error: 'No message provided.' }, { status: 400 })
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const stepSummary = meal.steps
      .map((s: { instruction: string }, i: number) => `${i + 1}. ${s.instruction}`)
      .join(' ')

    const systemPrompt = `You are a friendly home cooking assistant helping a family cook dinner tonight. Keep your answers brief, warm and practical — 2 to 4 sentences unless the question genuinely needs more detail.

Current recipe: ${meal.title}
Serves: 4

Ingredients: ${meal.ingredients.join(', ')}

Method: ${stepSummary}

You can help with:
- Ingredient substitutions (e.g. "I don't have X, what can I use?")
- Scaling quantities for different serving sizes
- Making it work with dietary restrictions
- Storage and reheating tips
- Timing and prep advice
- Any general cooking questions about this dish

Keep it family-friendly, encouraging and concise.`

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage },
      ],
      max_completion_tokens: 350,
      temperature: 0.7,
    })

    const message = completion.choices[0]?.message?.content ?? 'No response received.'

    return NextResponse.json({ message })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[recipe-chat]', message)
    return NextResponse.json(
      { error: `Could not reach the chef right now — ${message}` },
      { status: 500 }
    )
  }
}
