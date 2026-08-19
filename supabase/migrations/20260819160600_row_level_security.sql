alter table clinics enable row level security;
alter table branches enable row level security;
alter table providers enable row level security;
alter table profiles enable row level security;
alter table feedback_links enable row level security;
alter table responses enable row level security;
alter table alerts enable row level security;
alter table public_reviews enable row level security;
alter table audit_log enable row level security;

-- No policies are defined for the anon role anywhere: patient-facing and public pages read
-- and write through trusted server code (service role, never shipped to the browser), so
-- anon stays default-deny on every table. Only authenticated clinic/admin sessions get rows,
-- and always scoped to their own clinic (and branch, where a staff profile is branch-limited).

-- clinics
create policy clinics_select on clinics for select to authenticated
  using (is_admin() or id = auth_profile_clinic_id());
create policy clinics_update on clinics for update to authenticated
  using (is_admin() or (id = auth_profile_clinic_id() and auth_profile_role() = 'owner'));
create policy clinics_insert on clinics for insert to authenticated
  with check (is_admin());
create policy clinics_delete on clinics for delete to authenticated
  using (is_admin());

-- branches
create policy branches_select on branches for select to authenticated
  using (is_admin() or (clinic_id = auth_profile_clinic_id()
    and (auth_profile_branch_id() is null or id = auth_profile_branch_id())));
create policy branches_write on branches for insert to authenticated
  with check (is_admin() or (clinic_id = auth_profile_clinic_id() and auth_profile_role() = 'owner'));
create policy branches_update on branches for update to authenticated
  using (is_admin() or (clinic_id = auth_profile_clinic_id() and auth_profile_role() = 'owner'));
create policy branches_delete on branches for delete to authenticated
  using (is_admin() or (clinic_id = auth_profile_clinic_id() and auth_profile_role() = 'owner'));

-- providers
create policy providers_select on providers for select to authenticated
  using (is_admin() or (clinic_id = auth_profile_clinic_id()
    and (auth_profile_branch_id() is null or branch_id = auth_profile_branch_id())));
create policy providers_insert on providers for insert to authenticated
  with check (is_admin() or (clinic_id = auth_profile_clinic_id() and auth_profile_role() = 'owner'));
create policy providers_update on providers for update to authenticated
  using (is_admin() or (clinic_id = auth_profile_clinic_id() and auth_profile_role() = 'owner'));
create policy providers_delete on providers for delete to authenticated
  using (is_admin() or (clinic_id = auth_profile_clinic_id() and auth_profile_role() = 'owner'));

-- profiles
create policy profiles_select on profiles for select to authenticated
  using (user_id = auth.uid() or is_admin()
    or (clinic_id = auth_profile_clinic_id() and auth_profile_role() = 'owner'));
create policy profiles_insert on profiles for insert to authenticated
  with check (is_admin() or (auth_profile_role() = 'owner' and clinic_id = auth_profile_clinic_id()));
create policy profiles_update on profiles for update to authenticated
  using (user_id = auth.uid() or is_admin()
    or (auth_profile_role() = 'owner' and clinic_id = auth_profile_clinic_id()));
create policy profiles_delete on profiles for delete to authenticated
  using (is_admin() or (auth_profile_role() = 'owner' and clinic_id = auth_profile_clinic_id() and user_id <> auth.uid()));

-- feedback_links
create policy feedback_links_select on feedback_links for select to authenticated
  using (is_admin() or (clinic_id = auth_profile_clinic_id()
    and (auth_profile_branch_id() is null or branch_id = auth_profile_branch_id())));
create policy feedback_links_insert on feedback_links for insert to authenticated
  with check (is_admin() or (clinic_id = auth_profile_clinic_id() and auth_profile_role() = 'owner'));
create policy feedback_links_update on feedback_links for update to authenticated
  using (is_admin() or (clinic_id = auth_profile_clinic_id() and auth_profile_role() = 'owner'));

-- responses: clinics never get insert/update/delete access (abuse control, spec 11); all
-- writes happen server-side with the service role after validation.
create policy responses_select on responses for select to authenticated
  using (is_admin() or (clinic_id = auth_profile_clinic_id()
    and (auth_profile_branch_id() is null or branch_id = auth_profile_branch_id())));
create policy responses_admin_update on responses for update to authenticated
  using (is_admin());

-- alerts: staff/owner may resolve within their own scope; the note-length check constraint
-- already guards the "resolved" transition.
create policy alerts_select on alerts for select to authenticated
  using (is_admin() or (clinic_id = auth_profile_clinic_id()
    and (auth_profile_branch_id() is null or branch_id = auth_profile_branch_id())));
create policy alerts_update on alerts for update to authenticated
  using (is_admin() or (clinic_id = auth_profile_clinic_id()
    and (auth_profile_branch_id() is null or branch_id = auth_profile_branch_id())));

-- public_reviews: clinic staff can see their own published reviews; publication itself is a
-- server-side action (approve/reject route) using the service role.
create policy public_reviews_select on public_reviews for select to authenticated
  using (is_admin() or clinic_id = auth_profile_clinic_id());

-- audit_log: append-only; owners see their own clinic's trail, admins see everything, no one
-- can update or delete a log entry through the API.
create policy audit_log_select on audit_log for select to authenticated
  using (is_admin() or (clinic_id = auth_profile_clinic_id() and auth_profile_role() = 'owner'));
create policy audit_log_insert on audit_log for insert to authenticated
  with check (actor_user_id = auth.uid() and (is_admin() or clinic_id = auth_profile_clinic_id()));
