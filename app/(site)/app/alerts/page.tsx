import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { whatsappClickToChatUrl } from "@/lib/whatsapp";

const WAIT_LABELS: Record<string, string> = {
  under_15: "Under 15 min",
  "15_to_30": "15-30 min",
  "30_to_60": "30-60 min",
  over_60: "Over 1 hour",
};

type AlertRow = {
  id: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  note: string | null;
  branches: { name: string } | null;
  responses: {
    wait_band: string;
    respect_score: number;
    return_intent: string;
    comment: string | null;
    composite_score: number;
    patient_name: string | null;
    patient_phone: string | null;
  } | null;
};

export default async function AlertsPage({
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
    .select("clinic_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile?.clinic_id) redirect("/onboarding");

  const selectClause =
    "id, status, created_at, resolved_at, note, branches(name), responses(wait_band, respect_score, return_intent, comment, composite_score, patient_name, patient_phone)";

  const [{ data: open }, { data: resolved }] = await Promise.all([
    supabase
      .from("alerts")
      .select(selectClause)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .returns<AlertRow[]>(),
    supabase
      .from("alerts")
      .select(selectClause)
      .neq("status", "open")
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<AlertRow[]>(),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-zinc-900">Alerts</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-zinc-700">
          Open ({(open ?? []).length})
        </h2>
        <div className="flex flex-col gap-3">
          {(open ?? []).map((a) => (
            <AlertCard key={a.id} alert={a} />
          ))}
          {(open ?? []).length === 0 && (
            <p className="text-sm text-zinc-500">No open alerts.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-zinc-700">Resolved</h2>
        <div className="flex flex-col gap-3">
          {(resolved ?? []).map((a) => (
            <AlertCard key={a.id} alert={a} />
          ))}
          {(resolved ?? []).length === 0 && (
            <p className="text-sm text-zinc-500">No resolved alerts yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function AlertCard({ alert }: { alert: AlertRow }) {
  const r = alert.responses;
  const time = new Date(alert.created_at).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        alert.status === "open" ? "border-red-200 bg-red-50" : "border-zinc-200"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-900">
          {alert.branches?.name ?? "Unknown branch"} &middot; Score {r?.composite_score ?? "-"}
        </p>
        <p className="text-xs text-zinc-500">{time}</p>
      </div>
      {r && (
        <ul className="mt-2 text-sm text-zinc-700">
          <li>Wait: {WAIT_LABELS[r.wait_band]}</li>
          <li>Respect: {r.respect_score}/5</li>
          <li>Would return: <span className="capitalize">{r.return_intent}</span></li>
          {r.comment && <li>Comment: {r.comment}</li>}
        </ul>
      )}
      {r?.patient_phone && (
        <a
          href={whatsappClickToChatUrl(
            r.patient_phone,
            "Hi, this is the clinic following up on your recent visit feedback."
          )}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-sm text-green-700 underline"
        >
          Message {r.patient_name || "patient"} on WhatsApp
        </a>
      )}

      {alert.status === "open" ? (
        <form action={`/api/alerts/${alert.id}/resolve`} method="post" className="mt-3">
          <textarea
            name="note"
            required
            minLength={10}
            rows={2}
            placeholder="What did you do about this? (at least 10 characters)"
            className="w-full rounded-lg border border-zinc-300 p-2 text-sm"
          />
          <button
            type="submit"
            className="mt-2 min-h-11 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Mark resolved
          </button>
        </form>
      ) : (
        alert.note && (
          <p className="mt-3 rounded-lg bg-zinc-100 p-2 text-sm text-zinc-600">
            <span className="font-medium">Note:</span> {alert.note}
          </p>
        )
      )}
    </div>
  );
}
