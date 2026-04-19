# Supabase Multi-Family + Invite-Gated Access

This folder contains the first-pass schema and RLS policies for turning the app into a shared, concurrent experience.

## Goals

- OAuth sign-in (Google/Apple/etc.) through Supabase Auth
- Invite-code gated access (private beta / approval-only)
- Family workspaces with shared weekly plan + shared shopping checklist
- AI usage tracking + quota guardrails to reduce unexpected OpenAI costs

## Apply Migration

Run the SQL in:

- `supabase/migrations/20260419_invite_gated_multi_family.sql`

Use Supabase SQL Editor or your migration tooling.

## Invite Code Flow (Recommended)

1. Admin creates an invite code in your admin UI/backend.
2. Store only `sha256` hash in `invite_codes.code_hash`.
3. User signs in with OAuth.
4. App calls `rpc.redeem_invite_code(input_code, desired_family_name)`.
5. If valid, user is approved and added to the mapped family.
6. User can now access family plan/checklist data via RLS-guarded tables.

## Notes

- `invite_codes` supports:
  - family-bound codes (`family_id` set)
  - bootstrap codes (`family_id` null -> creates a new family on redeem)
- `shopping_items` are shared, with `checked_by` and `checked_at` for collaboration.
- `assert_ai_quota(...)` provides a DB-side guard before chat/generation calls.

