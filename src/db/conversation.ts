import { supabase } from "./client.js"; // your supabase client

export async function saveMessage(userId, chatId, role, content) {
  const { error } = await supabase.from("messages").insert([{
    user_id: userId,
    chat_id: chatId,
    role,
    content,
  }]);
  if (error) console.error("saveMessage error:", error.message);
}

export async function fetchRecentMessages(userId, limit = 20) {
  const { data, error } = await supabase
    .from("messages")
    .select("role,content,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("fetchRecentMessages error:", error.message);
    return [];
  }
  // return newest-first -> reverse to chronological
  return (data || []).reverse();
}