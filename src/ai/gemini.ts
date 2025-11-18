import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";

import { loadHistory, saveHistory } from "./history.js";
import { processMemoryUpdate, touchMemories } from "./memoryManager.js";
import { getTopMemories } from "../db/memory.js";

const genAI = new GoogleGenerativeAI(config.gemini.key);

/* ----------------------------------------------------------
   Build context prompt from memory + chat history
---------------------------------------------------------- */
function buildContextPrompt(history: string, memories: { id: number; memory: string }[]) {
  const memoryBlock =
    memories.length > 0
      ? memories.map((m) => `• ${m.memory}`).join("\n")
      : "None";

  return `
You are Nexus, an advanced AI assistant.

You have long-term memory about the user.
These are the most relevant memories:

${memoryBlock}

---

Conversation history:
${history}

---

Respond naturally. Do NOT mention memory or history directly.
  `.trim();
}

/* ----------------------------------------------------------
   Generate text with memory + conversation history
---------------------------------------------------------- */
export async function generateText(userInput: string, userId: number): Promise<string> {
  try {
    // Load last ~20 chat turns
    const history = await loadHistory(userId, 20);

    // Select top relevant memories
    const memories = await getTopMemories(userId, 5);

    // Build final prompt
    const context = buildContextPrompt(history, memories);

    const finalPrompt = `
${context}

User: ${userInput}
AI:
    `.trim();

    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-pro"
    });

    const result = await model.generateContent(finalPrompt);
    const reply = result.response.text() || "I couldn’t generate a reply.";

    // Save this turn to chat history
    await saveHistory(userId, userInput, reply);

    // Memory engine decides whether to store/update memory
    await processMemoryUpdate(userId, userInput, reply, history);

    // Touch memories (refresh recency score)
    await touchMemories(memories.map((m) => m.id));

    return reply;
  } catch (err) {
    console.error("❌ Gemini generateText Error:", err);
    return "⚠️ AI engine error. Try again soon.";
  }
}