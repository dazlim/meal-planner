import { NextRequest, NextResponse } from 'next/server'
import { getCustomMeals, saveCustomMeal, CustomMeal } from '@/lib/recipes-db'

function checkAuth(request: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return true // No password configured — allow all access
  return request.headers.get('x-admin-password') === adminPassword
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
  }
  const meals = await getCustomMeals()
  return NextResponse.json(meals)
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
  }

  let body: Omit<CustomMeal, 'id' | 'source' | 'createdAt'>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!body.title || !body.steps || !body.ingredients) {
    return NextResponse.json({ error: 'Missing required fields: title, ingredients, steps.' }, { status: 400 })
  }

  const meal: CustomMeal = {
    ...body,
    id: `custom-${Date.now()}`,
    source: 'ai',
    createdAt: Date.now(),
  }

  try {
    await saveCustomMeal(meal)
    return NextResponse.json(meal, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save recipe.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
