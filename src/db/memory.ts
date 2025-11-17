// src/db/memory.ts
import { supabase } from "./client.js";

/**
 * Insert or update a memory (persistent user fact).
 *
 * This prevents duplicates:
 * - If the exact same summary already exists, we simply update timestamps.
 * - Otherwise we insert a new memory.
 */
export async function upsertMemory(
  userId: number,
  summary: string,
  source: string = "auto_summary",
  importance: number = 3
) {
  try {
    const now = new Date().toISOString();

    // Check if the memory already exists (exact match)
    const { data: existing } = await supabase
      .from("memories")
      .select("id")
      .eq("user_id", userId)
      .eq("summary", summary)
      .limit(1);

    if (existing && existing.length > 0) {
      // Update timestamps only
      await supabase
        .from("memories")
        .update({
          updated_at: now,
          last_used: now,
        })
        .eq("id", existing[0].id);

      return;
    }

    // Insert new memory
    await supabase.from("memories").insert([
      {
        user_id: userId,
        summary,
        source,
        importance,
        created_at: now,
        updated_at: now,
        last_used: now,
      }
    ]);
  } catch (err: any) {
    console.error("❌ upsertMemory error:", err.message);
  }
}

/**
 * Fetch the most relevant memories (Top-N ordered by importance + recency).
 */
export async function fetchRelevantMemories(
  userId: number,
  limit: number = 5
) {
  try {
    const { data, error } = await supabase
      .from("memories")
      .select("summary, importance, updated_at")
      .eq("user_id", userId)
      .order("importance", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("❌ fetchRelevantMemories error:", error.message);
      return [];
    }

    return data || [];
  } catch (err: any) {
    console.error("❌ fetchRelevantMemories exception:", err.message);
    return [];
  }
}