import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TrendChart } from "./trend-chart";
import { whatsappClickToChatUrl } from "@/lib/whatsapp";

const OPEN_ALERTS_BAND_SHOWN = 20;

function thirtyDaysAgoIso(): string {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
}
function sixtyDaysAgoIso(): string {
  return new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
}

type DashboardSummary = {
  total_responses: number;
  avg_composite_score: number | null;
  open_alerts: number;
  daily_trend: { day: string; avg_score: number; count: number }[];
  by_branch: { branch_id: string; branch_name: string; count: number; avg_score: number }[];
  by_provider: { provider_id: string; provider_name: string; count: number; avg_score: number }[];
};

type AlertBandRow = {
  id: string;
  created_at: string;
  branches: { name: string } | null;
  responses: {
    composite_score: number;
    comment: string | null;
    patient_name: string | null;
    patient_phone: string | null;
  } | null;
};

export default async function AppHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, clinic_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile?.clinic_id) redirect("/onboarding");

  const since = thirtyDaysAgoIso();
  const [{ data: summary }, { data: previousAvg }, { data: openAlerts }] = await Promise.all([
    supabase.rpc("dashboard_summary", { p_since: since }).single<DashboardSummary>(),
    supabase.rpc("period_avg_score", { p_since: sixtyDaysAgoIso(), p_until: since }),
    supabase
      .from("alerts")
      .select("id, created_at, branches(name), responses(composite_score, comment, patient_name, patient_phone)")
      .eq("status", "open")
      .order("created_at", { ascending: true })
      .limit(OPEN_ALERTS_BAND_SHOWN)
      .returns<AlertBandRow[]>(),
  ]);

  if (!summary || summary.total_responses === 0) {
    return (
      <div>
        <h1 className="mb-2 font-display text-[22px] font-semibold text-cocoa">Overview</h1>
        <p className="mb-6 max-w-md text-sm text-muted">
          No responses yet. Print your QR code and put it at the front desk.
        </p>
        <Link
          href="/app/links"
          className="min-h-16 inline-flex items-center rounded-control bg-marigold px-4 py-3 text-sm font-semibold text-cocoa"
        >
          Get my QR code
        </Link>
      </div>
    );
  }

  const canSeeProviders = profile.role === "owner" || profile.role === "admin";
  const change =
    typeof previousAvg === "number" && summary.avg_composite_score !== null
      ? summary.avg_composite_score - previousAvg
      : null;

  return (
    <div className="flex flex-col gap-8">
      {(openAlerts ?? []).length > 0 && <AlertBand rows={openAlerts!} totalOpen={summary.open_alerts} />}

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Last 30 days
        </p>
        <div className="mt-1 flex flex-wrap items-end gap-6">
          <p className="font-display text-[56px] font-bold leading-none text-leaf">
            {summary.avg_composite_score ?? "-"}
          </p>
          <div className="pb-1">
            {change !== null && (
              <p className="text-sm text-cocoa">
                {change === 0
                  ? "Even with the month before"
                  : `${change > 0 ? "Up" : "Down"} ${Math.abs(change)} point${
                      Math.abs(change) === 1 ? "" : "s"
                    } on the month before`}
              </p>
            )}
            <p className="text-sm text-muted">{summary.total_responses} responses</p>
          </div>
        </div>
      </div>

      <div>
        <TrendChart points={summary.daily_trend} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            By branch
          </p>
          <BreakdownTable
            rows={summary.by_branch.map((b) => ({
              name: b.branch_name,
              count: b.count,
              score: b.avg_score,
            }))}
          />
        </div>
        {canSeeProviders && (
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              By staff member
            </p>
            <BreakdownTable
              rows={summary.by_provider.map((p) => ({
                name: p.provider_name,
                count: p.count,
                score: p.avg_score,
              }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function AlertBand({ rows, totalOpen }: { rows: AlertBandRow[]; totalOpen: number }) {
  return (
    <div className="rounded-block border-l-[3px] border-berry bg-sand px-4 py-4 shadow-soft">
      <Link href="/app/alerts" className="font-display text-lg font-semibold text-cocoa">
        {totalOpen} patient{totalOpen === 1 ? "" : "s"} need{totalOpen === 1 ? "s" : ""} a call back
      </Link>
      <ul className="mt-3 flex flex-col gap-3">
        {rows.map((a) => {
          const r = a.responses;
          const time = new Date(a.created_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
          });
          return (
            <li key={a.id} className="text-sm text-cocoa">
              <span className="font-semibold">{r?.composite_score ?? "-"}</span>
              {" · "}
              {time}
              {" · "}
              {a.branches?.name}
              {r?.comment && <span className="text-muted"> &middot; {r.comment}</span>}
              {r?.patient_phone && (
                <>
                  {" · "}
                  <a
                    href={whatsappClickToChatUrl(
                      r.patient_phone,
                      "Hi, this is the clinic following up on your recent visit feedback."
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="text-leaf underline"
                  >
                    Call on WhatsApp
                  </a>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function BreakdownTable({ rows }: { rows: { name: string; count: number; score: number }[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">No data yet.</p>;
  }
  return (
    <table className="w-full overflow-hidden rounded-block bg-milk text-sm">
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.name} className={i % 2 === 1 ? "bg-sand" : undefined}>
            <td className="py-2 pl-3 text-cocoa">{r.name}</td>
            <td className="py-2 text-right tabular-nums text-muted">{r.count}</td>
            <td className="py-2 pr-3 text-right font-semibold tabular-nums text-cocoa">
              {r.score}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
