-- Named meal plans per family
-- Phase 1: persistence model for reusable dinner plans

create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  week_slot text not null default 'future' check (week_slot in ('current', 'next', 'future')),
  position int not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_meal_plans_family_slot_position
  on public.meal_plans(family_id, week_slot, position, created_at desc);

create table if not exists public.meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  meal_id text not null,
  title text not null,
  emoji text,
  source text not null default 'static' check (source in ('static', 'ai', 'custom')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_meal_plan_items_plan_sort
  on public.meal_plan_items(meal_plan_id, sort_order);

drop trigger if exists trg_meal_plans_set_updated_at on public.meal_plans;
create trigger trg_meal_plans_set_updated_at
before update on public.meal_plans
for each row execute function public.tg_set_updated_at();

alter table public.meal_plans enable row level security;
alter table public.meal_plan_items enable row level security;

drop policy if exists "meal_plans family access" on public.meal_plans;
create policy "meal_plans family access"
on public.meal_plans
for all
to authenticated
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

drop policy if exists "meal_plan_items family access" on public.meal_plan_items;
create policy "meal_plan_items family access"
on public.meal_plan_items
for all
to authenticated
using (
  exists (
    select 1
    from public.meal_plans mp
    where mp.id = meal_plan_id
      and public.is_family_member(mp.family_id)
  )
)
with check (
  exists (
    select 1
    from public.meal_plans mp
    where mp.id = meal_plan_id
      and public.is_family_member(mp.family_id)
  )
);
