import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
      <h1 className="mb-4 text-lg font-semibold text-zinc-900">Responses</h1>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs text-zinc-500">From</label>
          <input
            type="date"
            name="date_from"
            defaultValue={params.date_from ?? ""}
            className="min-h-11 rounded-lg border border-zinc-300 p-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">To</label>
          <input
            type="date"
            name="date_to"
            defaultValue={params.date_to ?? ""}
            className="min-h-11 rounded-lg border border-zinc-300 p-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Branch</label>
          <select
            name="branch"
            defaultValue={params.branch ?? ""}
            className="min-h-11 rounded-lg border border-zinc-300 bg-white p-2 text-sm"
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
          <label className="mb-1 block text-xs text-zinc-500">Provider</label>
          <select
            name="provider"
            defaultValue={params.provider ?? ""}
            className="min-h-11 rounded-lg border border-zinc-300 bg-white p-2 text-sm"
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
          <label className="mb-1 block text-xs text-zinc-500">Score band</label>
          <select
            name="band"
            defaultValue={params.band ?? ""}
            className="min-h-11 rounded-lg border border-zinc-300 bg-white p-2 text-sm"
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
          className="min-h-11 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Filter
        </button>
        <a href="/app/responses" className="min-h-11 content-center px-2 text-sm text-zinc-500 underline">
          Clear
        </a>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Branch</th>
              <th className="py-2 pr-3">Provider</th>
              <th className="py-2 pr-3">Wait</th>
              <th className="py-2 pr-3">Respect</th>
              <th className="py-2 pr-3">Return</th>
              <th className="py-2 pr-3">Score</th>
              <th className="py-2 pr-3">Comment</th>
              <th className="py-2">Publish</th>
            </tr>
          </thead>
          <tbody>
            {(responses ?? []).map((r) => {
              const branch = r.branches as unknown as { name: string } | null;
              const provider = r.providers as unknown as { full_name: string } | null;
              return (
                <tr key={r.id} className="border-b border-zinc-100 align-top">
                  <td className="py-2 pr-3 whitespace-nowrap text-zinc-500">
                    {new Date(r.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-2 pr-3">{branch?.name ?? "-"}</td>
                  <td className="py-2 pr-3">{provider?.full_name ?? "-"}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{WAIT_LABELS[r.wait_band]}</td>
                  <td className="py-2 pr-3">{r.respect_score}/5</td>
                  <td className="py-2 pr-3 capitalize">{r.return_intent}</td>
                  <td className="py-2 pr-3 font-medium">{r.composite_score}</td>
                  <td className="max-w-[220px] py-2 pr-3 truncate text-zinc-500">
                    {r.comment ?? ""}
                  </td>
                  <td className="py-2 capitalize text-zinc-500">{r.publish_status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(responses ?? []).length === 0 && (
          <p className="py-6 text-sm text-zinc-500">No responses match these filters.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center gap-3 text-sm">
          {page > 1 && (
            <a href={`?${pageHref(params, page - 1)}`} className="underline">
              Previous
            </a>
          )}
          <span className="text-zinc-500">
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
