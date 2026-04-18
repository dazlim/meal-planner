import { NextRequest, NextResponse } from 'next/server'
import { deleteCustomMeal } from '@/lib/recipes-db'

function checkAuth(request: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return true
  return request.headers.get('x-admin-password') === adminPassword
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
  }

  try {
    await deleteCustomMeal(params.id)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete recipe.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
