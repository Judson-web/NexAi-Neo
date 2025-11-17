import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";

// Supabase client with full backend privileges (service role)
export const supabase = createClient(
  config.supabase.url,
  config.supabase.service,
  {
    auth: {
      persistSession: false
    }
  }
);

// Optional: Public client using ANON key (if needed later)
export const supabasePublic = createClient(
  config.supabase.url,
  config.supabase.anon,
  {
    auth: {
      persistSession: false
    }
  }
);

// Quick connection sanity check
export async function testConnection() {
  try {
    const { data, error } = await supabase.from("users").select("id").limit(1);

    if (error) {
      console.error("❌ Supabase Test Error:", error.message);
    } else {
      console.log("✅ Supabase connection OK");
    }
  } catch (e) {
    console.error("❌ Supabase Test Exception:", e);
  }
}