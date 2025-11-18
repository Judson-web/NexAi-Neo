// src/db/users.ts

import { supabase } from "./client.js";

/**
 * Upsert Telegram user into the database.
 * Called every time a user sends a message or runs /start.
 */
export async function upsertUser(from: any) {
  if (!from) return;

  const user = {
    id: from.id,
    first_name: from.first_name || null,
    last_name: from.last_name || null,
    username: from.username || null,
    language_code: from.language_code || null,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from("users")
    .upsert(user, { onConflict: "id" });

  if (error) console.error("❌ upsertUser error:", error);
}

/**
 * Fetch a user by ID (optional helper)
 */
export async function getUser(userId: number) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("❌ getUser error:", error);
    return null;
  }

  return data;
}