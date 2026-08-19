# Patient Feedback Engine

## Build Specification, Version 1.0

**Owner:** Atofarati Ltd
**Prepared:** 19 August 2026
**Codename:** Balm (working title, rename before launch)
**Purpose of this document:** a complete build brief to hand to Claude Code. It defines what to build, what not to build, the data model, the screens, and the conditions for calling version one finished.

---

## 1. How to use this document

Step one, create an empty repository and drop this file into it as `SPEC.md`.

Step two, add any existing project files or designs from the earlier healthcare review platform work into a folder called `/existing` in the same repository, then tell Claude Code to read both before writing code.

Step three, instruct Claude Code to work milestone by milestone as set out in section 12, and to stop after each milestone for review rather than building the whole thing in one pass.

Step four, do not let it add features outside section 4. Everything in section 5 is explicitly out of scope for version one.

---

## 2. Product summary

A clinic sends a short feedback link to a patient after a visit. The patient answers four questions in under thirty seconds on their phone. The clinic sees the results in a dashboard broken down by branch and by staff member. Low scores trigger an immediate alert so the clinic can call the patient back the same day. High scores, with the patient's permission, are published to a public review platform.

The paying customer is the clinic. The patient is the source of supply. The public review platform is fed by the tool rather than being the tool.

---

## 3. Users and roles

**Patient.** No account, no login. Opens a link or scans a QR code, answers, leaves. Must never be asked to register.

**Clinic staff (role: staff).** Logs in, sees responses and alerts for their branch only. Can mark an alert as resolved and add a note.

**Clinic owner or manager (role: owner).** Everything staff can do, plus adding branches and staff members, approving reviews for publication, and managing billing details.

**Platform admin (role: admin).** Internal Atofarati account. Can see all clinics, moderate anything queued for public publication, and suspend an account.

---

## 4. Scope of version one

1. Clinic signup and login.
2. Adding branches and staff members.
3. Generating feedback links and printable QR codes per branch.
4. The patient feedback form, four questions.
5. The clinic dashboard with scores over time, by branch, and by staff member.
6. A response feed with filters.
7. Low score alerting by email, with a WhatsApp click-to-chat link back to the patient where a number was captured.
8. A publication queue where the owner approves or rejects responses for public display.
9. A public clinic profile page showing approved reviews and an aggregate score.
10. An internal admin view for moderation.

---

## 5. Explicitly out of scope for version one

Do not build any of the following, even if it seems easy. Each one adds regulatory load, cost, or delay.

- Appointment booking or scheduling.
- Any storage of clinical information: conditions, diagnoses, medications, test results, or reasons for visit.
- Electronic medical records of any kind, or integration with any.
- Payments, billing, invoicing, or subscription charging inside the app. Collect payment manually outside the product until the model is proven.
- A patient account system or patient login.
- Native mobile applications.
- The WhatsApp Business API. Use click-to-chat links and manual sending in version one.
- SMS sending. If a clinic wants it, that is a later milestone with cost passed through to the clinic.
- Insurer or HMO dashboards.
- Multi-language support beyond English at launch.

---

## 6. Technical constraints

**Stack:** Next.js with the App Router, TypeScript, Tailwind, Supabase for Postgres, authentication and storage, deployed on Vercel.

**Cost ceiling:** the entire system must run on free tiers at launch. No paid third party services in version one. No paid email provider if a free tier alternative exists.

**Network conditions:** built for Nigerian mobile networks. The patient form must load in under two seconds on a 3G connection and the entire page weight must stay under 150KB including fonts. No heavy client libraries on the patient side. Server render the form. If a submission fails, retry once and show a clear message rather than losing the answers.

**Devices:** assume an inexpensive Android phone with a small screen. Design mobile first, at 360 pixels wide. Tap targets no smaller than 44 pixels.

**Localisation:** Nigerian phone number formats, both 0803 and +234 forms accepted. Dates in day, month, year order. Currency in naira where any figure appears.

**Security:** row level security enforced in Supabase so no clinic can read another clinic's rows. All clinic scoped queries must filter by the authenticated user's clinic. Never expose service role keys to the client.

---

## 7. Data model

Use snake case table and column names. Every table gets `id` as a uuid primary key and `created_at` as a timestamp with time zone defaulting to now.

**clinics**
name, slug (unique, used in the public URL), phone, email, state, lga, address, logo_url (nullable), plan (enum: free, paid), monthly_response_limit (integer, default 50), status (enum: active, suspended)

**branches**
clinic_id (foreign key), name, address, is_default (boolean)

**providers**
clinic_id, branch_id, full_name, role (free text such as Doctor, Nurse, Front desk), is_active (boolean). Listed so patients can optionally say who attended to them.

**profiles**
Links a Supabase auth user to a clinic. user_id, clinic_id, branch_id (nullable, null means all branches), role (enum: owner, staff, admin), full_name

**feedback_links**
clinic_id, branch_id, token (short, unique, URL safe, 8 characters), channel (enum: qr, whatsapp, sms, other), label, is_active

**responses**
clinic_id, branch_id, provider_id (nullable), link_id (nullable), wait_band (enum: under_15, 15_to_30, 30_to_60, over_60), respect_score (integer 1 to 5), return_intent (enum: yes, maybe, no), comment (text, nullable, maximum 300 characters), patient_name (nullable), patient_phone (nullable), consent_to_publish (boolean, default false), composite_score (integer 0 to 100, computed on write), publish_status (enum: none, pending, approved, rejected, published), source_ip_hash (text, for abuse control only, never a raw IP)

**alerts**
response_id, clinic_id, branch_id, status (enum: open, resolved, ignored), resolved_by (nullable), resolved_at (nullable), note (nullable)

**public_reviews**
response_id, clinic_id, display_name (either a first name or the word Anonymous), body, score, published_at

**audit_log**
actor_user_id, clinic_id, action, target_table, target_id, metadata (jsonb)

---

## 8. The patient form

This is the most important screen in the product. If patients do not finish it, nothing else matters. One question per screen, a progress indicator, no back button traps, and no required fields except the first three.

**Screen 0, consent and framing.** A single short paragraph: this clinic wants to know how your visit went. It takes about thirty seconds. Do not tell us anything about your health condition. Your answers are shared with the clinic. Below it, a button reading Start.

**Question 1.** How long did you wait before someone attended to you?
Options: Less than 15 minutes, 15 to 30 minutes, 30 minutes to an hour, More than an hour.

**Question 2.** Were you treated with respect and courtesy?
A five point scale with words rather than numbers on screen: Not at all, Not really, It was fine, Yes, Very much so.

**Question 3.** Would you come back to this clinic?
Options: Yes, Maybe, No.

**Question 4, optional.** Anything you would like them to know?
Free text, 300 character limit, with helper text reading: please do not include details about your health condition.

**Optional extras shown after question 4, all skippable.** Who attended to you (a dropdown of active providers for that branch, plus an option reading I would rather not say). Your name and phone number if you are happy for the clinic to call you back. A checkbox reading: you may publish my comment publicly, without my full name.

**Thank you screen.** Short. If return intent was No or respect score was 1 or 2, show a line saying the clinic manager has been notified and may call. Do not ask for anything else.

**Composite score formula.** Respect score contributes 50 percent, return intent contributes 35 percent, wait band contributes 15 percent. Map each to a 0 to 100 subscore, weight, and round to a whole number.

---

## 9. Alerting logic

Create an alert with status open when any of the following is true on write: return_intent is no, or respect_score is 1 or 2, or wait_band is over_60 combined with a respect_score of 3 or below.

On alert creation, send an email to the clinic owner and to any staff assigned to that branch. The email contains the composite score, the four answers, the comment, and the time. If a phone number was given, include a WhatsApp click-to-chat link so the manager can reach the patient in one tap.

Alerts appear at the top of the dashboard until resolved. Resolving requires a note of at least ten characters. This is deliberate friction: the note is what makes the tool operationally useful rather than decorative.

---

## 10. Screens and routes

**Public and patient facing**
- `/r/[token]` the feedback form
- `/r/[token]/done` the thank you screen
- `/c/[clinic-slug]` the public clinic profile with aggregate score and approved reviews

**Clinic application, all behind authentication at `/app`**
- `/app` dashboard: composite score for the last 30 days, trend line, response count, open alerts, breakdown by branch and by provider
- `/app/responses` filterable feed by date range, branch, provider, and score band
- `/app/alerts` open and resolved alerts
- `/app/publish` the approval queue for responses where the patient consented
- `/app/team` branches and providers
- `/app/links` generate links, download printable QR codes as PDF or PNG
- `/app/settings` clinic details and logo

**Internal**
- `/admin` clinic list, moderation queue, suspend and reinstate

**API**
- `POST /api/responses` accepts a submission, validates, writes, computes the score, creates an alert if triggered
- `POST /api/alerts/[id]/resolve`
- `POST /api/publish/[id]` approve or reject

---

## 11. Privacy, legal and abuse controls

These are not optional and they shape the build.

**No clinical data, ever.** No field in the schema may hold health information. Validate the free text comment on submission and, if it appears to contain clinical detail, still store it but flag it for review rather than allowing it into the publication queue automatically.

**Consent.** The first screen states plainly what is collected and who sees it. Publication requires a separate explicit checkbox. A patient who does not tick it must never appear publicly.

**Data protection.** Build to the Nigeria Data Protection Act. Store the minimum, keep raw IP addresses out of the database, hash anything used for abuse control, and include a retention rule that deletes patient names and phone numbers after 180 days while keeping the anonymous scores.

**Publication and defamation.** Only responses from a real submission may be published, never manually written entries. Every published review passes through both the clinic's approval and Atofarati's moderation. Never publish a comment that names an individual member of staff. Give every clinic a documented right of reply before anything critical goes live. This limits legal exposure and it is the reason the public side lags the clinic side.

**Abuse control.** Rate limit submissions per token. Ignore repeat submissions from the same hashed source within a short window. Do not let a clinic edit or delete a response, only respond to it.

---

## 12. Build order

Work in this order and stop for review at the end of each milestone.

**Milestone 1.** Database schema, row level security policies, and seed data for two fictional clinics with three branches and eight providers.

**Milestone 2.** The patient form end to end, including score computation and writing to the database. No dashboard yet. This is the piece that gets tested with real patients first.

**Milestone 3.** Authentication, clinic onboarding, branches and providers, link generation and QR download.

**Milestone 4.** The dashboard, the response feed, and the alerting flow including email.

**Milestone 5.** The publication queue, the public clinic profile page, and the admin moderation view.

**Milestone 6.** Polish: empty states, error states, offline and retry behaviour on the patient form, and a printable one page poster template for clinic waiting rooms.

---

## 13. Acceptance criteria for version one

1. A patient on a mid range Android phone on 3G can open the link and submit in under 40 seconds.
2. The patient form page weighs under 150KB.
3. A submission scoring below the alert threshold produces an email to the clinic within 60 seconds.
4. A clinic account cannot read, by any route, a single row belonging to another clinic. Test this deliberately.
5. No table in the schema can hold clinical information.
6. A response without the publication consent box ticked cannot be published, and this is enforced at the database level as well as in the interface.
7. The dashboard renders correctly with zero responses, with one response, and with five thousand.
8. The whole system runs at zero monthly cost at launch volumes.

---

## 14. Test and pilot plan

Before writing code, visit ten private clinics and confirm the problem. Recruit three as free pilots.

The only metric that matters in the pilot is response rate, meaning completed responses divided by links sent or QR codes displayed. If it falls below one in five, the problem is the ask and the wording, not the software. Fix the ask before building anything further.

Second metric, alert response time, meaning how long the clinic takes to resolve an alert. If clinics ignore alerts, the product has no operational value and the pricing model needs rethinking.

---

## 15. Commercial model, for context only

Not built into version one, but the software should not make it impossible later.

Free tier capped at a monthly response limit. Paid tier per clinic location, priced somewhere in the region of twenty five to fifty thousand naira per location per month. Treat that as a hypothesis to be tested in conversation, not a researched market rate. Collect payment manually by transfer until at least ten clinics are paying.

---

## 16. Slot for existing work

If there are existing assets from the earlier healthcare review platform, place them in `/existing` and reconcile them against this specification before building. Specifically, note the following and update this document accordingly:

- The existing product name and whether this tool carries it or sits beside it.
- Any existing database schema, so tables can be merged rather than duplicated.
- Any existing brand assets: colours, typefaces, logo.
- Any existing domain or deployment already live.
- Any list of clinics or hospitals already gathered, which becomes the pilot outreach list.

---

## 17. Open decisions for the founder

1. Product name, and whether the clinic tool and the public review platform share it.
2. Whether the public platform launches at all in version one, or waits until several hundred approved reviews exist.
3. Whether free tier clinics appear on the public platform or only paying ones.
4. The exact free tier response cap.
5. Whether staff level breakdown is shown to all clinic staff or only to owners, since it changes how the tool feels to work under.

---

*This document specifies a product build. It is not legal, medical, or tax advice. Have a Nigerian lawyer review the public publication terms and the data protection notice before the public side goes live.*
