import { fetchRecentMessages } from "../db/conversation.js";
import { fetchRelevantMemories } from "../db/memory.js";

/**
 * Build the prompt for Gemini:
 *  - system instruction (bot behavior)
 *  - recent messages (short-term context)
 *  - relevant memories (persistent facts)
 *  - user prompt
 */
export async function buildPrompt(userId, userPrompt) {
  const sys = `You are Nexus, an intelligent Telegram assistant. Keep answers concise and helpful. If user asks personal things, prefer privacy.`;

  const recent = await fetchRecentMessages(userId, 12); // last 12 messages
  const memories = await fetchRelevantMemories(userId, 5);

  const memText = memories.length
    ? "Persistent facts about the user:\n" + memories.map((m,i) => `${i+1}. ${m.summary}`).join("\n") + "\n\n"
    : "";

  const convoText = recent.length
    ? "Recent conversation:\n" + recent.map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n") + "\n\n"
    : "";

  const prompt = `${sys}\n\n${memText}${convoText}User: ${userPrompt}\nAssistant:`;
  return prompt;
}