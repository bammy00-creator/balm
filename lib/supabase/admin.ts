import "server-only"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Service-role client. Bypasses RLS entirely - only for trusted server code:
// the patient form route handlers, the public clinic profile page, and
// moderation actions. The `server-only` import makes any accidental client
// import fail the build instead of shipping the key to the browser.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
