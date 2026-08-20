-- security invoker (the default, stated explicitly): runs as the calling
-- user, so their existing RLS on responses/alerts/branches/providers already
-- scopes everything to their clinic (and branch, if branch-limited staff) -
-- no clinic_id/branch_id parameters needed here at all.
create function dashboard_summary(p_since timestamptz) returns jsonb
language sql stable security invoker set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'total_responses', (select count(*) from responses where created_at >= p_since),
    'avg_composite_score', (select round(avg(composite_score)) from responses where created_at >= p_since),
    'open_alerts', (select count(*) from alerts where status = 'open'),
    'daily_trend', (
      select coalesce(jsonb_agg(t order by t.day), '[]'::jsonb) from (
        select date_trunc('day', created_at) as day,
               round(avg(composite_score)) as avg_score,
               count(*) as count
        from responses
        where created_at >= p_since
        group by 1
      ) t
    ),
    'by_branch', (
      select coalesce(jsonb_agg(b order by b.avg_score desc nulls last), '[]'::jsonb) from (
        select r.branch_id, br.name as branch_name, count(*) as count,
               round(avg(r.composite_score)) as avg_score
        from responses r
        join branches br on br.id = r.branch_id
        where r.created_at >= p_since
        group by r.branch_id, br.name
      ) b
    ),
    'by_provider', (
      select coalesce(jsonb_agg(p order by p.avg_score desc nulls last), '[]'::jsonb) from (
        select r.provider_id, pr.full_name as provider_name, count(*) as count,
               round(avg(r.composite_score)) as avg_score
        from responses r
        join providers pr on pr.id = r.provider_id
        where r.created_at >= p_since and r.provider_id is not null
        group by r.provider_id, pr.full_name
      ) p
    )
  );
$$;

revoke all on function dashboard_summary(timestamptz) from public, anon;
grant execute on function dashboard_summary(timestamptz) to authenticated;
