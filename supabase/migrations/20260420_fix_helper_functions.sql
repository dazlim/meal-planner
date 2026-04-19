-- Fix circular RLS on family_members / families.
--
-- is_family_member queries family_members, which has an RLS policy that
-- calls is_family_member.  PostgreSQL's recursion guard fires and the inner
-- call returns false, so is_family_member always returns false for callers
-- that don't already bypass RLS — blocking every INSERT/UPDATE/DELETE that
-- uses these helpers in a WITH CHECK clause.
--
-- Making them SECURITY DEFINER lets the inner table scan run as the
-- function owner (postgres), bypassing RLS on the lookup itself.
-- auth.uid() is still evaluated from the caller's JWT, so the membership
-- check remains correct and scoped to the calling user.

create or replace function public.is_family_member(p_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
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
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.families f
    where f.id = p_family_id
      and f.owner_user_id = auth.uid()
  );
$$;
