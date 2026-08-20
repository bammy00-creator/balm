import { createAdminClient } from "@/lib/supabase/admin";

export default async function ClinicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: clinic } = await supabase
    .from("clinics")
    .select("id, name, logo_url, state, lga, status")
    .eq("slug", slug)
    .maybeSingle();

  if (!clinic || clinic.status !== "active") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="text-base font-medium text-zinc-900">Clinic not found.</p>
      </main>
    );
  }

  const { data: reviews } = await supabase
    .from("public_reviews")
    .select("id, display_name, body, score, published_at")
    .eq("clinic_id", clinic.id)
    .order("published_at", { ascending: false });

  const count = reviews?.length ?? 0;
  const avgScore = count > 0 ? Math.round(reviews!.reduce((s, r) => s + r.score, 0) / count) : null;

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <div className="mb-8 flex items-center gap-4">
        {clinic.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={clinic.logo_url}
            alt=""
            className="h-16 w-16 rounded-lg border border-zinc-200 object-cover"
          />
        ) : null}
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">{clinic.name}</h1>
          {(clinic.lga || clinic.state) && (
            <p className="text-sm text-zinc-500">
              {[clinic.lga, clinic.state].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      </div>

      {avgScore !== null ? (
        <div className="mb-8 rounded-lg border border-zinc-200 px-4 py-3">
          <p className="text-3xl font-semibold text-zinc-900">{avgScore}/100</p>
          <p className="text-sm text-zinc-500">
            Based on {count} patient {count === 1 ? "review" : "reviews"}
          </p>
        </div>
      ) : (
        <p className="mb-8 text-sm text-zinc-500">No public reviews yet.</p>
      )}

      <div className="flex flex-col gap-4">
        {(reviews ?? []).map((r) => (
          <div key={r.id} className="border-b border-zinc-100 pb-4 last:border-0">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-900">{r.display_name}</p>
              <p className="text-sm text-zinc-400">{r.score}/100</p>
            </div>
            {r.body && <p className="text-sm text-zinc-700">{r.body}</p>}
            <p className="mt-1 text-xs text-zinc-400">
              {new Date(r.published_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        ))}
      </div>

      {count > 0 && (
        <p className="mt-8 text-xs text-zinc-400">
          Reviews are submitted by patients after their visit and are moderated
          before publishing.
        </p>
      )}
    </main>
  );
}
