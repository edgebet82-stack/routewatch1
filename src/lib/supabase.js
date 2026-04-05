import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  || "";
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// If no env vars are set, the app runs in demo mode using local mock data
export const isConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;
