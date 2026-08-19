import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeNigerianPhone } from "@/lib/phone";
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
    .select("id, clinic_id, branch_id, is_active, clinics(status)")
    .eq("token", token)
    .maybeSingle();

  const clinicStatus = (link?.clinics as unknown as { status: string } | null)?.status;

  if (!link || !link.is_active || clinicStatus !== "active") {
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

  const { data: recentDuplicate } = await supabase
    .from("responses")
    .select("id")
    .eq("link_id", link.id)
    .eq("source_ip_hash", sourceIpHash)
    .gte(
      "created_at",
      new Date(Date.now() - DUPLICATE_WINDOW_SECONDS * 1000).toISOString()
    )
    .limit(1)
    .maybeSingle();

  const notify =
    return_intent === "no" ||
    (respect_score as number) <= 2 ||
    (wait_band === "over_60" && (respect_score as number) <= 3);

  if (recentDuplicate) {
    // Ignore repeat submissions from the same hashed source within the window
    // (SPEC 11) rather than erroring - the client's retry-on-failure path may
    // land here even though the first attempt actually succeeded.
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

  return NextResponse.json({ ok: true, notify });
}
