-- Move RLS helper functions to a schema PostgREST never exposes, so they can't be called
-- as public RPCs, and pin search_path on every function per the security linter.
create schema if not exists private;

create function private.auth_profile_role() returns profile_role
language sql stable security definer set search_path = public, pg_temp as $$
  select role from profiles where user_id = auth.uid() limit 1;
$$;

create function private.auth_profile_clinic_id() returns uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select clinic_id from profiles where user_id = auth.uid() limit 1;
$$;

create function private.auth_profile_branch_id() returns uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select branch_id from profiles where user_id = auth.uid() limit 1;
$$;

create function private.is_admin() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select role from profiles where user_id = auth.uid() limit 1) = 'admin', false);
$$;

revoke all on function private.auth_profile_role() from public, anon;
revoke all on function private.auth_profile_clinic_id() from public, anon;
revoke all on function private.auth_profile_branch_id() from public, anon;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.auth_profile_role() to authenticated;
grant execute on function private.auth_profile_clinic_id() to authenticated;
grant execute on function private.auth_profile_branch_id() to authenticated;
grant execute on function private.is_admin() to authenticated;

-- Drop and recreate every policy against the private.* versions.
drop policy clinics_select on clinics;
drop policy clinics_update on clinics;
drop policy clinics_insert on clinics;
drop policy clinics_delete on clinics;
create policy clinics_select on clinics for select to authenticated
  using (private.is_admin() or id = private.auth_profile_clinic_id());
create policy clinics_update on clinics for update to authenticated
  using (private.is_admin() or (id = private.auth_profile_clinic_id() and private.auth_profile_role() = 'owner'));
create policy clinics_insert on clinics for insert to authenticated
  with check (private.is_admin());
create policy clinics_delete on clinics for delete to authenticated
  using (private.is_admin());

drop policy branches_select on branches;
drop policy branches_write on branches;
drop policy branches_update on branches;
drop policy branches_delete on branches;
create policy branches_select on branches for select to authenticated
  using (private.is_admin() or (clinic_id = private.auth_profile_clinic_id()
    and (private.auth_profile_branch_id() is null or id = private.auth_profile_branch_id())));
create policy branches_write on branches for insert to authenticated
  with check (private.is_admin() or (clinic_id = private.auth_profile_clinic_id() and private.auth_profile_role() = 'owner'));
create policy branches_update on branches for update to authenticated
  using (private.is_admin() or (clinic_id = private.auth_profile_clinic_id() and private.auth_profile_role() = 'owner'));
create policy branches_delete on branches for delete to authenticated
  using (private.is_admin() or (clinic_id = private.auth_profile_clinic_id() and private.auth_profile_role() = 'owner'));

drop policy providers_select on providers;
drop policy providers_insert on providers;
drop policy providers_update on providers;
drop policy providers_delete on providers;
create policy providers_select on providers for select to authenticated
  using (private.is_admin() or (clinic_id = private.auth_profile_clinic_id()
    and (private.auth_profile_branch_id() is null or branch_id = private.auth_profile_branch_id())));
create policy providers_insert on providers for insert to authenticated
  with check (private.is_admin() or (clinic_id = private.auth_profile_clinic_id() and private.auth_profile_role() = 'owner'));
create policy providers_update on providers for update to authenticated
  using (private.is_admin() or (clinic_id = private.auth_profile_clinic_id() and private.auth_profile_role() = 'owner'));
create policy providers_delete on providers for delete to authenticated
  using (private.is_admin() or (clinic_id = private.auth_profile_clinic_id() and private.auth_profile_role() = 'owner'));

drop policy profiles_select on profiles;
drop policy profiles_insert on profiles;
drop policy profiles_update on profiles;
drop policy profiles_delete on profiles;
create policy profiles_select on profiles for select to authenticated
  using (user_id = (select auth.uid()) or private.is_admin()
    or (clinic_id = private.auth_profile_clinic_id() and private.auth_profile_role() = 'owner'));
create policy profiles_insert on profiles for insert to authenticated
  with check (private.is_admin() or (private.auth_profile_role() = 'owner' and clinic_id = private.auth_profile_clinic_id()));
create policy profiles_update on profiles for update to authenticated
  using (user_id = (select auth.uid()) or private.is_admin()
    or (private.auth_profile_role() = 'owner' and clinic_id = private.auth_profile_clinic_id()));
create policy profiles_delete on profiles for delete to authenticated
  using (private.is_admin() or (private.auth_profile_role() = 'owner' and clinic_id = private.auth_profile_clinic_id() and user_id <> (select auth.uid())));

drop policy feedback_links_select on feedback_links;
drop policy feedback_links_insert on feedback_links;
drop policy feedback_links_update on feedback_links;
create policy feedback_links_select on feedback_links for select to authenticated
  using (private.is_admin() or (clinic_id = private.auth_profile_clinic_id()
    and (private.auth_profile_branch_id() is null or branch_id = private.auth_profile_branch_id())));
create policy feedback_links_insert on feedback_links for insert to authenticated
  with check (private.is_admin() or (clinic_id = private.auth_profile_clinic_id() and private.auth_profile_role() = 'owner'));
create policy feedback_links_update on feedback_links for update to authenticated
  using (private.is_admin() or (clinic_id = private.auth_profile_clinic_id() and private.auth_profile_role() = 'owner'));

drop policy responses_select on responses;
drop policy responses_admin_update on responses;
create policy responses_select on responses for select to authenticated
  using (private.is_admin() or (clinic_id = private.auth_profile_clinic_id()
    and (private.auth_profile_branch_id() is null or branch_id = private.auth_profile_branch_id())));
create policy responses_admin_update on responses for update to authenticated
  using (private.is_admin());

drop policy alerts_select on alerts;
drop policy alerts_update on alerts;
create policy alerts_select on alerts for select to authenticated
  using (private.is_admin() or (clinic_id = private.auth_profile_clinic_id()
    and (private.auth_profile_branch_id() is null or branch_id = private.auth_profile_branch_id())));
create policy alerts_update on alerts for update to authenticated
  using (private.is_admin() or (clinic_id = private.auth_profile_clinic_id()
    and (private.auth_profile_branch_id() is null or branch_id = private.auth_profile_branch_id())));

drop policy public_reviews_select on public_reviews;
create policy public_reviews_select on public_reviews for select to authenticated
  using (private.is_admin() or clinic_id = private.auth_profile_clinic_id());

drop policy audit_log_select on audit_log;
drop policy audit_log_insert on audit_log;
create policy audit_log_select on audit_log for select to authenticated
  using (private.is_admin() or (clinic_id = private.auth_profile_clinic_id() and private.auth_profile_role() = 'owner'));
create policy audit_log_insert on audit_log for insert to authenticated
  with check (actor_user_id = (select auth.uid()) and (private.is_admin() or clinic_id = private.auth_profile_clinic_id()));

drop function auth_profile_role();
drop function auth_profile_clinic_id();
drop function auth_profile_branch_id();
drop function is_admin();

-- Pin search_path on the remaining SECURITY INVOKER / trigger functions too.
create or replace function generate_short_token() returns text
language plpgsql volatile set search_path = public, pg_temp as $$
declare
  alphabet text := 'abcdefghjkmnpqrstuvwxyzACDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(alphabet, (floor(random() * length(alphabet)))::int + 1, 1);
  end loop;
  return result;
end;
$$;

create or replace function compute_composite_score(
  p_respect_score integer,
  p_return_intent return_intent,
  p_wait_band wait_band
) returns integer
language sql immutable set search_path = public, pg_temp as $$
  select round(
    (case p_respect_score
       when 1 then 0 when 2 then 25 when 3 then 50 when 4 then 75 when 5 then 100
     end) * 0.5
    +
    (case p_return_intent
       when 'yes' then 100 when 'maybe' then 50 when 'no' then 0
     end) * 0.35
    +
    (case p_wait_band
       when 'under_15' then 100 when '15_to_30' then 70 when '30_to_60' then 40 when 'over_60' then 0
     end) * 0.15
  )::integer;
$$;

create or replace function comment_looks_clinical(p_comment text) returns boolean
language sql immutable set search_path = public, pg_temp as $$
  select p_comment is not null and p_comment ~* (
    '\y(diagnos\w*|prescri\w*|medicat\w*|dosage|symptom\w*|disease|cancer|hiv|malaria|typhoid|diabetes|hypertension|surgery|tumou?r|pregnan\w*|infection|blood test|x-?ray|scan result|biops\w*|covid|tuberculosis|drug\s?(name)?)\y'
  );
$$;

create or replace function responses_before_insert() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  new.composite_score := compute_composite_score(new.respect_score, new.return_intent, new.wait_band);
  new.comment_flagged := comment_looks_clinical(new.comment);

  if new.consent_to_publish and not new.comment_flagged then
    new.publish_status := 'pending';
  else
    new.publish_status := 'none';
  end if;

  return new;
end;
$$;

create or replace function responses_after_insert_alert() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if new.return_intent = 'no'
     or new.respect_score <= 2
     or (new.wait_band = 'over_60' and new.respect_score <= 3)
  then
    insert into alerts (response_id, clinic_id, branch_id, status)
    values (new.id, new.clinic_id, new.branch_id, 'open');
  end if;
  return new;
end;
$$;

create or replace function alerts_before_update_stamp() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if new.status = 'resolved' and old.status <> 'resolved' then
    if new.resolved_at is null then new.resolved_at := now(); end if;
    if new.resolved_by is null then new.resolved_by := auth.uid(); end if;
  end if;
  return new;
end;
$$;

create or replace function redact_expired_patient_contact() returns void
language sql set search_path = public, pg_temp as $$
  update responses
  set patient_name = null, patient_phone = null
  where created_at < now() - interval '180 days'
    and (patient_name is not null or patient_phone is not null);
$$;

-- Missing FK covering indexes flagged by the performance advisor.
create index alerts_branch_idx on alerts (branch_id);
create index alerts_resolved_by_idx on alerts (resolved_by);
create index audit_log_actor_idx on audit_log (actor_user_id);
create index feedback_links_branch_idx on feedback_links (branch_id);
create index profiles_branch_idx on profiles (branch_id);
create index profiles_clinic_idx on profiles (clinic_id);
create index providers_branch_idx on providers (branch_id);
create index responses_provider_idx on responses (provider_id);
