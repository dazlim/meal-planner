import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomUUID } from 'crypto'
import { createClient } from '@supabase/supabase-js'

function checkAuth(request: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return true
  return request.headers.get('x-admin-password') === adminPassword
}

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRole) return null
  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

interface InviteBody {
  maxUses?: number
  expiresInDays?: number
  note?: string
  familyId?: string | null
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
  }

  const supabase = getSupabaseAdminClient()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' },
      { status: 500 }
    )
  }

  let body: InviteBody = {}
  try {
    body = await request.json()
  } catch {
    // allow empty body and defaults
  }

  const maxUses = Number.isFinite(body.maxUses) ? Math.max(1, Math.floor(body.maxUses as number)) : 1
  const expiresInDays = Number.isFinite(body.expiresInDays)
    ? Math.max(1, Math.floor(body.expiresInDays as number))
    : 30
  const note = (body.note ?? '').trim() || null
  const familyId = (body.familyId ?? '').trim() || null

  const rawCode = randomUUID().replace(/-/g, '').toUpperCase()
  const codeHash = createHash('sha256').update(rawCode).digest('hex')
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('invite_codes')
    .insert({
      code_hash: codeHash,
      family_id: familyId,
      max_uses: maxUses,
      expires_at: expiresAt,
      note,
    })
    .select('id, family_id, max_uses, uses, expires_at, note, created_at')
    .single()

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message.includes('invite_codes')
            ? 'Invite table not found. Run the Supabase migrations in production first.'
            : error.message,
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    inviteCode: rawCode,
    invite: data,
  })
}
