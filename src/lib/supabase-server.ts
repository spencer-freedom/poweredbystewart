import { createClient, SupabaseClient } from "@supabase/supabase-js";

/** The server's Supabase client: service key, never the anon key.
 *
 *  Four API routes used to read SUPABASE_SERVICE_KEY || NEXT_PUBLIC_SUPABASE_ANON_KEY
 *  while the environment defines SUPABASE_SERVICE_ROLE_KEY — so they fell
 *  through to the anon key, and the tables they read (leads, kpi_monthly,
 *  vendor_budgets, email_*) needed "anon can read" policies to work. The
 *  anon key is in the browser bundle; those policies made 79k Kia leads
 *  readable by anyone who lifted it. 2026-09-20.
 *
 *  Built per call, not at module scope, so a missing key fails the request
 *  that needed it rather than the build. It throws instead of falling back:
 *  a server route quietly running as anon is the bug this file replaces. */
export function serviceClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase service key is not configured (SUPABASE_SERVICE_ROLE_KEY). " +
        "Refusing to fall back to the anon key.",
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
