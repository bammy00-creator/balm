"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

export type FormState = { error?: string };

export async function createClinic(_prevState: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const lga = String(formData.get("lga") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (!name) {
    return { error: "Clinic name is required." };
  }

  const slug = slugify(name);
  if (!slug) {
    return { error: "That name doesn't produce a usable URL - try adding more letters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_clinic_with_owner", {
    p_name: name,
    p_slug: slug,
    p_phone: phone || null,
    p_email: email || null,
    p_state: state || null,
    p_lga: lga || null,
    p_address: address || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "That clinic name is already taken - try a slightly different name." };
    }
    return { error: error.message };
  }

  redirect("/app");
}
