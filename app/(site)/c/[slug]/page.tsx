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
        <p className="font-display text-base font-semibold text-cocoa">Clinic not found.</p>
      </main>
    );
  }

  const [{ data: reviews }, { data: branches }] = await Promise.all([
    supabase
      .from("public_reviews")
      .select("id, display_name, body, score, published_at")
      .eq("clinic_id", clinic.id)
      .order("published_at", { ascending: false }),
    supabase.from("branches").select("id, name").eq("clinic_id", clinic.id).order("name"),
  ]);

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
            className="h-16 w-16 rounded-control border border-rule object-cover"
          />
        ) : null}
        <div>
          <h1 className="font-display text-xl font-semibold text-cocoa">{clinic.name}</h1>
          {(clinic.lga || clinic.state) && (
            <p className="text-sm text-muted">
              {[clinic.lga, clinic.state].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      </div>

      {avgScore !== null ? (
        <div className="mb-6">
          <p className="font-display text-[56px] font-bold leading-none text-leaf">{avgScore}</p>
          <p className="text-sm text-muted">
            Based on {count} patient {count === 1 ? "review" : "reviews"}
          </p>
        </div>
      ) : (
        <p className="mb-6 text-sm text-muted">No public reviews yet.</p>
      )}

      {(branches ?? []).length > 0 && (
        <p className="mb-8 text-sm text-muted">
          {(branches ?? []).map((b) => b.name).join(" · ")}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {(reviews ?? []).map((r) => (
          <div key={r.id} className="rounded-block bg-sand px-4 py-3">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-sm font-semibold text-cocoa">{r.display_name}</p>
              <p className="text-sm font-semibold text-leaf">{r.score}</p>
            </div>
            {r.body && <p className="text-sm text-cocoa">{r.body}</p>}
            <p className="mt-1 text-xs text-muted">
              {new Date(r.published_at).toLocaleDateString("en-GB", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-muted">
        Every review here comes from a patient who visited this clinic and
        agreed to publish it.
      </p>
    </main>
  );
}
