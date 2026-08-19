import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClinicDetailsForm } from "./clinic-details-form";
import { LogoForm } from "./logo-form";

export default async function SettingsPage() {
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

  if (profile.role !== "owner" && profile.role !== "admin") {
    return (
      <p className="text-sm text-zinc-500">
        Only the clinic owner can change settings.
      </p>
    );
  }

  const { data: clinic } = await supabase
    .from("clinics")
    .select("name, phone, email, state, lga, address, logo_url")
    .eq("id", profile.clinic_id)
    .single();

  if (!clinic) {
    return <p className="text-sm text-zinc-500">Clinic not found.</p>;
  }

  return (
    <div className="flex max-w-md flex-col gap-8">
      <section>
        <h1 className="mb-4 text-lg font-semibold text-zinc-900">Clinic details</h1>
        <ClinicDetailsForm clinic={clinic} />
      </section>
      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Logo</h2>
        <LogoForm logoUrl={clinic.logo_url} />
      </section>
    </div>
  );
}
