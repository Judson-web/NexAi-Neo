import { supabase } from "./client.js";

export async function upsertUser(user) {
  if (!user?.id) return;

  const payload = {
    id: user.id,
    username: user.username ?? null,
    first_name: user.first_name ?? null,
    last_name: user.last_name ?? null,
    language_code: user.language_code ?? null,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from("users").upsert(payload, {
    onConflict: "id"
  });

  if (error) console.error("❌ upsertUser:", error.message);
}