-- Data protection retention rule (spec 11): drop patient name/phone after 180 days,
-- keep the anonymous score and answers.
create function redact_expired_patient_contact() returns void
language sql as $$
  update responses
  set patient_name = null, patient_phone = null
  where created_at < now() - interval '180 days'
    and (patient_name is not null or patient_phone is not null);
$$;

select cron.schedule(
  'redact-expired-patient-contact',
  '0 3 * * *',
  $$select redact_expired_patient_contact();$$
);
