// src/db/memory.ts

import { supabase } from "./client.js";

/* ----------------------------------------------------------
   Insert or update a memory w/ score boost
---------------------------------------------------------- */
export async function addMemory(
  userId: number,
  text: string,
  score: number
) {
  const { error } = await supabase.from("memory").insert({
    user_id: userId,
    memory: text,
    score,
    last_used: new Date().toISOString()
  });

  if (error) {
    console.error("❌ addMemory Error:", error);
  }
}

/* ----------------------------------------------------------
   Get top N highest-scoring memories for a user
---------------------------------------------------------- */
export async function getTopMemories(
  userId: number,
  limit: number
) {
  const { data, error } = await supabase
    .from("memory")
    .select("id, memory, score, last_used")
    .eq("user_id", userId)
    .order("score", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("❌ getTopMemories Error:", error);
    return [];
  }

  return data || [];
}

/* ----------------------------------------------------------
   Mark memories as recently used (freshening)
---------------------------------------------------------- */
export async function touchMemories(ids: number[]) {
  if (!ids || ids.length === 0) return;

  const { error } = await supabase
    .from("memory")
    .update({
      last_used: new Date().toISOString()
    })
    .in("id", ids);

  if (error) {
    console.error("❌ touchMemories Error:", error);
  }
}

/* ----------------------------------------------------------
   Boost memory score when AI judges memory as important
---------------------------------------------------------- */
export async function boostMemoryScore(id: number, amount = 1) {
  const { error } = await supabase.rpc("boost_memory_score", {
    memory_id: id,
    inc: amount
  });

  if (error) {
    console.error("❌ boostMemoryScore Error:", error);
  }
}

/* ----------------------------------------------------------
   Fetch ALL memories (useful for debugging/admin)
---------------------------------------------------------- */
export async function getAllMemories(userId: number) {
  const { data, error } = await supabase
    .from("memory")
    .select("*")
    .eq("user_id", userId)
    .order("score", { ascending: false });

  if (error) {
    console.error("❌ getAllMemories Error:", error);
    return [];
  }

  return data || [];
}