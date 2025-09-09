// lib/supabase.js
import { createClient } from "@supabase/supabase-js";

// Use Service Role key ONLY in server-side APIs (never expose to frontend)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
