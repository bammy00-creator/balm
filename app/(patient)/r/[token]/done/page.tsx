import { createAdminClient } from "@/lib/supabase/admin";
import { Seal } from "../seal";

export default async function DonePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { token } = await params;
  const { notice } = await searchParams;
  const supabase = createAdminClient();

  const { data: link } = await supabase
    .from("feedback_links")
    .select("clinics(name)")
    .eq("token", token)
    .maybeSingle();

  const clinic = link?.clinics as unknown as { name: string } | null;
  const date = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-[520px] flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-display text-[30px] font-semibold text-cocoa">Thank you.</h1>
      <Seal clinicName={clinic?.name ?? ""} date={date} />
      <p className="text-base text-cocoa">
        {notice === "1"
          ? "The clinic manager has been told, and someone may call you today."
          : "Your feedback has gone to the clinic."}
      </p>
    </main>
  );
}
