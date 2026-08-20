import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GenerateLinkForm } from "./generate-link-form";
import { toggleLinkActive } from "./actions";

export default async function LinksPage() {
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

  const canManage = profile.role === "owner" || profile.role === "admin";

  const [{ data: branches }, { data: links }] = await Promise.all([
    supabase.from("branches").select("id, name").order("name"),
    supabase
      .from("feedback_links")
      .select("id, token, channel, label, is_active, branch_id")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-cocoa">Feedback links</h1>

      {canManage && (
        <div className="mb-6">
          <GenerateLinkForm branches={branches ?? []} />
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {(links ?? []).map((l) => {
          const branch = (branches ?? []).find((b) => b.id === l.branch_id);
          const url = `/r/${l.token}`;
          return (
            <li key={l.id} className="rounded-control border border-rule px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-cocoa">
                    {l.label || branch?.name || "Untitled link"}
                    <span className="ml-2 rounded bg-sand px-1.5 py-0.5 text-xs uppercase text-muted">
                      {l.channel}
                    </span>
                    {!l.is_active && (
                      <span className="ml-2 rounded bg-sand px-1.5 py-0.5 text-xs text-berry">
                        Inactive
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    {branch?.name} &middot;{" "}
                    <a href={url} target="_blank" rel="noreferrer" className="underline">
                      {url}
                    </a>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {l.channel === "qr" && (
                    <>
                      <a
                        href={`/api/links/${l.id}/qr.png`}
                        className="min-h-11 content-center rounded-control border border-rule px-3 py-2 text-xs text-cocoa"
                      >
                        PNG
                      </a>
                      <a
                        href={`/api/links/${l.id}/qr.pdf`}
                        className="min-h-11 content-center rounded-control border border-rule px-3 py-2 text-xs text-cocoa"
                      >
                        PDF
                      </a>
                      <a
                        href={`/api/links/${l.id}/poster.pdf`}
                        className="min-h-11 content-center rounded-control border border-rule px-3 py-2 text-xs text-cocoa"
                      >
                        Poster
                      </a>
                    </>
                  )}
                  {canManage && (
                    <form action={toggleLinkActive.bind(null, l.id, !l.is_active)}>
                      <button
                        type="submit"
                        className="min-h-11 rounded-control border border-rule px-3 py-2 text-xs text-cocoa"
                      >
                        {l.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </li>
          );
        })}
        {(links ?? []).length === 0 && (
          <p className="text-sm text-muted">No links yet.</p>
        )}
      </ul>
    </div>
  );
}
