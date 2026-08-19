import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile) {
    redirect("/app");
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-12">
      <h1 className="mb-1 text-xl font-semibold text-zinc-900">Tell us about your clinic</h1>
      <p className="mb-6 text-sm text-zinc-500">
        You can add more branches later from Team.
      </p>
      <OnboardingForm defaultEmail={user.email ?? ""} />
    </main>
  );
}
