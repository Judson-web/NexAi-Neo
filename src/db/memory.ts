// src/db/memory.ts

import { supabase } from "./client.js";

/* ----------------------------------------------------------
   Fetch top N memories for a user, ordered by score + recency
---------------------------------------------------------- */
export async function getTopMemories(
  userId: number,
  limit = 5
) {
  try {
    const { data, error } = await supabase
      .from("memories")
      .select("id, memory, score, last_used")
      .eq("user_id", userId)
      .order("score", { ascending: false })
      .order("last_used", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("❌ getTopMemories error:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("❌ getTopMemories fatal:", err);
    return [];
  }
}

/* ----------------------------------------------------------
   Update score & last_used for specific memory rows
---------------------------------------------------------- */
export async function bumpMemoryScores(ids: number[]) {
  if (!ids.length) return;

  try {
    const { error } = await supabase.rpc(
      "increment_memory_score",
      { memory_ids: ids }
    );

    if (error) console.error("❌ bumpMemoryScores RPC error:", error);
  } catch (err) {
    console.error("❌ bumpMemoryScores fatal:", err);
  }
}

/* ----------------------------------------------------------
   Insert new memory
---------------------------------------------------------- */
export async function insertMemory(
  userId: number,
  memory: string
) {
  try {
    const { error } = await supabase
      .from("memories")
      .insert({
        user_id: userId,
        memory,
        score: 1,
        last_used: new Date().toISOString()
      });

    if (error) console.error("❌ insertMemory error:", error);
  } catch (err) {
    console.error("❌ insertMemory fatal:", err);
  }
}