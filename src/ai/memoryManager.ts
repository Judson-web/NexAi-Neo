import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";

import {
  addMemory,
  updateMemory,
  boostMemoryScore
} from "../db/memory.js";

const genAI = new GoogleGenerativeAI(config.gemini.key);

/* ----------------------------------------------------------
   Prompt: Decide if user message should enter long-term memory
---------------------------------------------------------- */
function buildMemoryPrompt(userInput: string, aiReply: string, history: string) {
  return `
You are a memory-analysis module.

Your job:
1. Detect if the latest user message contains personal, recurring, or long-term relevant information.
2. Respond ONLY with JSON in this format:

{
  "should_write_memory": true | false,
  "memory_to_write": "text or empty string",
  "should_update_memory": true | false,
  "updated_memory_text": "text when updating, or empty"
}

Do NOT include explanations.

---

Conversation History:
${history}

User said:
"${userInput}"

AI replied:
"${aiReply}"
  `.trim();
}

/* ----------------------------------------------------------
   Process memory update from AI instruction JSON
---------------------------------------------------------- */
export async function processMemoryUpdate(
  userId: number,
  userInput: string,
  aiReply: string,
  history: string
) {
  try {
    const prompt = buildMemoryPrompt(userInput, aiReply, history);

    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-pro"
    });

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn("⚠️ Memory JSON parse failed:", raw);
      return;
    }

    const {
      should_write_memory,
      memory_to_write,
      should_update_memory,
      updated_memory_text
    } = parsed;

    if (should_write_memory && memory_to_write) {
      await addMemory(userId, memory_to_write);
    }

    if (should_update_memory && updated_memory_text) {
      await updateMemory(userId, updated_memory_text);
    }
  } catch (err) {
    console.error("❌ Memory Manager Error:", err);
  }
}

/* ----------------------------------------------------------
   Refresh recency score for memories that were used
---------------------------------------------------------- */
export async function touchMemories(memoryIds: number[]) {
  try {
    for (const id of memoryIds) {
      await boostMemoryScore(id);
    }
  } catch (err) {
    console.error("❌ touchMemories Error:", err);
  }
}