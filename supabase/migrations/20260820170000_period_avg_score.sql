-- security invoker, same reasoning as dashboard_summary: RLS on responses
-- already scopes this to the caller's clinic/branch, so no parameters needed
-- beyond the date bounds. Used to compute the "up N points on the month
-- before" comparison on the Overview screen (DESIGN.md section 9).
create function period_avg_score(p_since timestamptz, p_until timestamptz) returns integer
language sql stable security invoker set search_path = public, pg_temp as $$
  select round(avg(composite_score))::integer
  from responses
  where created_at >= p_since and created_at < p_until;
$$;

revoke all on function period_avg_score(timestamptz, timestamptz) from public, anon;
grant execute on function period_avg_score(timestamptz, timestamptz) to authenticated;
