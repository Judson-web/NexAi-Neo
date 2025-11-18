// src/db/history.ts

import { supabase } from "./client.js";

/* ----------------------------------------------------------
   Save one chat exchange (user_input → ai_reply)
---------------------------------------------------------- */
export async function saveHistory(
  userId: number,
  userMessage: string,
  aiReply: string
) {
  const { error } = await supabase.from("chat_history").insert({
    user_id: userId,
    user_message: userMessage,
    ai_reply: aiReply,
    timestamp: new Date().toISOString()
  });

  if (error) {
    console.error("❌ saveHistory Error:", error);
  }
}

/* ----------------------------------------------------------
   Load last N conversation turns
   Returns formatted text block, ex:
   User: hi
   AI: hello!
---------------------------------------------------------- */
export async function loadHistory(
  userId: number,
  limit: number
): Promise<string> {
  const { data, error } = await supabase
    .from("chat_history")
    .select("user_message, ai_reply")
    .eq("user_id", userId)
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("❌ loadHistory Error:", error);
    return "";
  }

  if (!data || data.length === 0) return "";

  // Reverse so older → newer (for natural reading)
  const ordered = data.reverse();

  const formatted = ordered
    .map(
      (row) => `
User: ${row.user_message}
AI: ${row.ai_reply}`
    )
    .join("\n");

  return formatted.trim();
}