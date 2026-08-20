import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "./nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, clinics(name, status)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/onboarding");
  }

  if (profile.role === "admin") {
    redirect("/admin");
  }

  const clinic = profile.clinics as unknown as { name: string; status: string } | null;

  if (clinic && clinic.status !== "active") {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="font-display text-base font-semibold text-cocoa">This account is suspended.</p>
        <p className="text-sm text-muted">Contact Atofarati support to reinstate it.</p>
      </main>
    );
  }

  return (
    <AppShell clinicName={clinic?.name ?? ""} role={profile.role}>
      <div className="mx-auto w-full max-w-4xl">{children}</div>
    </AppShell>
  );
}
