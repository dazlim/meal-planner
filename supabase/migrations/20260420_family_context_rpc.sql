-- Security-definer helper so the client never needs direct profile/family_member
-- reads.  Avoids any RLS edge-cases with the anon-key JWT flow.
create or replace function public.get_my_family_context()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      uuid;
  v_approved timestamptz;
  v_fid      uuid;
begin
  v_uid := auth.uid();

  if v_uid is null then
    return json_build_object('is_approved', false, 'family_id', null);
  end if;

  select approved_at into v_approved
  from public.profiles
  where user_id = v_uid;

  if v_approved is null then
    return json_build_object('is_approved', false, 'family_id', null);
  end if;

  select family_id into v_fid
  from public.family_members
  where user_id = v_uid
  limit 1;

  return json_build_object('is_approved', true, 'family_id', v_fid);
end;
$$;

revoke all on function public.get_my_family_context() from public;
grant execute on function public.get_my_family_context() to authenticated;
grant execute on function public.get_my_family_context() to anon;
