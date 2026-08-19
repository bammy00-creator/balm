import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function requireOwnerProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, clinic_id, branch_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || !profile.clinic_id) {
    throw new Error("No clinic linked to this account.");
  }
  if (profile.role !== "owner" && profile.role !== "admin") {
    throw new Error("Only the clinic owner can do that.");
  }

  return { supabase, clinicId: profile.clinic_id, role: profile.role };
}
