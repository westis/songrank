import { createClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client using the service role key.
 * This bypasses Row-Level Security -- use only in server-side
 * Route Handlers (e.g., WHR calculation).
 *
 * NEVER import this file in client-side code.
 */
export function createAdminClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
