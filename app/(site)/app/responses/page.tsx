import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { scoreColorClass } from "@/lib/score-color";

const PAGE_SIZE = 50;

const SCORE_BANDS = {
  low: { label: "Low (0-40)", min: 0, max: 40 },
  medium: { label: "Medium (41-70)", min: 41, max: 70 },
  high: { label: "High (71-100)", min: 71, max: 100 },
} as const;

const WAIT_LABELS: Record<string, string> = {
  under_15: "Under 15 min",
  "15_to_30": "15-30 min",
  "30_to_60": "30-60 min",
  over_60: "Over 1 hour",
};

const ROW_GRID = "grid grid-cols-[100px_1fr_1fr_60px_110px_80px_1fr] gap-3";

function pageHref(params: Record<string, string | undefined>, page: number): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") usp.set(key, value);
  }
  usp.set("page", String(page));
  return usp.toString();
}

export default async function ResponsesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("clinic_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile?.clinic_id) redirect("/onboarding");

  const page = Math.max(1, Number(params.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("responses")
    .select(
      "id, created_at, wait_band, respect_score, return_intent, composite_score, comment, publish_status, branches(name), providers(full_name)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.date_from) query = query.gte("created_at", params.date_from);
  if (params.date_to) query = query.lte("created_at", `${params.date_to}T23:59:59`);
  if (params.branch) query = query.eq("branch_id", params.branch);
  if (params.provider) query = query.eq("provider_id", params.provider);
  if (params.band && params.band in SCORE_BANDS) {
    const band = SCORE_BANDS[params.band as keyof typeof SCORE_BANDS];
    query = query.gte("composite_score", band.min).lte("composite_score", band.max);
  }

  const [{ data: responses, count }, { data: branches }, { data: providers }] = await Promise.all([
    query,
    supabase.from("branches").select("id, name").order("name"),
    supabase.from("providers").select("id, full_name").order("full_name"),
  ]);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div>
      <h1 className="mb-4 font-display text-[22px] font-semibold text-cocoa">Responses</h1>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs text-muted">From</label>
          <input
            type="date"
            name="date_from"
            defaultValue={params.date_from ?? ""}
            className="min-h-11 rounded-control border border-rule bg-paper p-2 text-sm text-cocoa"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">To</label>
          <input
            type="date"
            name="date_to"
            defaultValue={params.date_to ?? ""}
            className="min-h-11 rounded-control border border-rule bg-paper p-2 text-sm text-cocoa"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Branch</label>
          <select
            name="branch"
            defaultValue={params.branch ?? ""}
            className="min-h-11 rounded-control border border-rule bg-paper p-2 text-sm text-cocoa"
          >
            <option value="">All</option>
            {(branches ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Staff member</label>
          <select
            name="provider"
            defaultValue={params.provider ?? ""}
            className="min-h-11 rounded-control border border-rule bg-paper p-2 text-sm text-cocoa"
          >
            <option value="">All</option>
            {(providers ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Score band</label>
          <select
            name="band"
            defaultValue={params.band ?? ""}
            className="min-h-11 rounded-control border border-rule bg-paper p-2 text-sm text-cocoa"
          >
            <option value="">All</option>
            {Object.entries(SCORE_BANDS).map(([key, b]) => (
              <option key={key} value={key}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="min-h-11 rounded-control bg-marigold px-4 py-2 text-sm font-semibold text-cocoa"
        >
          Filter
        </button>
        <a href="/app/responses" className="min-h-11 content-center px-2 text-sm text-muted underline">
          Clear
        </a>
      </form>

      {(responses ?? []).length === 0 ? (
        <p className="py-6 text-sm text-muted">No responses match these filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-block bg-milk">
          <div className={`${ROW_GRID} min-w-[760px] border-b border-rule px-3 py-2 text-xs text-muted`}>
            <span>Date</span>
            <span>Branch</span>
            <span>Staff member</span>
            <span>Score</span>
            <span>Wait</span>
            <span>Return</span>
            <span>Comment</span>
          </div>
          {(responses ?? []).map((r, i) => {
            const branch = r.branches as unknown as { name: string } | null;
            const provider = r.providers as unknown as { full_name: string } | null;
            return (
              <details key={r.id} className={`min-w-[760px] border-b border-rule last:border-0 ${i % 2 === 1 ? "bg-sand" : ""}`}>
                <summary
                  className={`${ROW_GRID} cursor-pointer list-none items-center px-3 py-2 text-sm text-cocoa marker:content-none`}
                >
                  <span className="whitespace-nowrap text-muted">
                    {new Date(r.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="truncate">{branch?.name ?? "-"}</span>
                  <span className="truncate">{provider?.full_name ?? "-"}</span>
                  <span className={`tabular-nums font-semibold ${scoreColorClass(r.composite_score)}`}>
                    {r.composite_score}
                  </span>
                  <span className="whitespace-nowrap">{WAIT_LABELS[r.wait_band]}</span>
                  <span className="capitalize">{r.return_intent}</span>
                  <span className="truncate text-muted">{r.comment ?? ""}</span>
                </summary>
                <div className="px-3 pb-3 pl-[100px] text-sm text-cocoa">
                  {r.comment ? <p className="mb-1">&ldquo;{r.comment}&rdquo;</p> : <p className="mb-1 text-muted">No comment.</p>}
                  <p className="text-xs text-muted">
                    Respect {r.respect_score}/5 &middot; Publish status:{" "}
                    <span className="capitalize">{r.publish_status}</span>
                  </p>
                </div>
              </details>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center gap-3 text-sm">
          {page > 1 && (
            <a href={`?${pageHref(params, page - 1)}`} className="underline">
              Previous
            </a>
          )}
          <span className="text-muted">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <a href={`?${pageHref(params, page + 1)}`} className="underline">
              Next
            </a>
          )}
        </div>
      )}
    </div>
  );
}
