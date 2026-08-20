"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database";

export async function setClinicStatus(clinicId: string, status: Enums<"clinic_status">) {
  const supabase = await createClient();
  await supabase.rpc("admin_set_clinic_status", { p_clinic_id: clinicId, p_status: status });
  revalidatePath("/admin");
}

async function moderate(responseId: string, decision: "publish" | "reject") {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_publish_response", {
    p_response_id: responseId,
    p_decision: decision,
  });

  revalidatePath("/admin");

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/admin");
}

export async function publishResponse(responseId: string) {
  await moderate(responseId, "publish");
}

export async function rejectApprovedResponse(responseId: string) {
  await moderate(responseId, "reject");
}
