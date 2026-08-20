import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeNigerianPhone } from "@/lib/phone";
import { sendAlertEmail } from "@/lib/email";
import type { Enums } from "@/types/database";

const WAIT_BANDS: Enums<"wait_band">[] = [
  "under_15",
  "15_to_30",
  "30_to_60",
  "over_60",
];
const RETURN_INTENTS: Enums<"return_intent">[] = ["yes", "maybe", "no"];

// Same window used to dedupe accidental double-submits, e.g. from the client's
// automatic retry-on-failure (SPEC 6), as for actual per-token abuse (SPEC 11).
const DUPLICATE_WINDOW_SECONDS = 30;

function hashIp(ip: string) {
  const salt = process.env.IP_HASH_SALT ?? "";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const {
    token,
    wait_band,
    respect_score,
    return_intent,
    comment,
    provider_id,
    patient_name,
    patient_phone,
    consent_to_publish,
  } = body as Record<string, unknown>;

  if (typeof token !== "string" || !token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }
  if (!WAIT_BANDS.includes(wait_band as Enums<"wait_band">)) {
    return NextResponse.json({ error: "Invalid wait_band." }, { status: 400 });
  }
  if (
    typeof respect_score !== "number" ||
    !Number.isInteger(respect_score) ||
    respect_score < 1 ||
    respect_score > 5
  ) {
    return NextResponse.json({ error: "Invalid respect_score." }, { status: 400 });
  }
  if (!RETURN_INTENTS.includes(return_intent as Enums<"return_intent">)) {
    return NextResponse.json({ error: "Invalid return_intent." }, { status: 400 });
  }
  if (comment != null && (typeof comment !== "string" || comment.length > 300)) {
    return NextResponse.json({ error: "Comment is too long." }, { status: 400 });
  }

  let normalizedPhone: string | null = null;
  if (patient_phone != null) {
    if (typeof patient_phone !== "string") {
      return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });
    }
    normalizedPhone = normalizeNigerianPhone(patient_phone);
    if (!normalizedPhone) {
      return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });
    }
  }

  const supabase = createAdminClient();

  const { data: link } = await supabase
    .from("feedback_links")
    .select("id, clinic_id, branch_id, is_active, clinics(name, status), branches(name)")
    .eq("token", token)
    .maybeSingle();

  const clinic = link?.clinics as unknown as { name: string; status: string } | null;
  const branch = link?.branches as unknown as { name: string } | null;

  if (!link || !link.is_active || !clinic || clinic.status !== "active") {
    return NextResponse.json({ error: "This link is not active." }, { status: 404 });
  }

  if (provider_id != null) {
    if (typeof provider_id !== "string") {
      return NextResponse.json({ error: "Invalid provider." }, { status: 400 });
    }
    const { data: provider } = await supabase
      .from("providers")
      .select("id")
      .eq("id", provider_id)
      .eq("branch_id", link.branch_id)
      .eq("is_active", true)
      .maybeSingle();
    if (!provider) {
      return NextResponse.json({ error: "Invalid provider." }, { status: 400 });
    }
  }

  const sourceIpHash = hashIp(getClientIp(request));

  // Matches on the actual answers too, not just IP+token+window - a shared
  // clinic wifi can easily put two different patients behind the same
  // hashed IP within 30 seconds, and treating that second, distinct
  // submission as a duplicate would silently drop real feedback. This is
  // specifically for the client's retry-on-failure path re-sending the exact
  // same payload (SPEC 6), which abuse control (SPEC 11) also benefits from.
  let duplicateQuery = supabase
    .from("responses")
    .select("id")
    .eq("link_id", link.id)
    .eq("source_ip_hash", sourceIpHash)
    .eq("wait_band", wait_band as Enums<"wait_band">)
    .eq("respect_score", respect_score as number)
    .eq("return_intent", return_intent as Enums<"return_intent">)
    .gte(
      "created_at",
      new Date(Date.now() - DUPLICATE_WINDOW_SECONDS * 1000).toISOString()
    )
    .limit(1);
  duplicateQuery = comment
    ? duplicateQuery.eq("comment", comment as string)
    : duplicateQuery.is("comment", null);
  const { data: recentDuplicate } = await duplicateQuery.maybeSingle();

  const notify =
    return_intent === "no" ||
    (respect_score as number) <= 2 ||
    (wait_band === "over_60" && (respect_score as number) <= 3);

  if (recentDuplicate) {
    return NextResponse.json({ ok: true, notify });
  }

  const { error } = await supabase.from("responses").insert({
    clinic_id: link.clinic_id,
    branch_id: link.branch_id,
    provider_id: (provider_id as string | null) ?? null,
    link_id: link.id,
    wait_band: wait_band as Enums<"wait_band">,
    respect_score: respect_score as number,
    return_intent: return_intent as Enums<"return_intent">,
    comment: (comment as string | null) ?? null,
    patient_name: typeof patient_name === "string" ? patient_name : null,
    patient_phone: normalizedPhone,
    consent_to_publish: consent_to_publish === true,
    source_ip_hash: sourceIpHash,
  });

  if (error) {
    return NextResponse.json({ error: "Could not save your response." }, { status: 500 });
  }

  if (notify) {
    // Never let email trouble affect the patient's response - this is fire
    // logged, not awaited-and-surfaced.
    try {
      const { data: recipients } = await supabase.rpc("alert_recipient_emails", {
        p_clinic_id: link.clinic_id,
        p_branch_id: link.branch_id,
      });
      await sendAlertEmail({
        to: recipients ?? [],
        clinicName: clinic.name,
        branchName: branch?.name ?? "",
        compositeScore: compositeScoreFor(
          respect_score as number,
          return_intent as Enums<"return_intent">,
          wait_band as Enums<"wait_band">
        ),
        waitBand: wait_band as Enums<"wait_band">,
        respectScore: respect_score as number,
        returnIntent: return_intent as Enums<"return_intent">,
        comment: (comment as string | null) ?? null,
        patientPhone: normalizedPhone,
        createdAt: new Date(),
        dashboardUrl: new URL("/app/alerts", request.url).toString(),
      });
    } catch (err) {
      console.error("[alerts] Failed to send alert email:", err);
    }
  }

  return NextResponse.json({ ok: true, notify });
}

// Mirrors the DB's compute_composite_score() exactly, just for the email body
// - the stored value on the row is still the source of truth.
function compositeScoreFor(
  respectScore: number,
  returnIntent: Enums<"return_intent">,
  waitBand: Enums<"wait_band">
): number {
  const respectSub = [0, 0, 25, 50, 75, 100][respectScore] ?? 0;
  const returnSub = { yes: 100, maybe: 50, no: 0 }[returnIntent];
  const waitSub = { under_15: 100, "15_to_30": 70, "30_to_60": 40, over_60: 0 }[waitBand];
  return Math.round(respectSub * 0.5 + returnSub * 0.35 + waitSub * 0.15);
}
