import { createClient } from "@supabase/supabase-js";

import { config } from "@/lib/config";
import type { Database } from "@/lib/db/database.types";

export function getSupabaseAdmin() {
  if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  return createClient<Database>(
    config.SUPABASE_URL,
    config.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export function requireSupabaseAdmin() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  return supabase;
}
