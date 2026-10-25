import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "./env";

let client: SupabaseClient | null = null;

/** Service-role client. Server only: it bypasses row level security. */
export function db(): SupabaseClient {
  if (!serverEnv.supabaseUrl || !serverEnv.supabaseServiceKey) {
    throw new Error("Supabase is not configured");
  }
  client ??= createClient(serverEnv.supabaseUrl, serverEnv.supabaseServiceKey, {
    auth: { persistSession: false },
  });
  return client;
}
