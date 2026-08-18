import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Admin client using the service role key.
 * Bypasses RLS — use ONLY in API routes and server actions
 * where you've already verified the user's identity and org membership.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
