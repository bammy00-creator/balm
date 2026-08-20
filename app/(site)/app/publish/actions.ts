"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function decide(responseId: string, decision: "approve" | "reject") {
  const supabase = await createClient();
  const { error } = await supabase.rpc("clinic_set_publish_status", {
    p_response_id: responseId,
    p_decision: decision,
  });

  revalidatePath("/app/publish");

  if (error) {
    redirect(`/app/publish?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/app/publish");
}

export async function approveResponse(responseId: string) {
  await decide(responseId, "approve");
}

export async function rejectResponse(responseId: string) {
  await decide(responseId, "reject");
}
