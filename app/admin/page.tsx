'use client'

import { useEffect, useState } from 'react'
import { meals as staticMeals } from '@/data/meals'
import type { CustomMeal } from '@/lib/recipes-db'
import Header from '@/components/Header'

type GeneratedRecipe = Omit<CustomMeal, 'id' | 'source' | 'createdAt'>

const SESSION_KEY = 'adminPw'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [checking, setChecking] = useState(false)
  const [storedPw, setStoredPw] = useState('')

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (saved) {
      setStoredPw(saved)
      setAuthed(true)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setChecking(true)
    setPwError('')
    try {
      const res = await fetch('/api/admin/recipes', {
        headers: { 'x-admin-password': pw },
      })
      if (res.ok) {
        sessionStorage.setItem(SESSION_KEY, pw)
        setStoredPw(pw)
        setAuthed(true)
      } else {
        const data = await res.json()
        setPwError(data.error || 'Incorrect password.')
      }
    } catch {
      setPwError('Connection error. Try again.')
    } finally {
      setChecking(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setAuthed(false)
    setPw('')
    setStoredPw('')
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#f0ebe0]">
        <Header />
        <main className="flex flex-col items-center justify-center min-h-[calc(100vh-72px)] px-6">
          <div className="w-full max-w-sm border-2 border-[#2b2b2b] shadow-[6px_6px_0px_#2b2b2b] bg-[#f0ebe0] p-8">
            <h2 className="text-lg font-bold uppercase tracking-[0.2em] text-[#2b2b2b] mb-6">
              Admin Panel
            </h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.15em] text-[#2b2b2b] mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full border-2 border-[#2b2b2b] bg-[#f0ebe0] px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#b85476]"
                  autoFocus
                />
              </div>
              {pwError && (
                <p className="text-xs text-[#b85476] font-bold">{pwError}</p>
              )}
              <button
                type="submit"
                disabled={checking}
                className="w-full px-4 py-2 bg-[#b85476] text-[#f0ebe0] font-bold uppercase tracking-[0.15em] text-sm border-2 border-[#2b2b2b] shadow-[3px_3px_0px_#2b2b2b] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#2b2b2b] transition-all duration-100 disabled:opacity-50"
              >
                {checking ? 'Checking...' : 'Enter →'}
              </button>
            </form>
          </div>
        </main>
      </div>
    )
  }

  return <AdminUI password={storedPw} onLogout={handleLogout} />
}

function AdminUI({ password, onLogout }: { password: string; onLogout: () => void }) {
  const [tab, setTab] = useState<'generate' | 'manage' | 'invites'>('generate')

  return (
    <div className="min-h-screen bg-[#f0ebe0]">
      <Header
        badge={
          <span className="text-[#b85476] font-bold text-xs tracking-[0.2em] uppercase border border-[#b85476] px-2 py-0.5">
            Admin
          </span>
        }
        right={
          <button
            onClick={onLogout}
            className="text-white/50 text-xs uppercase tracking-[0.15em] hover:text-white transition-colors"
          >
            Log out
          </button>
        }
      />

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['generate', 'manage', 'invites'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] border-2 border-[#2b2b2b] transition-all duration-100 ${
                tab === t
                  ? 'bg-[#2b2b2b] text-[#f0ebe0] shadow-none translate-x-[2px] translate-y-[2px]'
                  : 'bg-[#f0ebe0] text-[#2b2b2b] shadow-[3px_3px_0px_#2b2b2b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#2b2b2b]'
              }`}
            >
              {t === 'generate' ? 'Generate Recipe' : t === 'manage' ? 'Manage Recipes' : 'Invite Codes'}
            </button>
          ))}
        </div>

        {tab === 'generate' && <GenerateTab password={password} />}
        {tab === 'manage' && <ManageTab password={password} />}
        {tab === 'invites' && <InvitesTab password={password} />}
      </main>
    </div>
  )
}

function InvitesTab({ password }: { password: string }) {
  const [maxUses, setMaxUses] = useState(1)
  const [expiresInDays, setExpiresInDays] = useState(30)
  const [note, setNote] = useState('')
  const [familyId, setFamilyId] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [generatedMeta, setGeneratedMeta] = useState<{
    id: string
    expires_at: string
    max_uses: number
    family_id: string | null
    note: string | null
  } | null>(null)

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    setGeneratedCode('')
    setGeneratedMeta(null)

    try {
      const res = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          maxUses,
          expiresInDays,
          note: note.trim(),
          familyId: familyId.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create invite code.')

      setGeneratedCode(data.inviteCode || '')
      setGeneratedMeta(data.invite || null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create invite code.')
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = async () => {
    if (!generatedCode) return
    try {
      await navigator.clipboard.writeText(generatedCode)
    } catch {
      // ignore clipboard failures
    }
  }

  return (
    <div>
      <div className="bg-[#7a5a90] px-4 py-3 border-2 border-[#2b2b2b] mb-6">
        <span className="text-[#f0ebe0] font-bold uppercase tracking-[0.2em] text-sm">
          Create Invite Code
        </span>
      </div>

      <form onSubmit={handleCreateInvite} className="border-2 border-[#2b2b2b] bg-[#f0ebe0] p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.15em] text-[#2b2b2b] mb-2">
              Max Uses
            </label>
            <input
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(Number(e.target.value))}
              className="w-full border-2 border-[#2b2b2b] bg-[#f0ebe0] px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#b85476]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.15em] text-[#2b2b2b] mb-2">
              Expires In (Days)
            </label>
            <input
              type="number"
              min={1}
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
              className="w-full border-2 border-[#2b2b2b] bg-[#f0ebe0] px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#b85476]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.15em] text-[#2b2b2b] mb-2">
            Family ID (Optional)
          </label>
          <input
            type="text"
            value={familyId}
            onChange={(e) => setFamilyId(e.target.value)}
            placeholder="Leave blank for bootstrap invite"
            className="w-full border-2 border-[#2b2b2b] bg-[#f0ebe0] px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#b85476]"
          />
          <p className="mt-1 text-[11px] text-[#2b2b2b]/60">
            Blank = creates a new family on redeem. Fill with a UUID to add users to an existing family.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.15em] text-[#2b2b2b] mb-2">
            Note (Optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Rita + Darren beta"
            className="w-full border-2 border-[#2b2b2b] bg-[#f0ebe0] px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#b85476]"
          />
        </div>

        <button
          type="submit"
          disabled={creating}
          className="px-5 py-2 bg-[#b85476] text-[#f0ebe0] font-bold uppercase tracking-[0.15em] text-sm border-2 border-[#2b2b2b] shadow-[3px_3px_0px_#2b2b2b] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#2b2b2b] transition-all duration-100 disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Generate Invite Code →'}
        </button>
      </form>

      {error && (
        <div className="border-2 border-[#b85476] p-4 mt-4 text-sm text-[#b85476] font-bold">
          {error}
        </div>
      )}

      {generatedCode && (
        <div className="border-2 border-[#2b2b2b] shadow-[4px_4px_0px_#2b2b2b] bg-[#f0ebe0] p-5 mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#2b2b2b]/70 mb-2">
            Share This Invite Code (shown once)
          </p>
          <div className="flex gap-2 items-stretch flex-wrap">
            <code className="px-3 py-2 border-2 border-[#2b2b2b] bg-white text-sm font-bold tracking-[0.08em] break-all">
              {generatedCode}
            </code>
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-[#7a5a90] text-[#f0ebe0] font-bold uppercase tracking-[0.12em] text-xs border-2 border-[#2b2b2b]"
            >
              Copy
            </button>
          </div>
          {generatedMeta && (
            <p className="text-xs text-[#2b2b2b]/60 mt-3">
              Max uses: {generatedMeta.max_uses} • Expires: {new Date(generatedMeta.expires_at).toLocaleString()}
              {generatedMeta.family_id ? ` • Family: ${generatedMeta.family_id}` : ' • Bootstrap invite'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function GenerateTab({ password }: { password: string }) {
  const [query, setQuery] = useState('')
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<GeneratedRecipe | null>(null)
  const [genError, setGenError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setGenerating(true)
    setPreview(null)
    setGenError('')
    setSaveMsg('')
    try {
      const res = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setPreview(data)
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!preview) return
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch('/api/admin/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify(preview),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setSaveMsg(`✓ "${preview.title}" saved to the menu!`)
      setPreview(null)
      setQuery('')
    } catch (err: unknown) {
      setSaveMsg(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="bg-[#7a5a90] px-4 py-3 border-2 border-[#2b2b2b] mb-6">
        <span className="text-[#f0ebe0] font-bold uppercase tracking-[0.2em] text-sm">
          Generate a New Recipe
        </span>
      </div>

      <form onSubmit={handleGenerate} className="flex gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Chicken stir fry, Beef tacos, Veggie pasta..."
          className="flex-1 border-2 border-[#2b2b2b] bg-[#f0ebe0] px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#b85476]"
        />
        <button
          type="submit"
          disabled={generating || !query.trim()}
          className="px-5 py-2 bg-[#b85476] text-[#f0ebe0] font-bold uppercase tracking-[0.15em] text-sm border-2 border-[#2b2b2b] shadow-[3px_3px_0px_#2b2b2b] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#2b2b2b] transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {generating ? 'Generating...' : 'Generate →'}
        </button>
      </form>

      {genError && (
        <div className="border-2 border-[#b85476] p-4 mb-6 text-sm text-[#b85476] font-bold">
          {genError}
        </div>
      )}

      {saveMsg && (
        <div className="border-2 border-[#7a5a90] bg-[#7a5a90]/10 p-4 mb-6 text-sm text-[#7a5a90] font-bold">
          {saveMsg}
        </div>
      )}

      {generating && (
        <div className="border-2 border-[#2b2b2b] p-8 text-center text-sm text-[#2b2b2b]/50 uppercase tracking-[0.15em]">
          Asking OpenAI...
        </div>
      )}

      {preview && (
        <div className="border-2 border-[#2b2b2b] shadow-[4px_4px_0px_#2b2b2b] bg-[#f0ebe0] p-6 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{preview.emoji}</span>
            <h3 className="text-lg font-bold uppercase tracking-[0.1em] text-[#2b2b2b]">
              {preview.title}
            </h3>
          </div>
          <p className="text-sm text-[#2b2b2b]/60 mb-4">{preview.description}</p>

          <div className="h-px bg-[#b85476] mb-4" />

          <div className="bg-[#7a5a90] px-3 py-2 border-2 border-[#2b2b2b] mb-3">
            <span className="text-[#f0ebe0] font-bold uppercase tracking-[0.2em] text-xs">
              Instructions
            </span>
          </div>

          <div className="space-y-3">
            {preview.steps.map((step, i) => (
              <div key={i} className="border border-[#2b2b2b] p-4">
                <div className="bg-[#7a5a90] p-2 mb-3">
                  <p className="text-[#f0ebe0] font-bold uppercase tracking-[0.15em] text-xs mb-1.5">
                    Ingredients:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {step.ingredients.map((ing, j) => (
                      <span key={j} className="px-2 py-0.5 bg-[#f0ebe0] text-[#2b2b2b] border border-[#2b2b2b] text-xs font-bold">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-[#2b2b2b] leading-relaxed">
                  <span className="text-[#b85476] font-bold mr-2">{i + 1}.</span>
                  {step.instruction}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-[#7a5a90] text-[#f0ebe0] font-bold uppercase tracking-[0.15em] text-sm border-2 border-[#2b2b2b] shadow-[3px_3px_0px_#2b2b2b] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#2b2b2b] transition-all duration-100 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save to Menu →'}
            </button>
            <button
              onClick={() => setPreview(null)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-[#2b2b2b]/50 border-2 border-[#2b2b2b]/30 hover:border-[#2b2b2b] hover:text-[#2b2b2b] transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ManageTab({ password }: { password: string }) {
  const [customMeals, setCustomMeals] = useState<CustomMeal[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCustomMeals()
  }, [])

  const fetchCustomMeals = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/recipes', {
        headers: { 'x-admin-password': password },
      })
      const data = await res.json()
      if (res.ok) setCustomMeals(data)
    } catch {
      setError('Failed to load custom recipes.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Remove "${title}" from the menu?`)) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/recipes/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      })
      if (res.ok) {
        setCustomMeals((prev) => prev.filter((m) => m.id !== id))
      } else {
        const data = await res.json()
        setError(data.error || 'Delete failed.')
      }
    } catch {
      setError('Delete failed.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="bg-[#7a5a90] px-4 py-3 border-2 border-[#2b2b2b] mb-6">
        <span className="text-[#f0ebe0] font-bold uppercase tracking-[0.2em] text-sm">
          All Recipes ({staticMeals.length + customMeals.length})
        </span>
      </div>

      {error && (
        <div className="border-2 border-[#b85476] p-3 mb-4 text-xs text-[#b85476] font-bold">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {staticMeals.map((meal) => (
          <div
            key={meal.id}
            className="flex items-center justify-between gap-4 border-2 border-[#2b2b2b] p-4 bg-[#f0ebe0]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xl flex-shrink-0">{meal.emoji}</span>
              <span className="text-sm font-bold uppercase tracking-[0.1em] text-[#2b2b2b] truncate">
                {meal.title}
              </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#2b2b2b]/40 border border-[#2b2b2b]/30 px-2 py-0.5 flex-shrink-0">
              Built-in
            </span>
          </div>
        ))}

        {loading && (
          <div className="border-2 border-[#2b2b2b]/30 p-4 text-xs text-[#2b2b2b]/40 uppercase tracking-[0.15em] text-center">
            Loading custom recipes...
          </div>
        )}

        {!loading && customMeals.map((meal) => (
          <div
            key={meal.id}
            className="flex items-center justify-between gap-4 border-2 border-[#2b2b2b] shadow-[3px_3px_0px_#2b2b2b] p-4 bg-[#f0ebe0]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xl flex-shrink-0">{meal.emoji}</span>
              <div className="min-w-0">
                <span className="text-sm font-bold uppercase tracking-[0.1em] text-[#2b2b2b] truncate block">
                  {meal.title}
                </span>
                <span className="text-xs text-[#7a5a90] font-bold uppercase tracking-[0.1em]">
                  AI Generated
                </span>
              </div>
            </div>
            <button
              onClick={() => handleDelete(meal.id, meal.title)}
              disabled={deletingId === meal.id}
              className="px-3 py-1.5 bg-[#b85476] text-[#f0ebe0] font-bold uppercase tracking-[0.15em] text-xs border-2 border-[#2b2b2b] shadow-[2px_2px_0px_#2b2b2b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#2b2b2b] transition-all duration-100 disabled:opacity-50 flex-shrink-0"
            >
              {deletingId === meal.id ? '...' : 'Remove'}
            </button>
          </div>
        ))}

        {!loading && customMeals.length === 0 && (
          <div className="border-2 border-[#2b2b2b]/30 p-6 text-xs text-[#2b2b2b]/40 uppercase tracking-[0.15em] text-center">
            No custom recipes yet — generate one in the Generate tab
          </div>
        )}
      </div>
    </div>
  )
}
