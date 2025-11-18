// src/db/client.ts

import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";

export const supabase = createClient(
  config.supabase.url,
  config.supabase.key,
  {
    auth: {
      persistSession: false
    }
  }
);