import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../app/actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/app");
  }

  return (
    <div className="flex min-h-screen flex-col bg-milk">
      <header className="border-b border-rule bg-sand">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <p className="font-display text-sm font-semibold text-cocoa">Atofarati admin</p>
          <form action={signOut}>
            <button type="submit" className="min-h-11 rounded-control px-3 py-2 text-sm text-muted hover:bg-rule/60">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">{children}</div>
    </div>
  );
}
