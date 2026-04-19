-- Supabase schema for:
-- - Invite-gated OAuth access
-- - Family-scoped weekly plans + shared shopping checklist
-- - AI usage tracking and quota guardrails

create extension if not exists pgcrypto;

-- -----------------------
-- Core identity + family
-- -----------------------

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.family_members (
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'adult', 'member')),
  created_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

create index if not exists idx_family_members_user_id on public.family_members(user_id);

-- -----------------------
-- Meal planning + shopping
-- -----------------------

create table if not exists public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  week_start date not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (family_id, week_start)
);

create table if not exists public.weekly_plan_meals (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.weekly_plans(id) on delete cascade,
  meal_id text not null,
  title text not null,
  emoji text,
  source text not null default 'static' check (source in ('static', 'ai', 'custom')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_weekly_plan_meals_plan on public.weekly_plan_meals(plan_id);

create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.weekly_plans(id) on delete cascade,
  ingredient_key text not null,
  ingredient_name text not null,
  quantity_text text,
  category text,
  is_staple boolean not null default false,
  optional_note text,
  contributed_recipes text[] not null default '{}',
  checked boolean not null default false,
  checked_by uuid references auth.users(id) on delete set null,
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, ingredient_key)
);

create index if not exists idx_shopping_items_plan on public.shopping_items(plan_id);
create index if not exists idx_shopping_items_checked on public.shopping_items(plan_id, checked);

create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_shopping_items_set_updated_at on public.shopping_items;
create trigger trg_shopping_items_set_updated_at
before update on public.shopping_items
for each row execute function public.tg_set_updated_at();

-- -----------------------
-- Invite gating
-- -----------------------

create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  family_id uuid references public.families(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  max_uses int not null default 1 check (max_uses > 0),
  uses int not null default 0 check (uses >= 0),
  expires_at timestamptz,
  revoked_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_invite_codes_family on public.invite_codes(family_id);

-- -----------------------
-- AI usage tracking + limits
-- -----------------------

create table if not exists public.ai_usage_limits (
  family_id uuid primary key references public.families(id) on delete cascade,
  chat_enabled boolean not null default true,
  daily_request_limit int not null default 150,
  daily_token_limit int not null default 150000,
  monthly_request_limit int not null default 2500,
  monthly_token_limit int not null default 2500000,
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_usage_events (
  id bigserial primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  endpoint text not null,
  model text,
  request_count int not null default 1 check (request_count > 0),
  prompt_tokens int not null default 0 check (prompt_tokens >= 0),
  completion_tokens int not null default 0 check (completion_tokens >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_usage_events_family_created on public.ai_usage_events(family_id, created_at);
create index if not exists idx_ai_usage_events_user_created on public.ai_usage_events(user_id, created_at);

-- -----------------------
-- Helper functions
-- -----------------------

create or replace function public.is_family_member(p_family_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.family_members fm
    where fm.family_id = p_family_id
      and fm.user_id = auth.uid()
  );
$$;

create or replace function public.is_family_owner(p_family_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.families f
    where f.id = p_family_id
      and f.owner_user_id = auth.uid()
  );
$$;

create or replace function public.has_app_access()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.approved_at is not null
  );
$$;

-- Secure invite redemption.
-- input_code is hashed server-side and compared against invite_codes.code_hash.
create or replace function public.redeem_invite_code(input_code text, desired_family_name text default 'Family')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_code_hash text;
  v_invite public.invite_codes%rowtype;
  v_family_id uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if input_code is null or length(trim(input_code)) < 8 then
    raise exception 'Invalid invite code';
  end if;

  v_code_hash := encode(digest(trim(input_code), 'sha256'), 'hex');

  select *
  into v_invite
  from public.invite_codes ic
  where ic.code_hash = v_code_hash
    and ic.revoked_at is null
    and (ic.expires_at is null or ic.expires_at > now())
    and ic.uses < ic.max_uses
  for update;

  if not found then
    raise exception 'Invite code is invalid, expired, revoked, or fully used';
  end if;

  -- Family-bound invite joins existing family.
  if v_invite.family_id is not null then
    v_family_id := v_invite.family_id;
  else
    -- Bootstrap invite creates a new family for this user.
    insert into public.families(name, owner_user_id)
    values (coalesce(nullif(trim(desired_family_name), ''), 'Family'), v_uid)
    returning id into v_family_id;

    insert into public.family_members(family_id, user_id, role)
    values (v_family_id, v_uid, 'owner')
    on conflict do nothing;
  end if;

  -- Ensure profile is approved.
  insert into public.profiles(user_id, approved_at)
  values (v_uid, now())
  on conflict (user_id) do update
  set approved_at = coalesce(public.profiles.approved_at, now());

  -- Add member if not already present.
  insert into public.family_members(family_id, user_id, role)
  values (v_family_id, v_uid, 'adult')
  on conflict (family_id, user_id) do nothing;

  -- Consume invite.
  update public.invite_codes
  set uses = uses + 1
  where id = v_invite.id;

  -- Ensure limits row exists for family.
  insert into public.ai_usage_limits(family_id)
  values (v_family_id)
  on conflict (family_id) do nothing;

  return v_family_id;
end;
$$;

revoke all on function public.redeem_invite_code(text, text) from public;
grant execute on function public.redeem_invite_code(text, text) to authenticated;

create or replace function public.assert_ai_quota(p_family_id uuid, p_estimated_tokens int default 0)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limits public.ai_usage_limits%rowtype;
  v_daily_requests int;
  v_daily_tokens int;
  v_monthly_requests int;
  v_monthly_tokens int;
begin
  if p_family_id is null then
    raise exception 'family_id is required';
  end if;

  if not public.is_family_member(p_family_id) then
    raise exception 'Not authorized for this family';
  end if;

  select * into v_limits
  from public.ai_usage_limits l
  where l.family_id = p_family_id;

  if not found then
    insert into public.ai_usage_limits(family_id) values (p_family_id)
    on conflict do nothing;
    select * into v_limits from public.ai_usage_limits l where l.family_id = p_family_id;
  end if;

  if v_limits.chat_enabled is false then
    raise exception 'Chat is disabled for this family';
  end if;

  select coalesce(sum(e.request_count), 0), coalesce(sum(e.prompt_tokens + e.completion_tokens), 0)
    into v_daily_requests, v_daily_tokens
  from public.ai_usage_events e
  where e.family_id = p_family_id
    and e.created_at >= date_trunc('day', now());

  select coalesce(sum(e.request_count), 0), coalesce(sum(e.prompt_tokens + e.completion_tokens), 0)
    into v_monthly_requests, v_monthly_tokens
  from public.ai_usage_events e
  where e.family_id = p_family_id
    and e.created_at >= date_trunc('month', now());

  if v_daily_requests + 1 > v_limits.daily_request_limit then
    raise exception 'Daily request quota exceeded';
  end if;

  if v_monthly_requests + 1 > v_limits.monthly_request_limit then
    raise exception 'Monthly request quota exceeded';
  end if;

  if v_daily_tokens + greatest(p_estimated_tokens, 0) > v_limits.daily_token_limit then
    raise exception 'Daily token quota exceeded';
  end if;

  if v_monthly_tokens + greatest(p_estimated_tokens, 0) > v_limits.monthly_token_limit then
    raise exception 'Monthly token quota exceeded';
  end if;
end;
$$;

revoke all on function public.assert_ai_quota(uuid, int) from public;
grant execute on function public.assert_ai_quota(uuid, int) to authenticated;

-- -----------------------
-- RLS
-- -----------------------

alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.weekly_plans enable row level security;
alter table public.weekly_plan_meals enable row level security;
alter table public.shopping_items enable row level security;
alter table public.invite_codes enable row level security;
alter table public.ai_usage_limits enable row level security;
alter table public.ai_usage_events enable row level security;

-- profiles
drop policy if exists "profiles self select" on public.profiles;
create policy "profiles self select"
on public.profiles
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "profiles self upsert" on public.profiles;
create policy "profiles self upsert"
on public.profiles
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- families
drop policy if exists "families member read" on public.families;
create policy "families member read"
on public.families
for select
to authenticated
using (public.is_family_member(id));

drop policy if exists "families owner create" on public.families;
create policy "families owner create"
on public.families
for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "families owner update" on public.families;
create policy "families owner update"
on public.families
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "families owner delete" on public.families;
create policy "families owner delete"
on public.families
for delete
to authenticated
using (owner_user_id = auth.uid());

-- family_members
drop policy if exists "family_members member read" on public.family_members;
create policy "family_members member read"
on public.family_members
for select
to authenticated
using (public.is_family_member(family_id));

drop policy if exists "family_members owner manage" on public.family_members;
create policy "family_members owner manage"
on public.family_members
for all
to authenticated
using (public.is_family_owner(family_id))
with check (public.is_family_owner(family_id));

-- weekly_plans
drop policy if exists "weekly_plans family access" on public.weekly_plans;
create policy "weekly_plans family access"
on public.weekly_plans
for all
to authenticated
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

-- weekly_plan_meals
drop policy if exists "weekly_plan_meals family access" on public.weekly_plan_meals;
create policy "weekly_plan_meals family access"
on public.weekly_plan_meals
for all
to authenticated
using (
  exists (
    select 1
    from public.weekly_plans wp
    where wp.id = plan_id
      and public.is_family_member(wp.family_id)
  )
)
with check (
  exists (
    select 1
    from public.weekly_plans wp
    where wp.id = plan_id
      and public.is_family_member(wp.family_id)
  )
);

-- shopping_items
drop policy if exists "shopping_items family access" on public.shopping_items;
create policy "shopping_items family access"
on public.shopping_items
for all
to authenticated
using (
  exists (
    select 1
    from public.weekly_plans wp
    where wp.id = plan_id
      and public.is_family_member(wp.family_id)
  )
)
with check (
  exists (
    select 1
    from public.weekly_plans wp
    where wp.id = plan_id
      and public.is_family_member(wp.family_id)
  )
);

-- invite_codes (owners manage, for admin UI)
drop policy if exists "invite_codes owner read" on public.invite_codes;
create policy "invite_codes owner read"
on public.invite_codes
for select
to authenticated
using (
  family_id is not null
  and public.is_family_owner(family_id)
);

drop policy if exists "invite_codes owner write" on public.invite_codes;
create policy "invite_codes owner write"
on public.invite_codes
for all
to authenticated
using (
  family_id is not null
  and public.is_family_owner(family_id)
)
with check (
  family_id is not null
  and public.is_family_owner(family_id)
);

-- ai_usage tables
drop policy if exists "ai_usage_limits family read" on public.ai_usage_limits;
create policy "ai_usage_limits family read"
on public.ai_usage_limits
for select
to authenticated
using (public.is_family_member(family_id));

drop policy if exists "ai_usage_limits owner write" on public.ai_usage_limits;
create policy "ai_usage_limits owner write"
on public.ai_usage_limits
for all
to authenticated
using (public.is_family_owner(family_id))
with check (public.is_family_owner(family_id));

drop policy if exists "ai_usage_events family read" on public.ai_usage_events;
create policy "ai_usage_events family read"
on public.ai_usage_events
for select
to authenticated
using (public.is_family_member(family_id));

drop policy if exists "ai_usage_events family insert" on public.ai_usage_events;
create policy "ai_usage_events family insert"
on public.ai_usage_events
for insert
to authenticated
with check (public.is_family_member(family_id));

