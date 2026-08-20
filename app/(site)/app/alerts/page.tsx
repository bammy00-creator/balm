import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { whatsappClickToChatUrl } from "@/lib/whatsapp";
import { scoreColorClass } from "@/lib/score-color";
import { ResolveForm } from "./resolve-form";

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

const OPEN_ALERTS_SHOWN = 100;

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: actionError } = await searchParams;
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

  // Oldest-first and capped: an open queue is meant to be worked down same
  // day (SPEC section 9), so if it's ever this large something's wrong
  // operationally - but the page still has to render safely rather than
  // hang. Found by load-testing at 5000 responses: an unbounded query here
  // took 45s and the connection reset, which the page then silently showed
  // as "0 open alerts" instead of surfacing the failure.
  const [openCountRes, { data: open, error: openError }, { data: resolved, error: resolvedError }] =
    await Promise.all([
      supabase.from("alerts").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabase
        .from("alerts")
        .select(selectClause)
        .eq("status", "open")
        .order("created_at", { ascending: true })
        .limit(OPEN_ALERTS_SHOWN)
        .returns<AlertRow[]>(),
      supabase
        .from("alerts")
        .select(selectClause)
        .neq("status", "open")
        .order("created_at", { ascending: false })
        .limit(50)
        .returns<AlertRow[]>(),
    ]);

  const openCount = openCountRes.count ?? 0;
  const loadError = openError ?? resolvedError;

  return (
    <div>
      <h1 className="mb-4 font-display text-[22px] font-semibold text-cocoa">Alerts</h1>
      {actionError && <p className="mb-4 text-sm text-berry">{actionError}</p>}
      {loadError && (
        <p className="mb-4 text-sm text-berry">
          Couldn&apos;t load alerts right now - please refresh the page.
        </p>
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Open ({openCount})
        </h2>
        {openCount > OPEN_ALERTS_SHOWN && (
          <p className="mb-3 text-sm text-berry">
            Showing the {OPEN_ALERTS_SHOWN} oldest of {openCount} - resolve
            some to see the rest.
          </p>
        )}
        <div className="flex flex-col gap-3">
          {(open ?? []).map((a) => (
            <AlertCard key={a.id} alert={a} />
          ))}
          {openCount === 0 && !loadError && (
            <p className="text-sm text-muted">No patients are waiting on a call back.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Resolved
        </h2>
        <div className="flex flex-col gap-3">
          {(resolved ?? []).map((a) => (
            <AlertCard key={a.id} alert={a} />
          ))}
          {(resolved ?? []).length === 0 && (
            <p className="text-sm text-muted">No resolved alerts yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function AlertCard({ alert }: { alert: AlertRow }) {
  const r = alert.responses;
  const open = alert.status === "open";
  const time = new Date(alert.created_at).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={
        open
          ? "rounded-block border-l-[3px] border-berry bg-sand px-4 py-3 shadow-soft"
          : "rounded-block bg-milk px-4 py-3 opacity-80"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-cocoa">
          {alert.branches?.name ?? "Unknown branch"} &middot;{" "}
          <span className={`font-semibold ${scoreColorClass(r?.composite_score ?? 0)}`}>
            Score {r?.composite_score ?? "-"}
          </span>
        </p>
        <p className="text-xs text-muted">{time}</p>
      </div>
      {r && (
        <ul className="mt-2 text-sm text-cocoa">
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
          className="mt-2 inline-block text-sm text-leaf underline"
        >
          Call on WhatsApp
        </a>
      )}

      {open ? (
        <ResolveForm alertId={alert.id} />
      ) : (
        alert.note && (
          <p className="mt-3 rounded-control bg-sand p-2 text-sm text-cocoa">
            <span className="font-medium">Note:</span> {alert.note}
          </p>
        )
      )}
    </div>
  );
}
