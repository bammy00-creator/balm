import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TrendChart } from "./trend-chart";

function thirtyDaysAgoIso(): string {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
}

type DashboardSummary = {
  total_responses: number;
  avg_composite_score: number | null;
  open_alerts: number;
  daily_trend: { day: string; avg_score: number; count: number }[];
  by_branch: { branch_id: string; branch_name: string; count: number; avg_score: number }[];
  by_provider: { provider_id: string; provider_name: string; count: number; avg_score: number }[];
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
  const { data: summary } = await supabase
    .rpc("dashboard_summary", { p_since: since })
    .single<DashboardSummary>();

  if (!summary || summary.total_responses === 0) {
    return (
      <div>
        <h1 className="mb-2 text-lg font-semibold text-zinc-900">Dashboard</h1>
        <p className="mb-6 max-w-md text-sm text-zinc-500">
          No responses in the last 30 days yet. Generate a feedback link and
          print a QR code to get started.
        </p>
        <Link
          href="/app/links"
          className="min-h-11 inline-block rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white"
        >
          Generate a link
        </Link>
      </div>
    );
  }

  const canSeeProviders = profile.role === "owner" || profile.role === "admin";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="mb-4 text-lg font-semibold text-zinc-900">Dashboard</h1>
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Composite score"
            value={summary.avg_composite_score ?? "-"}
            sub="last 30 days"
          />
          <StatCard label="Responses" value={summary.total_responses} sub="last 30 days" />
          <Link href="/app/alerts">
            <StatCard label="Open alerts" value={summary.open_alerts} sub="needs a callback" alert />
          </Link>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-700">Score trend</h2>
        <TrendChart points={summary.daily_trend} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-medium text-zinc-700">By branch</h2>
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
            <h2 className="mb-3 text-sm font-medium text-zinc-700">By provider</h2>
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

function StatCard({
  label,
  value,
  sub,
  alert,
}: {
  label: string;
  value: number | string;
  sub: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        alert && Number(value) > 0 ? "border-red-200 bg-red-50" : "border-zinc-200"
      }`}
    >
      <p className="text-xs text-zinc-500">{label}</p>
      <p
        className={`text-2xl font-semibold ${
          alert && Number(value) > 0 ? "text-red-700" : "text-zinc-900"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-zinc-400">{sub}</p>
    </div>
  );
}

function BreakdownTable({ rows }: { rows: { name: string; count: number; score: number }[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-zinc-400">No data yet.</p>;
  }
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map((r) => (
          <tr key={r.name} className="border-b border-zinc-100 last:border-0">
            <td className="py-2 text-zinc-700">{r.name}</td>
            <td className="py-2 text-right text-zinc-400">{r.count}</td>
            <td className="py-2 pl-3 text-right font-medium text-zinc-900">{r.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
