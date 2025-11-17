import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";

export const supabase = createClient(
  config.supabase.url,
  config.supabase.service,
  { auth: { persistSession: false } }
);

export const supabasePublic = createClient(
  config.supabase.url,
  config.supabase.anon,
  { auth: { persistSession: false } }
);