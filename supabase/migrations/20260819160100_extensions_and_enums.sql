create extension if not exists pg_cron with schema extensions;

create type clinic_plan as enum ('free', 'paid');
create type clinic_status as enum ('active', 'suspended');
create type profile_role as enum ('owner', 'staff', 'admin');
create type link_channel as enum ('qr', 'whatsapp', 'sms', 'other');
create type wait_band as enum ('under_15', '15_to_30', '30_to_60', 'over_60');
create type return_intent as enum ('yes', 'maybe', 'no');
create type publish_status as enum ('none', 'pending', 'approved', 'rejected', 'published');
create type alert_status as enum ('open', 'resolved', 'ignored');
