import "server-only";
import { Resend } from "resend";
import { whatsappClickToChatUrl } from "@/lib/whatsapp";
import type { Enums } from "@/types/database";

const WAIT_BAND_LABELS: Record<Enums<"wait_band">, string> = {
  under_15: "Less than 15 minutes",
  "15_to_30": "15 to 30 minutes",
  "30_to_60": "30 minutes to an hour",
  over_60: "More than an hour",
};

const RETURN_INTENT_LABELS: Record<Enums<"return_intent">, string> = {
  yes: "Yes",
  maybe: "Maybe",
  no: "No",
};

export type AlertEmailInput = {
  to: string[];
  clinicName: string;
  branchName: string;
  compositeScore: number;
  waitBand: Enums<"wait_band">;
  respectScore: number;
  returnIntent: Enums<"return_intent">;
  comment: string | null;
  patientPhone: string | null;
  createdAt: Date;
  dashboardUrl: string;
};

// No-ops (logs only) until RESEND_API_KEY is set, so an unconfigured or
// misbehaving email provider can never block a patient's submission from
// succeeding - see the try/catch around the call site in
// app/api/responses/route.ts.
export async function sendAlertEmail(input: AlertEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ALERT_FROM_EMAIL;

  if (!apiKey || !from || input.to.length === 0) {
    console.warn(
      "[email] Skipping alert email (RESEND_API_KEY/ALERT_FROM_EMAIL not set, or no recipients)."
    );
    return;
  }

  const resend = new Resend(apiKey);
  const time = input.createdAt.toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });

  const lines = [
    `Composite score: ${input.compositeScore}/100`,
    `Wait time: ${WAIT_BAND_LABELS[input.waitBand]}`,
    `Treated with respect: ${input.respectScore}/5`,
    `Would return: ${RETURN_INTENT_LABELS[input.returnIntent]}`,
    `Comment: ${input.comment ?? "(none)"}`,
    `Time: ${time}`,
  ];

  let whatsappLine = "";
  if (input.patientPhone) {
    const url = whatsappClickToChatUrl(
      input.patientPhone,
      `Hi, this is ${input.clinicName} following up on your recent visit feedback.`
    );
    whatsappLine = `\nCall the patient on WhatsApp: ${url}\n`;
  }

  const text = [
    `A patient feedback submission at ${input.branchName} needs a callback.`,
    "",
    ...lines,
    whatsappLine,
    `View in dashboard: ${input.dashboardUrl}`,
  ].join("\n");

  const html = `
    <p>A patient feedback submission at <strong>${escapeHtml(input.branchName)}</strong> needs a callback.</p>
    <ul>
      ${lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}
    </ul>
    ${
      input.patientPhone
        ? `<p><a href="${whatsappClickToChatUrl(
            input.patientPhone,
            `Hi, this is ${input.clinicName} following up on your recent visit feedback.`
          )}">Call the patient on WhatsApp</a></p>`
        : ""
    }
    <p><a href="${input.dashboardUrl}">View in dashboard</a></p>
  `;

  try {
    await resend.emails.send({
      from,
      to: input.to,
      subject: `Low score alert - ${input.clinicName}`,
      text,
      html,
    });
  } catch (err) {
    console.error("[email] Failed to send alert email:", err);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
