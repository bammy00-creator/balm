import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { approveResponse, rejectResponse } from "./actions";

const WAIT_LABELS: Record<string, string> = {
  under_15: "Under 15 min",
  "15_to_30": "15-30 min",
  "30_to_60": "30-60 min",
  over_60: "Over 1 hour",
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
    return <p className="text-sm text-zinc-500">Only the clinic owner can approve reviews.</p>;
  }

  const selectClause =
    "id, created_at, comment, comment_flagged, composite_score, wait_band, respect_score, return_intent, publish_status, branches(name)";

  const [{ data: pending }, { data: decided }] = await Promise.all([
    supabase
      .from("responses")
      .select(selectClause)
      .eq("publish_status", "pending")
      .order("created_at", { ascending: false })
      .returns<Row[]>(),
    supabase
      .from("responses")
      .select(selectClause)
      .in("publish_status", ["approved", "rejected", "published"])
      .order("created_at", { ascending: false })
      .limit(30)
      .returns<Row[]>(),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-zinc-900">Publication queue</h1>
      <p className="mb-6 max-w-lg text-sm text-zinc-500">
        These patients agreed their comment can be published publicly. Approving
        sends it to Atofarati for a second, final review before it goes live.
      </p>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-zinc-700">
          Awaiting your decision ({(pending ?? []).length})
        </h2>
        <div className="flex flex-col gap-3">
          {(pending ?? []).map((r) => (
            <ReviewCard key={r.id} row={r} actionable />
          ))}
          {(pending ?? []).length === 0 && (
            <p className="text-sm text-zinc-500">Nothing waiting right now.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-zinc-700">Recent decisions</h2>
        <div className="flex flex-col gap-3">
          {(decided ?? []).map((r) => (
            <ReviewCard key={r.id} row={r} />
          ))}
          {(decided ?? []).length === 0 && (
            <p className="text-sm text-zinc-500">No decisions yet.</p>
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
    <div className="rounded-lg border border-zinc-200 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-900">
          {row.branches?.name ?? "Unknown branch"} &middot; Score {row.composite_score}
          <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-xs capitalize text-zinc-500">
            {row.publish_status}
          </span>
        </p>
        <p className="text-xs text-zinc-500">{time}</p>
      </div>
      <p className="mt-2 text-sm text-zinc-700">
        &ldquo;{row.comment}&rdquo;
      </p>
      <p className="mt-1 text-xs text-zinc-400">
        Wait: {WAIT_LABELS[row.wait_band]} &middot; Respect {row.respect_score}/5 &middot;
        Would return: {row.return_intent}
      </p>
      {row.comment_flagged && (
        <p className="mt-1 text-xs text-amber-700">
          Flagged for review - may contain clinical detail.
        </p>
      )}
      {actionable && (
        <div className="mt-3 flex gap-2">
          <form action={approveResponse.bind(null, row.id)}>
            <button
              type="submit"
              className="min-h-11 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            >
              Approve
            </button>
          </form>
          <form action={rejectResponse.bind(null, row.id)}>
            <button
              type="submit"
              className="min-h-11 rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700"
            >
              Reject
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
