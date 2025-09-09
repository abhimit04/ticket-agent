// lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// Safe for browser use (Anon key)
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

