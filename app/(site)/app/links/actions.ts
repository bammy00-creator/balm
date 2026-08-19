"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerProfile } from "@/lib/auth/current-profile";
import type { Enums } from "@/types/database";

export type FormState = { error?: string };

export async function generateLink(_prevState: FormState, formData: FormData): Promise<FormState> {
  const branchId = String(formData.get("branch_id") ?? "");
  const channel = String(formData.get("channel") ?? "qr") as Enums<"link_channel">;
  const label = String(formData.get("label") ?? "").trim();

  if (!branchId) {
    return { error: "Choose a branch." };
  }

  try {
    const { supabase, clinicId } = await requireOwnerProfile();
    const { error } = await supabase
      .from("feedback_links")
      .insert({ clinic_id: clinicId, branch_id: branchId, channel, label: label || null });
    if (error) return { error: error.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }

  revalidatePath("/app/links");
  return {};
}

export async function toggleLinkActive(linkId: string, nextActive: boolean) {
  const { supabase } = await requireOwnerProfile();
  await supabase.from("feedback_links").update({ is_active: nextActive }).eq("id", linkId);
  revalidatePath("/app/links");
}
