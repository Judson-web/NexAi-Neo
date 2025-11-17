// src/ai/context.ts
import { fetchRelevantMemories } from "../db/memory.js";
import { fetchConversationHistory } from "../db/conversation.js";

/**
 * Build a rich context bundle combining:
 *  - Relevant memories
 *  - Recent chat history
 *  - The latest user message
 */
export async function buildContext(userId: number, latestMessage: string) {
  // Load top 5 memories (ranked by importance + recency)
  const memories = await fetchRelevantMemories(userId);

  // Load recent messages (last 15)
  const history = await fetchConversationHistory(userId, 15);

  const memoryText =
    memories.length > 0
      ? memories.map((m) => `• ${m.summary}`).join("\n")
      : "None";

  const historyText =
    history.length > 0
      ? history
          .map((h) => `${h.role.toUpperCase()}: ${h.message}`)
          .join("\n")
      : "None";

  return `
### USER CONTEXT
Your output must follow these rules:
- Use the user's memories to stay consistent across chats.
- Use the recent conversation history to stay context-aware.
- Do NOT mention "memories" or "context" to the user.
- Respond naturally as if you remembered everything normally.

### LONG-TERM MEMORIES (important facts)
${memoryText}

### RECENT CONVERSATION (chronological)
${historyText}

### NEW USER MESSAGE
USER: ${latestMessage}
`.trim();
}