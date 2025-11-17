// src/ai/gemini.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";

import {
  loadHistory,
  saveHistory
} from "./history.js";

import {
  processMemoryUpdate,
  touchMemories
} from "./memoryManager.js";

import {
  getTopMemories
} from "../db/memory.js";

const genAI = new GoogleGenerativeAI(config.gemini.key);

/* ----------------------------------------------------------
   1. Build context prompt from history + memories
---------------------------------------------------------- */
function buildContext(
  history: string,
  memories: { id: number; memory: string }[]
) {
  const memoryBlock =
    memories.length > 0
      ? memories.map(m => `• ${m.memory}`).join("\n")
      : "None";

  return `
You are Nexus, an advanced AI assistant.

You have a long-term memory system. The following are the
most relevant memories about this user:

${memoryBlock}

---

Conversation history:
${history}

---

Respond naturally. Do NOT mention memory or history directly.
`.trim();
}

/* ----------------------------------------------------------
   2. Main AI text generation with context + memory
---------------------------------------------------------- */
export async function generateText(
  userInput: string,
  userId: number
): Promise<string> {
  // Load last 20 turns of chat
  const history = await loadHistory(userId, 20);

  // Retrieve top 5 long-term memories
  const memories = await getTopMemories(userId, 5);

  // Build contextual model prompt
  const context = buildContext(history, memories);

  const prompt = `
${context}

User: ${userInput}
AI:
`.trim();

  try {
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-pro"
    });

    const result = await model.generateContent(prompt);
    const reply = result.response.text() || "I couldn't generate a reply.";

    // Save the new turn to conversation history
    await saveHistory(userId, userInput, reply);

    // Decide if the new message should be added to memory
    await processMemoryUpdate(userId, userInput, reply, history);

    // Mark used memories as "fresh"
    await touchMemories(memories.map(m => m.id));

    return reply;
  } catch (err) {
    console.error("❌ Gemini generateText Error:", err);
    return "⚠️ AI engine error. Try again soon.";
  }
}