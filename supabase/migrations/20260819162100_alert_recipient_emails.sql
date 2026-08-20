-- Only ever called from server code with the service role (POST /api/responses,
-- right after an alert is created) - not exposed to authenticated/anon at all,
-- since it reads auth.users.email directly.
create function alert_recipient_emails(p_clinic_id uuid, p_branch_id uuid) returns text[]
language sql stable security definer set search_path = public, pg_temp as $$
  select array_agg(distinct u.email)
  from profiles p
  join auth.users u on u.id = p.user_id
  where p.clinic_id = p_clinic_id
    and (
      p.role = 'owner'
      or (p.role = 'staff' and (p.branch_id is null or p.branch_id = p_branch_id))
    );
$$;

revoke all on function alert_recipient_emails(uuid, uuid) from public, anon, authenticated;
