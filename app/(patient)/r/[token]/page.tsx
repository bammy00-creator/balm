import { createAdminClient } from "@/lib/supabase/admin";
import { PatientForm } from "./patient-form";

export default async function FeedbackLinkPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: link } = await supabase
    .from("feedback_links")
    .select("id, clinic_id, branch_id, is_active, clinics(name, status), branches(name)")
    .eq("token", token)
    .maybeSingle();

  const clinic = link?.clinics as unknown as { name: string; status: string } | null;
  const branch = link?.branches as unknown as { name: string } | null;

  if (!link || !link.is_active || !clinic || clinic.status !== "active") {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-base font-medium text-zinc-900">This link isn&apos;t active.</p>
        <p className="text-sm text-zinc-500">
          Please ask the clinic front desk for a current feedback link or QR code.
        </p>
      </main>
    );
  }

  const { data: providers } = await supabase
    .from("providers")
    .select("id, full_name, role")
    .eq("branch_id", link.branch_id)
    .eq("is_active", true)
    .order("full_name");

  return (
    <PatientForm
      token={token}
      clinicName={clinic.name}
      branchName={branch?.name ?? ""}
      providers={providers ?? []}
    />
  );
}
