create table clinics (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  slug text not null unique,
  phone text,
  email text,
  state text,
  lga text,
  address text,
  logo_url text,
  plan clinic_plan not null default 'free',
  monthly_response_limit integer not null default 50,
  status clinic_status not null default 'active',
  constraint slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table branches (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  name text not null,
  address text,
  is_default boolean not null default false
);

create table providers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  full_name text not null,
  role text,
  is_active boolean not null default true
);

create table profiles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  clinic_id uuid references clinics(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  role profile_role not null,
  full_name text,
  constraint clinic_required_unless_admin check (role = 'admin' or clinic_id is not null)
);

create table feedback_links (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  token text not null unique,
  channel link_channel not null default 'qr',
  label text,
  is_active boolean not null default true,
  constraint token_format check (char_length(token) = 8)
);

create table responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  clinic_id uuid not null references clinics(id) on delete restrict,
  branch_id uuid not null references branches(id) on delete restrict,
  provider_id uuid references providers(id) on delete set null,
  link_id uuid references feedback_links(id) on delete set null,
  wait_band wait_band not null,
  respect_score integer not null check (respect_score between 1 and 5),
  return_intent return_intent not null,
  comment text check (char_length(comment) <= 300),
  comment_flagged boolean not null default false,
  patient_name text,
  patient_phone text,
  consent_to_publish boolean not null default false,
  composite_score integer not null default 0 check (composite_score between 0 and 100),
  publish_status publish_status not null default 'none',
  source_ip_hash text,
  constraint publish_requires_consent check (publish_status = 'none' or consent_to_publish = true)
);

create table alerts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  response_id uuid not null unique references responses(id) on delete cascade,
  clinic_id uuid not null references clinics(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  status alert_status not null default 'open',
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  note text,
  constraint resolution_needs_note check (status <> 'resolved' or (note is not null and char_length(note) >= 10))
);

create table public_reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  response_id uuid not null unique references responses(id) on delete cascade,
  clinic_id uuid not null references clinics(id) on delete cascade,
  display_name text not null,
  body text,
  score integer not null check (score between 0 and 100),
  published_at timestamptz not null default now()
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_user_id uuid references auth.users(id) on delete set null,
  clinic_id uuid references clinics(id) on delete set null,
  action text not null,
  target_table text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb
);

create index responses_clinic_created_idx on responses (clinic_id, created_at desc);
create index responses_branch_idx on responses (branch_id);
create index responses_link_idx on responses (link_id);
create index responses_publish_status_idx on responses (clinic_id, publish_status);
create index alerts_clinic_status_idx on alerts (clinic_id, status);
create index branches_clinic_idx on branches (clinic_id);
create index providers_clinic_branch_idx on providers (clinic_id, branch_id);
create index feedback_links_clinic_idx on feedback_links (clinic_id);
create index public_reviews_clinic_idx on public_reviews (clinic_id, published_at desc);
create index audit_log_clinic_idx on audit_log (clinic_id, created_at desc);
