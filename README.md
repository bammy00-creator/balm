# Balm — Patient Feedback Engine

Working title, see `SPEC.md` for the full build brief. This repo is being built
milestone by milestone per section 12 of the spec, stopping for review after each.

## Status

- [x] **Milestone 1** — database schema, row level security, seed data
- [x] **Milestone 2** — patient feedback form end to end
- [x] **Milestone 3** — auth, clinic onboarding, branches/providers, link generation
- [x] **Milestone 4** — dashboard, response feed, alerting + email
- [x] **Milestone 5** — publication queue, public clinic profile, admin moderation
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

### Dashboard, responses, alerts

- `dashboard_summary(p_since)` is a `security invoker` RPC (the default - stated explicitly) that
  aggregates total responses, average composite score, open alert count, a daily trend, and
  breakdowns by branch and provider in one round trip. Being invoker rather than definer is what
  makes this simple: it runs as the calling user, so their existing RLS on
  `responses`/`alerts`/`branches`/`providers` already scopes everything to their clinic (and
  branch, if branch-limited staff) - the function itself never takes a clinic_id or branch_id.
- Per-provider score breakdown is owner/admin-only in the UI (`app/(site)/app/page.tsx`) - a
  deliberate decision on SPEC section 17's open question, not a default: branch staff see their
  branch's overall trend and alerts, not named-individual scores.
- The dashboard's trend line (`app/(site)/app/trend-chart.tsx`) is a hand-rolled server-rendered
  SVG, not a charting library - no client JS at all for it.
- Alert emails (SPEC section 9) go out via Resend from `POST /api/responses` right after the
  insert, wrapped in try/catch so an email problem can never fail a patient's submission - see
  `lib/email.ts`. **`RESEND_API_KEY` and `ALERT_FROM_EMAIL` are blank in `.env.local`**; without
  them the send is skipped (logged only). Recipients come from a service-role-only RPC,
  `alert_recipient_emails`, that reads `auth.users.email` directly (not exposed to
  authenticated/anon at all).
- `lib/whatsapp.ts` builds the click-to-chat link shared by the alert email and the `/app/alerts`
  page itself.
- **Found and fixed during testing**: the duplicate-submission guard from Milestone 2 originally
  matched on hashed-IP + token + time window only, with no check that the answers matched. Two
  *different* patients on the same clinic wifi within 30 seconds would have had the second
  submission silently dropped (while still returning `ok: true`) - a real risk given how
  Nigerian clinic waiting rooms actually share networks. It now also requires the wait band,
  respect score, return intent, and comment to match before treating a submission as a repeat.

### Publication queue, public profile, and admin (`/app/publish`, `/c/[slug]`, `/admin`)

- Two-stage publication, matching SPEC 11 ("every published review passes through both the
  clinic's approval and Atofarati's moderation"): `clinic_set_publish_status` (owner, `pending` ->
  `approved`/`rejected`) and `admin_publish_response` (admin, `approved` -> `published`/`rejected`,
  which is also where the `public_reviews` row actually gets created). Both are `security definer`
  because owners/admins have no direct UPDATE grant on `responses` at all - see
  `supabase/migrations/20260819163000_publish_workflow.sql`.
- **SPEC 11's "never publish a comment that names an individual member of staff"** is enforced by
  `comment_names_a_provider`, a heuristic (like the clinical-detail flag from Milestone 1) that
  checks the clinic's provider names against the comment. It blocks at *both* the owner-approve
  step and the admin-publish step (the actual final gate) - verified this by submitting a review
  naming a real provider and confirming the owner's Approve button gets rejected with a clear
  message instead of silently succeeding.
- `display_name` on `public_reviews` is computed server-side as the patient's first name only
  (or "Anonymous"), per the spec's exact wording - never the full name, regardless of what was
  collected for callback purposes.
- `/c/[slug]` is public for every active clinic regardless of plan (a deliberate call on SPEC
  section 17's open question, made explicitly since payments aren't built and gating by "paid"
  would have meant no real clinic could have a public profile in v1). Suspended clinics 404
  instead of showing anything.
- There is no self-serve path to becoming an admin, by design - `/signup` only ever creates
  clinic owners. To promote a user: `insert into profiles (user_id, clinic_id, role, full_name)
  values ('<auth-user-id>', null, 'admin', '<name>');` directly in the Supabase dashboard/CLI.
- Admin visiting `/app` gets redirected to `/admin` - without that, an admin would land on a
  dashboard showing an aggregate across *every* clinic (correct per their RLS access, just not a
  useful landing page), found while testing this milestone.

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
