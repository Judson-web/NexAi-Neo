// src/db/users.ts

import { supabase } from "./client.js";

/* ----------------------------------------------------------
   Insert or update a Telegram user
---------------------------------------------------------- */
export async function upsertUser(user: any) {
  if (!user || !user.id) return;

  const data = {
    user_id: user.id,
    username: user.username || null,
    first_name: user.first_name || null,
    last_name: user.last_name || null,
    last_seen: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("users")
    .upsert(data, { onConflict: "user_id" });

  if (error) {
    console.error("❌ Supabase upsertUser Error:", error);
  }
}

/* ----------------------------------------------------------
   Get single user (optional for extensions)
---------------------------------------------------------- */
export async function getUser(userId: number) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("❌ getUser Error:", error);
    return null;
  }

  return data;
}