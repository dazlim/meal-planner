import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { RECIPE_SYSTEM_PROMPT } from '@/lib/recipe-prompt'

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not configured. Add it to your Vercel environment variables.' },
      { status: 500 }
    )
  }

  let query: string
  try {
    const body = await request.json()
    query = body.query?.trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!query) {
    return NextResponse.json({ error: 'query is required.' }, { status: 400 })
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const model = process.env.OPENAI_MODEL || 'gpt-4o'

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: RECIPE_SYSTEM_PROMPT },
        { role: 'user', content: `Create a dinner recipe for: ${query}` },
      ],
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0].message.content
    if (!content) throw new Error('Empty response from OpenAI')

    const recipe = JSON.parse(content)
    return NextResponse.json(recipe)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'OpenAI request failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
