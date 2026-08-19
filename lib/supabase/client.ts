import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

// Browser client for the authenticated /app dashboard. Uses the publishable
// key only, so it is safe to import from client components.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
