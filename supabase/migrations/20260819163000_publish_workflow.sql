-- SPEC 11: "Never publish a comment that names an individual member of staff."
-- Heuristic like comment_looks_clinical: checks each active provider's name
-- (minus short/common title words) for a whole-word, case-insensitive match
-- in the comment. Not perfect (common-name collisions are possible both
-- ways) but errs toward blocking, matching the "never" in the spec wording.
create function comment_names_a_provider(p_clinic_id uuid, p_comment text) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1
    from providers pr, unnest(regexp_split_to_array(pr.full_name, '\s+')) as word
    where pr.clinic_id = p_clinic_id
      and length(word) >= 3
      and lower(word) not in ('dr', 'dr.', 'mr', 'mr.', 'mrs', 'mrs.', 'miss', 'nurse', 'the')
      and p_comment is not null
      and p_comment ~* ('\y' || word || '\y')
  );
$$;

revoke all on function comment_names_a_provider(uuid, text) from public, anon, authenticated;

-- Stage 1: clinic owner approves or rejects a pending response for
-- publication (SPEC section 4 item 8). security definer because owners have
-- no direct UPDATE grant on responses at all (SPEC 11: "do not let a clinic
-- edit or delete a response, only respond to it") - this function is the one
-- narrow, audited exception, and only moves publish_status, nothing else.
create function clinic_set_publish_status(p_response_id uuid, p_decision text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_response responses%rowtype;
  v_role profile_role;
  v_clinic_id uuid;
begin
  if p_decision not in ('approve', 'reject') then
    raise exception 'Invalid decision';
  end if;

  select role, clinic_id into v_role, v_clinic_id from profiles where user_id = auth.uid();
  if v_role is distinct from 'owner' then
    raise exception 'Only the clinic owner can do that';
  end if;

  select * into v_response from responses where id = p_response_id;
  if not found or v_response.clinic_id is distinct from v_clinic_id then
    raise exception 'Response not found';
  end if;
  if v_response.publish_status is distinct from 'pending' then
    raise exception 'This response is not awaiting a decision';
  end if;

  if p_decision = 'approve' and comment_names_a_provider(v_response.clinic_id, v_response.comment) then
    raise exception 'This comment names a staff member by name and cannot be approved for publication - reject it instead.';
  end if;

  update responses
  set publish_status = case p_decision when 'approve' then 'approved'::publish_status else 'rejected'::publish_status end
  where id = p_response_id;
end;
$$;

revoke all on function clinic_set_publish_status(uuid, text) from public, anon;
grant execute on function clinic_set_publish_status(uuid, text) to authenticated;

-- Stage 2: Atofarati moderation, the second required pass from SPEC 11
-- ("Every published review passes through both the clinic's approval and
-- Atofarati's moderation"). Re-checks the staff-name rule as the actual
-- final gate before anything becomes public.
create function admin_publish_response(p_response_id uuid, p_decision text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_response responses%rowtype;
  v_display_name text;
begin
  if p_decision not in ('publish', 'reject') then
    raise exception 'Invalid decision';
  end if;
  if not exists (select 1 from profiles where user_id = auth.uid() and role = 'admin') then
    raise exception 'Admin only';
  end if;

  select * into v_response from responses where id = p_response_id;
  if not found then
    raise exception 'Response not found';
  end if;
  if v_response.publish_status is distinct from 'approved' then
    raise exception 'This response has not been approved by the clinic yet';
  end if;

  if p_decision = 'reject' then
    update responses set publish_status = 'rejected' where id = p_response_id;
    return;
  end if;

  if comment_names_a_provider(v_response.clinic_id, v_response.comment) then
    raise exception 'This comment names a staff member by name and cannot be published.';
  end if;

  v_display_name := coalesce(nullif(split_part(trim(v_response.patient_name), ' ', 1), ''), 'Anonymous');

  update responses set publish_status = 'published' where id = p_response_id;

  insert into public_reviews (response_id, clinic_id, display_name, body, score, published_at)
  values (v_response.id, v_response.clinic_id, v_display_name, v_response.comment, v_response.composite_score, now());
end;
$$;

revoke all on function admin_publish_response(uuid, text) from public, anon;
grant execute on function admin_publish_response(uuid, text) to authenticated;

-- Suspend / reinstate (SPEC 10 admin route).
create function admin_set_clinic_status(p_clinic_id uuid, p_status clinic_status) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from profiles where user_id = auth.uid() and role = 'admin') then
    raise exception 'Admin only';
  end if;
  update clinics set status = p_status where id = p_clinic_id;
end;
$$;

revoke all on function admin_set_clinic_status(uuid, clinic_status) from public, anon;
grant execute on function admin_set_clinic_status(uuid, clinic_status) to authenticated;
