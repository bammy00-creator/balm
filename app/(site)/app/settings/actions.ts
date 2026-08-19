"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerProfile } from "@/lib/auth/current-profile";

export type FormState = { error?: string; success?: boolean };

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

export async function updateClinicDetails(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const lga = String(formData.get("lga") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (!name) {
    return { error: "Clinic name is required." };
  }

  try {
    const { supabase, clinicId } = await requireOwnerProfile();
    const { error } = await supabase
      .from("clinics")
      .update({
        name,
        phone: phone || null,
        email: email || null,
        state: state || null,
        lga: lga || null,
        address: address || null,
      })
      .eq("id", clinicId);
    if (error) return { error: error.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }

  revalidatePath("/app/settings");
  revalidatePath("/app");
  return { success: true };
}

export async function updateClinicLogo(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const file = formData.get("logo");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image file." };
  }
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    return { error: "Logo must be a PNG, JPEG, or WebP image." };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { error: "Logo must be under 2MB." };
  }

  try {
    const { supabase, clinicId } = await requireOwnerProfile();
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${clinicId}/logo.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("clinic-logos")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) return { error: uploadError.message };

    const {
      data: { publicUrl },
    } = supabase.storage.from("clinic-logos").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("clinics")
      .update({ logo_url: `${publicUrl}?v=${Date.now()}` })
      .eq("id", clinicId);
    if (updateError) return { error: updateError.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }

  revalidatePath("/app/settings");
  revalidatePath("/app");
  return { success: true };
}
