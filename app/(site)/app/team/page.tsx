import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddBranchForm } from "./add-branch-form";
import { AddProviderForm } from "./add-provider-form";
import { toggleProviderActive } from "./actions";

export default async function TeamPage() {
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

  const [{ data: branches }, { data: providers }] = await Promise.all([
    supabase
      .from("branches")
      .select("id, name, address, is_default")
      .order("is_default", { ascending: false })
      .order("name"),
    supabase
      .from("providers")
      .select("id, full_name, role, is_active, branch_id")
      .order("full_name"),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="mb-4 text-lg font-semibold text-zinc-900">Branches</h1>
        <ul className="mb-4 flex flex-col gap-2">
          {(branches ?? []).map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {b.name}
                  {b.is_default && (
                    <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500">
                      Default
                    </span>
                  )}
                </p>
                {b.address && <p className="text-xs text-zinc-500">{b.address}</p>}
              </div>
            </li>
          ))}
          {(branches ?? []).length === 0 && (
            <p className="text-sm text-zinc-500">No branches yet.</p>
          )}
        </ul>
        {canManage && <AddBranchForm />}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Providers</h2>
        <ul className="mb-4 flex flex-col gap-2">
          {(providers ?? []).map((p) => {
            const branch = (branches ?? []).find((b) => b.id === p.branch_id);
            return (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {p.full_name}
                    {p.role && <span className="ml-1 text-zinc-500">({p.role})</span>}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {branch?.name ?? "Unknown branch"} &middot;{" "}
                    {p.is_active ? "Active" : "Inactive"}
                  </p>
                </div>
                {canManage && (
                  <form action={toggleProviderActive.bind(null, p.id, !p.is_active)}>
                    <button
                      type="submit"
                      className="min-h-11 rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700"
                    >
                      {p.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                )}
              </li>
            );
          })}
          {(providers ?? []).length === 0 && (
            <p className="text-sm text-zinc-500">No providers yet.</p>
          )}
        </ul>
        {canManage && <AddProviderForm branches={branches ?? []} />}
      </section>
    </div>
  );
}
