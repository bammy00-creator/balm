"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerProfile } from "@/lib/auth/current-profile";

export type FormState = { error?: string };

export async function addBranch(_prevState: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (!name) {
    return { error: "Branch name is required." };
  }

  try {
    const { supabase, clinicId } = await requireOwnerProfile();
    const { error } = await supabase
      .from("branches")
      .insert({ clinic_id: clinicId, name, address: address || null });
    if (error) return { error: error.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }

  revalidatePath("/app/team");
  return {};
}

export async function addProvider(_prevState: FormState, formData: FormData): Promise<FormState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const branchId = String(formData.get("branch_id") ?? "");

  if (!fullName || !branchId) {
    return { error: "Name and branch are required." };
  }

  try {
    const { supabase, clinicId } = await requireOwnerProfile();
    const { error } = await supabase
      .from("providers")
      .insert({ clinic_id: clinicId, branch_id: branchId, full_name: fullName, role: role || null });
    if (error) return { error: error.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }

  revalidatePath("/app/team");
  return {};
}

export async function toggleProviderActive(providerId: string, nextActive: boolean) {
  const { supabase } = await requireOwnerProfile();
  await supabase.from("providers").update({ is_active: nextActive }).eq("id", providerId);
  revalidatePath("/app/team");
}
