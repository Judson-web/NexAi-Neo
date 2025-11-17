// src/ai/history.ts

import { supabase } from "../db/client.js";

/* ----------------------------------------------------------
   Save a new conversation turn
---------------------------------------------------------- */
export async function saveHistory(
  userId: number,
  userMessage: string,
  aiReply: string
) {
  try {
    const { error } = await supabase.from("chat_history").insert({
      user_id: userId,
      user_message: userMessage,
      ai_reply: aiReply
    });

    if (error) {
      console.error("❌ saveHistory error:", error);
    }
  } catch (err) {
    console.error("❌ saveHistory fatal error:", err);
  }
}

/* ----------------------------------------------------------
   Load the last N messages as a readable history block
---------------------------------------------------------- */
export async function loadHistory(
  userId: number,
  limit: number = 20
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("chat_history")
      .select("user_message, ai_reply")
      .eq("user_id", userId)
      .order("id", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("❌ loadHistory error:", error);
      return "";
    }

    if (!data || data.length === 0) return "";

    // Reverse to chronological order
    const sorted = data.reverse();

    // Build clean alternating history
    const parts = sorted.map(
      (row) => `User: ${row.user_message}\nAI: ${row.ai_reply}`
    );

    return parts.join("\n\n");
  } catch (err) {
    console.error("❌ loadHistory fatal error:", err);
    return "";
  }
}