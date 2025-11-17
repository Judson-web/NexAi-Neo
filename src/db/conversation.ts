// src/db/conversation.ts
import { supabase } from "./client.js";

/**
 * Save a single message to the conversation log.
 * role = "user" | "assistant"
 */
export async function saveMessage(
  userId: number,
  chatId: number,
  role: "user" | "assistant",
  content: string
) {
  const { error } = await supabase.from("messages").insert([
    {
      user_id: userId,
      chat_id: chatId,
      role,
      content,
    }
  ]);

  if (error) {
    console.error("❌ saveMessage error:", error.message);
  }
}

/**
 * Fetch recent messages in chronological order.
 */
export async function fetchRecentMessages(userId: number, limit = 20) {
  const { data, error } = await supabase
    .from("messages")
    .select("role, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("❌ fetchRecentMessages error:", error.message);
    return [];
  }

  // Reverse so the oldest message comes first
  return (data || []).reverse();
}