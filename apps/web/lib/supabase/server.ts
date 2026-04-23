import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "../env.js";

let cached: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient | null {
  const env = getServerEnv();
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  if (cached) return cached;
  cached = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    db: { schema: "insiders_lab_platform" },
  });
  return cached;
}
