// src/db/memory.ts

import { supabase } from "./client.js";

/* ----------------------------------------------------------
   Fetch top-K strongest memories for the user
   Ranking formula:
     score * 0.7  +  use_count * 0.2  +  recency_boost * 0.1
---------------------------------------------------------- */
export async function getTopMemories(
  userId: number,
  limit: number = 5
): Promise<{ id: number; memory: string }[]> {
  try {
    // Fetch memories + usage in a single joined query
    const { data, error } = await supabase
      .from("memories")
      .select(`
        id,
        memory,
        score,
        memory_usage (
          use_count,
          last_used
        )
      `)
      .eq("user_id", userId);

    if (error) {
      console.error("❌ getTopMemories error:", error);
      return [];
    }

    if (!data) return [];

    // Ranking algorithm — more usage = fresher = higher rank
    const ranked = data
      .map((m) => {
        const usage = m.memory_usage?.[0];

        const useCount = usage?.use_count ?? 0;

        // Recency boost: memories used in last 7 days get a bump
        let recencyBoost = 0;
        if (usage?.last_used) {
          const daysAgo =
            (Date.now() - new Date(usage.last_used).getTime()) / 86400000;
          recencyBoost = daysAgo < 7 ? 1 : 0;
        }

        const score = (m.score ?? 1) * 0.7 + useCount * 0.2 + recencyBoost * 0.1;

        return {
          id: m.id,
          memory: m.memory,
          rank: score
        };
      })
      .sort((a, b) => b.rank - a.rank)
      .slice(0, limit);

    return ranked.map((m) => ({ id: m.id, memory: m.memory }));
  } catch (err) {
    console.error("❌ getTopMemories fatal error:", err);
    return [];
  }
}

/* ----------------------------------------------------------
   Save a memory (rarely used — memoryManager handles inserts)
---------------------------------------------------------- */
export async function saveMemory(
  userId: number,
  memory: string,
  score = 1
) {
  try {
    const { data, error } = await supabase
      .from("memories")
      .insert({
        user_id: userId,
        memory,
        score
      })
      .select("id")
      .single();

    if (error) console.error("❌ saveMemory error:", error);

    return data?.id ?? null;
  } catch (err) {
    console.error("❌ saveMemory fatal error:", err);
    return null;
  }
}

/* ----------------------------------------------------------
   Manually bump memory usage (fallback)
---------------------------------------------------------- */
export async function recordMemoryUse(memoryId: number) {
  try {
    await supabase.from("memory_usage").upsert(
      {
        memory_id: memoryId,
        last_used: new Date().toISOString(),
        use_count: 1
      },
      { onConflict: "memory_id" }
    );
  } catch (err) {
    console.error("❌ recordMemoryUse error:", err);
  }
}