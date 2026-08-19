-- Helper functions used by RLS policies. security definer + fixed search_path so they can
-- read profiles regardless of the caller's own RLS grants, without being hijackable.
create function auth_profile_role() returns profile_role
language sql stable security definer set search_path = public as $$
  select role from profiles where user_id = auth.uid() limit 1;
$$;

create function auth_profile_clinic_id() returns uuid
language sql stable security definer set search_path = public as $$
  select clinic_id from profiles where user_id = auth.uid() limit 1;
$$;

create function auth_profile_branch_id() returns uuid
language sql stable security definer set search_path = public as $$
  select branch_id from profiles where user_id = auth.uid() limit 1;
$$;

create function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role from profiles where user_id = auth.uid() limit 1) = 'admin', false);
$$;

create function generate_short_token() returns text
language plpgsql volatile as $$
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

alter table feedback_links alter column token set default generate_short_token();
