insert into storage.buckets (id, name, public)
values ('clinic-logos', 'clinic-logos', true)
on conflict (id) do nothing;

-- Public read (logos appear on the public clinic profile from Milestone 5).
-- Writes are restricted to the owning clinic's owner, keyed by the upload
-- path convention "{clinic_id}/...".
create policy "clinic_logos_public_read" on storage.objects for select
  using (bucket_id = 'clinic-logos');

create policy "clinic_logos_owner_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'clinic-logos'
    and (storage.foldername(name))[1] = private.auth_profile_clinic_id()::text
    and private.auth_profile_role() = 'owner'
  );

create policy "clinic_logos_owner_update" on storage.objects for update to authenticated
  using (
    bucket_id = 'clinic-logos'
    and (storage.foldername(name))[1] = private.auth_profile_clinic_id()::text
    and private.auth_profile_role() = 'owner'
  );

create policy "clinic_logos_owner_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'clinic-logos'
    and (storage.foldername(name))[1] = private.auth_profile_clinic_id()::text
    and private.auth_profile_role() = 'owner'
  );
