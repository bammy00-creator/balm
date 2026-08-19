-- Composite score: respect 50%, return intent 35%, wait band 15%, each mapped to a 0-100 subscore.
create function compute_composite_score(
  p_respect_score integer,
  p_return_intent return_intent,
  p_wait_band wait_band
) returns integer
language sql immutable as $$
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

-- Very small heuristic: flags free-text comments that mention clinical detail so they never
-- auto-enter the publication queue. Spec 11: store it, but keep a human in the loop.
create function comment_looks_clinical(p_comment text) returns boolean
language sql immutable as $$
  select p_comment is not null and p_comment ~* (
    '\y(diagnos\w*|prescri\w*|medicat\w*|dosage|symptom\w*|disease|cancer|hiv|malaria|typhoid|diabetes|hypertension|surgery|tumou?r|pregnan\w*|infection|blood test|x-?ray|scan result|biops\w*|covid|tuberculosis|drug\s?(name)?)\y'
  );
$$;

create function responses_before_insert() returns trigger
language plpgsql as $$
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

create trigger responses_before_insert_trg
before insert on responses
for each row execute function responses_before_insert();

create function responses_after_insert_alert() returns trigger
language plpgsql as $$
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

create trigger responses_after_insert_alert_trg
after insert on responses
for each row execute function responses_after_insert_alert();

create function alerts_before_update_stamp() returns trigger
language plpgsql as $$
begin
  if new.status = 'resolved' and old.status <> 'resolved' then
    if new.resolved_at is null then new.resolved_at := now(); end if;
    if new.resolved_by is null then new.resolved_by := auth.uid(); end if;
  end if;
  return new;
end;
$$;

create trigger alerts_before_update_stamp_trg
before update on alerts
for each row execute function alerts_before_update_stamp();
