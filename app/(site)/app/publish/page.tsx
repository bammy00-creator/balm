import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { scoreColorClass } from "@/lib/score-color";
import { approveResponse, rejectResponse } from "./actions";

const WAIT_LABELS: Record<string, string> = {
  under_15: "Under 15 min",
  "15_to_30": "15-30 min",
  "30_to_60": "30-60 min",
  over_60: "Over 1 hour",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting your decision",
  approved: "Sent for review",
  rejected: "Declined",
  published: "Published",
};

type Row = {
  id: string;
  created_at: string;
  comment: string | null;
  comment_flagged: boolean;
  composite_score: number;
  wait_band: string;
  respect_score: number;
  return_intent: string;
  publish_status: string;
  branches: { name: string } | null;
};

export default async function PublishPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
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

  if (profile.role !== "owner" && profile.role !== "admin") {
    return <p className="text-sm text-muted">Only the clinic owner can publish reviews.</p>;
  }

  const selectClause =
    "id, created_at, comment, comment_flagged, composite_score, wait_band, respect_score, return_intent, publish_status, branches(name)";
  const PENDING_SHOWN = 100;

  // Oldest-first and capped, same fix as /app/alerts: an unbounded query
  // here timed out during a 5000-response load test rather than erroring
  // cleanly, so this queue - which should stay small in practice - still
  // needs a hard limit for the pathological case.
  const [pendingCountRes, { data: pending }, { data: decided }] = await Promise.all([
    supabase
      .from("responses")
      .select("id", { count: "exact", head: true })
      .eq("publish_status", "pending"),
    supabase
      .from("responses")
      .select(selectClause)
      .eq("publish_status", "pending")
      .order("created_at", { ascending: true })
      .limit(PENDING_SHOWN)
      .returns<Row[]>(),
    supabase
      .from("responses")
      .select(selectClause)
      .in("publish_status", ["approved", "rejected", "published"])
      .order("created_at", { ascending: false })
      .limit(30)
      .returns<Row[]>(),
  ]);

  const pendingCount = pendingCountRes.count ?? 0;

  return (
    <div>
      <h1 className="mb-1 font-display text-[22px] font-semibold text-cocoa">Publish</h1>
      <p className="mb-6 max-w-lg text-sm text-muted">
        Published comments appear on your Sabi Health page. Names are never
        shown. Atofarati reviews each one before it goes live.
      </p>
      {error && <p className="mb-4 text-sm text-berry">{error}</p>}

      <section className="mb-8">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Awaiting your decision ({pendingCount})
        </h2>
        {pendingCount > PENDING_SHOWN && (
          <p className="mb-3 text-sm text-berry">
            Showing the {PENDING_SHOWN} oldest of {pendingCount}.
          </p>
        )}
        <div className="flex flex-col gap-3">
          {(pending ?? []).map((r) => (
            <ReviewCard key={r.id} row={r} actionable />
          ))}
          {pendingCount === 0 && (
            <p className="text-sm text-muted">Nothing waiting right now.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Recent decisions
        </h2>
        <div className="flex flex-col gap-3">
          {(decided ?? []).map((r) => (
            <ReviewCard key={r.id} row={r} />
          ))}
          {(decided ?? []).length === 0 && (
            <p className="text-sm text-muted">No decisions yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function ReviewCard({ row, actionable }: { row: Row; actionable?: boolean }) {
  const time = new Date(row.created_at).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="rounded-block bg-paper px-4 py-3 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-cocoa">
          {row.branches?.name ?? "Unknown branch"} &middot;{" "}
          <span className={`font-semibold ${scoreColorClass(row.composite_score)}`}>
            Score {row.composite_score}
          </span>
          <span className="ml-2 rounded-chip bg-sand px-2 py-0.5 text-xs text-muted">
            {STATUS_LABELS[row.publish_status] ?? row.publish_status}
          </span>
        </p>
        <p className="text-xs text-muted">{time}</p>
      </div>
      <p className="mt-2 text-sm text-cocoa">&ldquo;{row.comment}&rdquo;</p>
      <p className="mt-1 text-xs text-muted">
        Wait: {WAIT_LABELS[row.wait_band]} &middot; Respect {row.respect_score}/5 &middot;
        Would return: {row.return_intent}
      </p>
      {row.comment_flagged && (
        <p className="mt-1 text-xs text-berry">
          Flagged for review - may contain clinical detail.
        </p>
      )}
      {actionable && (
        <div className="mt-3 flex gap-2">
          <form action={approveResponse.bind(null, row.id)}>
            <button
              type="submit"
              className="min-h-11 rounded-control bg-marigold px-4 py-2 text-sm font-semibold text-cocoa"
            >
              Publish
            </button>
          </form>
          <form action={rejectResponse.bind(null, row.id)}>
            <button
              type="submit"
              className="min-h-11 rounded-control border border-rule px-4 py-2 text-sm text-cocoa"
            >
              Decline
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
