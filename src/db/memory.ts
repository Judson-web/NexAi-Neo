import { supabase } from "./client.js";

export async function upsertMemory(userId, summary, source = "auto_summary", importance = 3) {
  const now = new Date().toISOString();
  // Very simple upsert: if an exact summary exists, update; else insert.
  const { data: existing } = await supabase
    .from("memories")
    .select("id")
    .eq("user_id", userId)
    .eq("summary", summary)
    .limit(1);

  if (existing && existing.length) {
    await supabase.from("memories")
      .update({ updated_at: now, last_used: now })
      .eq("id", existing[0].id);
    return;
  }

  const { error } = await supabase.from("memories").insert([{
    user_id: userId,
    summary,
    source,
    importance,
    created_at: now,
    updated_at: now,
    last_used: now
  }]);
  if (error) console.error("upsertMemory error:", error.message);
}

export async function fetchRelevantMemories(userId, limit = 5) {
  const { data, error } = await supabase
    .from("memories")
    .select("summary,importance,updated_at")
    .eq("user_id", userId)
    .order("importance", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("fetchRelevantMemories error:", error.message);
    return [];
  }
  return data || [];
}