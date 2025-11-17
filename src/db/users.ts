import { supabase } from "./client.js";

export interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
}

/**
 * Insert or update a Telegram user in Supabase.
 */
export async function upsertUser(user: TelegramUser) {
  if (!user || !user.id) return;

  const payload = {
    id: user.id,
    username: user.username || null,
    first_name: user.first_name || null,
    last_name: user.last_name || null,
    language_code: user.language_code || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("users")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    console.error("❌ upsertUser Error:", error.message);
  }
}

/**
 * Optional helper to fetch a user by ID.
 */
export async function getUser(id: number) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("❌ getUser Error:", error.message);
    return null;
  }

  return data;
}