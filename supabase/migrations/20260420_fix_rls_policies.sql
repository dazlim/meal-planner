-- Replace all is_family_member / is_family_owner calls in RLS policies with
-- direct subqueries. This eliminates the circular RLS dependency entirely and
-- works regardless of SECURITY DEFINER behaviour.
--
-- family_members read policy was already changed to: user_id = auth.uid()
-- That allows direct subqueries from other tables to resolve correctly.

-- weekly_plans
drop policy if exists "weekly_plans family access" on public.weekly_plans;
create policy "weekly_plans family access"
on public.weekly_plans for all to authenticated
using (
  exists (
    select 1 from public.family_members fm
    where fm.family_id = weekly_plans.family_id
      and fm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.family_members fm
    where fm.family_id = weekly_plans.family_id
      and fm.user_id = auth.uid()
  )
);

-- shopping_items (join through weekly_plans)
drop policy if exists "shopping_items family access" on public.shopping_items;
create policy "shopping_items family access"
on public.shopping_items for all to authenticated
using (
  exists (
    select 1 from public.weekly_plans wp
    join public.family_members fm on fm.family_id = wp.family_id
    where wp.id = shopping_items.plan_id
      and fm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.weekly_plans wp
    join public.family_members fm on fm.family_id = wp.family_id
    where wp.id = shopping_items.plan_id
      and fm.user_id = auth.uid()
  )
);

-- meal_plans
drop policy if exists "meal_plans family access" on public.meal_plans;
create policy "meal_plans family access"
on public.meal_plans for all to authenticated
using (
  exists (
    select 1 from public.family_members fm
    where fm.family_id = meal_plans.family_id
      and fm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.family_members fm
    where fm.family_id = meal_plans.family_id
      and fm.user_id = auth.uid()
  )
);

-- meal_plan_items (join through meal_plans)
drop policy if exists "meal_plan_items family access" on public.meal_plan_items;
create policy "meal_plan_items family access"
on public.meal_plan_items for all to authenticated
using (
  exists (
    select 1 from public.meal_plans mp
    join public.family_members fm on fm.family_id = mp.family_id
    where mp.id = meal_plan_items.meal_plan_id
      and fm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.meal_plans mp
    join public.family_members fm on fm.family_id = mp.family_id
    where mp.id = meal_plan_items.meal_plan_id
      and fm.user_id = auth.uid()
  )
);

-- families member read
drop policy if exists "families member read" on public.families;
create policy "families member read"
on public.families for select to authenticated
using (
  exists (
    select 1 from public.family_members fm
    where fm.family_id = families.id
      and fm.user_id = auth.uid()
  )
);

-- family_members owner manage
drop policy if exists "family_members owner manage" on public.family_members;
create policy "family_members owner manage"
on public.family_members for all to authenticated
using (
  exists (
    select 1 from public.families f
    where f.id = family_members.family_id
      and f.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.families f
    where f.id = family_members.family_id
      and f.owner_user_id = auth.uid()
  )
);

-- ai_usage_limits
drop policy if exists "ai_usage_limits family read" on public.ai_usage_limits;
create policy "ai_usage_limits family read"
on public.ai_usage_limits for select to authenticated
using (
  exists (
    select 1 from public.family_members fm
    where fm.family_id = ai_usage_limits.family_id
      and fm.user_id = auth.uid()
  )
);

drop policy if exists "ai_usage_limits owner write" on public.ai_usage_limits;
create policy "ai_usage_limits owner write"
on public.ai_usage_limits for all to authenticated
using (
  exists (
    select 1 from public.families f
    where f.id = ai_usage_limits.family_id
      and f.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.families f
    where f.id = ai_usage_limits.family_id
      and f.owner_user_id = auth.uid()
  )
);

-- ai_usage_events
drop policy if exists "ai_usage_events family read" on public.ai_usage_events;
create policy "ai_usage_events family read"
on public.ai_usage_events for select to authenticated
using (
  exists (
    select 1 from public.family_members fm
    where fm.family_id = ai_usage_events.family_id
      and fm.user_id = auth.uid()
  )
);

drop policy if exists "ai_usage_events family insert" on public.ai_usage_events;
create policy "ai_usage_events family insert"
on public.ai_usage_events for insert to authenticated
with check (
  exists (
    select 1 from public.family_members fm
    where fm.family_id = ai_usage_events.family_id
      and fm.user_id = auth.uid()
  )
);

-- invite_codes
drop policy if exists "invite_codes owner read" on public.invite_codes;
create policy "invite_codes owner read"
on public.invite_codes for select to authenticated
using (
  family_id is not null
  and exists (
    select 1 from public.families f
    where f.id = invite_codes.family_id
      and f.owner_user_id = auth.uid()
  )
);

drop policy if exists "invite_codes owner write" on public.invite_codes;
create policy "invite_codes owner write"
on public.invite_codes for all to authenticated
using (
  family_id is not null
  and exists (
    select 1 from public.families f
    where f.id = invite_codes.family_id
      and f.owner_user_id = auth.uid()
  )
)
with check (
  family_id is not null
  and exists (
    select 1 from public.families f
    where f.id = invite_codes.family_id
      and f.owner_user_id = auth.uid()
  )
);
