// src/ai/history.ts

import { supabase } from "../db/client.js";

/* ----------------------------------------------------------
   Save a single turn of chat (user → AI)
---------------------------------------------------------- */
export async function saveHistory(
  userId: number,
  userMessage: string,
  aiReply: string
) {
  try {
    const { error } = await supabase.from("history").insert({
      user_id: userId,
      user_message: userMessage,
      ai_reply: aiReply
    });

    if (error) console.error("❌ saveHistory Error:", error.message);
  } catch (err) {
    console.error("❌ saveHistory Exception:", err);
  }
}

/* ----------------------------------------------------------
   Load last N history messages
---------------------------------------------------------- */
export async function loadHistory(
  userId: number,
  limit = 20
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("history")
      .select("user_message, ai_reply")
      .eq("user_id", userId)
      .order("id", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("❌ loadHistory Error:", error.message);
      return "";
    }

    if (!data || data.length === 0) return "";

    // Build readable context string
    return data
      .reverse() // oldest → newest
      .map((turn) => `User: ${turn.user_message}\nAI: ${turn.ai_reply}`)
      .join("\n\n");

  } catch (err) {
    console.error("❌ loadHistory Exception:", err);
    return "";
  }
}