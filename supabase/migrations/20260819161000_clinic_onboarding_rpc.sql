-- A brand-new signed-up user has no profile yet, so the normal RLS insert
-- policies (which key off auth_profile_role()/clinic_id) can't let them create
-- their own clinic. This SECURITY DEFINER function does the whole onboarding
-- transaction atomically instead: clinic, owner profile, and one default
-- branch to start from - see Milestone 1's README note anticipating this.
create function create_clinic_with_owner(
  p_name text,
  p_slug text,
  p_phone text,
  p_email text,
  p_state text,
  p_lga text,
  p_address text
) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_clinic_id uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from profiles where user_id = v_uid) then
    raise exception 'This account is already linked to a clinic';
  end if;

  insert into clinics (name, slug, phone, email, state, lga, address)
  values (p_name, p_slug, p_phone, p_email, p_state, p_lga, p_address)
  returning id into v_clinic_id;

  insert into profiles (user_id, clinic_id, role, full_name)
  values (v_uid, v_clinic_id, 'owner', null);

  insert into branches (clinic_id, name, address, is_default)
  values (v_clinic_id, 'Main Branch', p_address, true);

  return v_clinic_id;
end;
$$;

revoke all on function create_clinic_with_owner(text,text,text,text,text,text,text) from public, anon;
grant execute on function create_clinic_with_owner(text,text,text,text,text,text,text) to authenticated;
