import { createClient } from "@/lib/supabase/server";
import { setClinicStatus, publishResponse, rejectApprovedResponse } from "./actions";

type ModerationRow = {
  id: string;
  created_at: string;
  comment: string | null;
  composite_score: number;
  clinics: { name: string } | null;
  branches: { name: string } | null;
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const QUEUE_SHOWN = 100;

  // Same fix as /app/alerts and /app/publish: capped and oldest-first, with
  // an exact count fetched separately, rather than one unbounded query that
  // can time out under load.
  const [{ data: clinics }, queueCountRes, { data: queue }] = await Promise.all([
    supabase
      .from("clinics")
      .select("id, name, slug, plan, status, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("responses")
      .select("id", { count: "exact", head: true })
      .eq("publish_status", "approved"),
    supabase
      .from("responses")
      .select("id, created_at, comment, composite_score, clinics(name), branches(name)")
      .eq("publish_status", "approved")
      .order("created_at", { ascending: true })
      .limit(QUEUE_SHOWN)
      .returns<ModerationRow[]>(),
  ]);

  const queueCount = queueCountRes.count ?? 0;

  return (
    <div className="flex flex-col gap-8">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <section>
        <h1 className="mb-4 text-lg font-semibold text-zinc-900">Clinics</h1>
        <div className="flex flex-col gap-2">
          {(clinics ?? []).map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {c.name}
                  <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-xs uppercase text-zinc-500">
                    {c.plan}
                  </span>
                  {c.status === "suspended" && (
                    <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-600">
                      Suspended
                    </span>
                  )}
                </p>
                <p className="text-xs text-zinc-500">/c/{c.slug}</p>
              </div>
              <form
                action={setClinicStatus.bind(
                  null,
                  c.id,
                  c.status === "active" ? "suspended" : "active"
                )}
              >
                <button
                  type="submit"
                  className="min-h-11 rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700"
                >
                  {c.status === "active" ? "Suspend" : "Reinstate"}
                </button>
              </form>
            </div>
          ))}
          {(clinics ?? []).length === 0 && (
            <p className="text-sm text-zinc-500">No clinics yet.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold text-zinc-900">Moderation queue</h2>
        <p className="mb-4 max-w-lg text-sm text-zinc-500">
          Approved by the clinic owner, awaiting the final Atofarati review before
          going public on their profile page.
        </p>
        {queueCount > QUEUE_SHOWN && (
          <p className="mb-3 text-sm text-amber-700">
            Showing the {QUEUE_SHOWN} oldest of {queueCount}.
          </p>
        )}
        <div className="flex flex-col gap-3">
          {(queue ?? []).map((r) => (
            <div key={r.id} className="rounded-lg border border-zinc-200 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-zinc-900">
                  {r.clinics?.name} &middot; {r.branches?.name} &middot; Score{" "}
                  {r.composite_score}
                </p>
                <p className="text-xs text-zinc-500">
                  {new Date(r.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <p className="mt-2 text-sm text-zinc-700">&ldquo;{r.comment}&rdquo;</p>
              <div className="mt-3 flex gap-2">
                <form action={publishResponse.bind(null, r.id)}>
                  <button
                    type="submit"
                    className="min-h-11 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
                  >
                    Publish
                  </button>
                </form>
                <form action={rejectApprovedResponse.bind(null, r.id)}>
                  <button
                    type="submit"
                    className="min-h-11 rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700"
                  >
                    Reject
                  </button>
                </form>
              </div>
            </div>
          ))}
          {queueCount === 0 && (
            <p className="text-sm text-zinc-500">Nothing waiting for review.</p>
          )}
        </div>
      </section>
    </div>
  );
}
