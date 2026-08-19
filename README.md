# Balm — Patient Feedback Engine

Working title, see `SPEC.md` for the full build brief. This repo is being built
milestone by milestone per section 12 of the spec, stopping for review after each.

## Status

- [x] **Milestone 1** — database schema, row level security, seed data
- [x] **Milestone 2** — patient feedback form end to end
- [x] **Milestone 3** — auth, clinic onboarding, branches/providers, link generation
- [ ] Milestone 4 — dashboard, response feed, alerting + email
- [ ] Milestone 5 — publication queue, public clinic profile, admin moderation
- [ ] Milestone 6 — polish (empty/error states, offline retry, poster template)

## Stack

Next.js (App Router) + TypeScript + Tailwind, Supabase (Postgres, Auth), deployed on Vercel.
All free tier at launch volumes — see SPEC.md section 6.

## Supabase project

Project **Balm** (`cwnyayrsxujucrxqojuy`) lives in the Atofarati Supabase org, region `eu-west-2`.

- Schema, RLS policies, triggers and seed data are in `supabase/migrations/`, applied in order.
- `SUPABASE_SERVICE_ROLE_KEY` is intentionally left blank in `.env.local` — copy it yourself from
  the Supabase dashboard (Project Settings > API). It is never exposed to the client; only
  server-side code (`lib/supabase/admin.ts`) uses it.
- To develop locally against this project with the Supabase CLI: `supabase link --project-ref cwnyayrsxujucrxqojuy`.

### Data model notes worth knowing before Milestone 2+

- `responses.composite_score`, `responses.publish_status`, and `responses.comment_flagged` are
  computed by a `before insert` trigger — never set them from the app.
- Consent is enforced at the database level: a `check` constraint blocks any `publish_status`
  other than `none` unless `consent_to_publish = true`.
- Alerts are created automatically by an `after insert` trigger per SPEC section 9. Resolving one
  requires `note` to be at least 10 characters (also a `check` constraint).
- Row level security has no policies at all for the `anon` role, on any table. Patient-facing
  pages and the public clinic profile must read/write through server-side code using the service
  role client, never the browser client — see `lib/supabase/admin.ts`.
- A daily `pg_cron` job (`redact-expired-patient-contact`) nulls out `patient_name` /
  `patient_phone` on responses older than 180 days, per the retention rule in SPEC section 11.

### Patient form (`/r/[token]`)

- Its own root layout (`app/(patient)/layout.tsx`) skips the site's Geist webfonts entirely —
  system font stack only — to protect the 150KB page-weight budget in SPEC section 6.
- Measured **~139-142KB gzipped** (JS+CSS+HTML) in a production build against the 150KB ceiling.
  That's close to the floor for React + Next.js App Router with zero extra libraries — there's
  not much headroom left, so re-check this before adding any client-side dependency, especially
  in Milestone 6 polish.
- `POST /api/responses` de-dupes repeat submissions from the same hashed IP + token within 30
  seconds (SPEC section 11 abuse control), which also makes the client's automatic
  retry-once-on-failure safe against double inserts.
- `lib/phone.ts` normalizes Nigerian numbers (`0803...` / `+234803...`) to a plain `234...`
  string, shared between the client and the API route — also the format Milestone 4's WhatsApp
  click-to-chat links will need.

### Auth and clinic app (`/app`, `/login`, `/signup`, `/onboarding`)

- Signup is two steps on purpose: `/signup` only creates the Supabase Auth user; `/onboarding`
  (which requires a session but redirects away if a profile already exists) collects the clinic
  details and calls the `create_clinic_with_owner` RPC. This makes the flow work correctly
  whether or not the Supabase project has email confirmation turned on - if it does, the user
  lands on `/onboarding` on their first login after confirming, not right after signup.
- **This project's free tier has email confirmation on, and its built-in email sending has a low
  rate limit** - we hit "email rate limit exceeded" after a couple of test signups. Worth
  deciding deliberately: keep confirmation on and expect this limit at pilot-signup volume, turn
  it off for a lower-friction signup, or move to a transactional email provider with its own free
  tier before onboarding real clinics.
- `create_clinic_with_owner` is a `security definer` RPC (see `supabase/migrations/20260819161000_clinic_onboarding_rpc.sql`)
  because a brand-new signup has no profile yet, so the normal RLS insert policies can't let them
  create their own clinic - it creates the clinic, the owner profile, and one default branch
  atomically, and refuses to run twice for the same user.
- `proxy.ts` (Next.js 16 renamed `middleware.ts`) refreshes the auth cookie on every `/app`
  request and is scoped to exclude `/r/` and `/api/responses` entirely.
- `/app/team` is branches + providers (the people patients pick on the form), not staff login
  accounts - section 4/10 don't specify a screen for inviting additional staff users, so that's
  not built. `profiles.role = 'staff'` and its branch-scoped RLS are ready in the schema if that
  turns out to be needed.
- `/app/links` QR/PDF downloads (`/api/links/[id]/qr.png`, `.../qr.pdf`) use the session-scoped
  Supabase client, not the service role - RLS alone decides whether a link belongs to the
  requester's clinic, so cross-tenant access 404s for free. Verified this against a second test
  clinic before committing.
- Clinic logo upload goes to Supabase Storage (`clinic-logos` bucket, public read, write
  restricted to the owning clinic's owner by a `{clinic_id}/...` path-prefix RLS policy - see
  `supabase/migrations/20260819161100_clinic_logo_storage.sql`).

## Existing prior work

An existing Supabase project (`SabiHealth`) was found in the Atofarati org during setup but its
database was unreachable (credential error) at the time, so this build started from a clean
Supabase project rather than reconciling with it. Revisit SPEC section 16 once SabiHealth access
is restored.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
