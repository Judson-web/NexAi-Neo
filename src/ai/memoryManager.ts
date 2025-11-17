// src/ai/memoryManager.ts
import { createMemory, updateMemoryUsage } from "../db/memory.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";

const genAI = new GoogleGenerativeAI(config.gemini.key);

/**
 * Ask Gemini to evaluate whether the user message + bot response
 * should be saved as long-term memory.
 */
export async function evaluateMemoryNeed(
  userMessage: string,
  botReply: string,
  history: string
) {
  const model = genAI.getGenerativeModel({
    model: "models/gemini-2.5-pro"
  });

  const prompt = `
You are an AI memory controller.

Your task: decide whether the following information is important enough
to store as **long-term memory** about the user.

Criteria for saving memory:
- User preferences (likes/dislikes)
- Stable traits or personality
- Long-term plans or goals
- Background details (hobbies, routines, job, country)
- Skills / expertise
- Projects the user is working on
- Repeated behavior patterns

DO NOT store:
- Temporary requests
- One-time questions
- Casual conversation
- Anything unrelated to the user

Return ONLY a JSON object:

{
  "should_write_memory": true/false,
  "memory_to_write": "short summary sentence"
}

Example memory:
"User prefers dark themes"
"User is building a Telegram bot using Node.js"
"User's favorite color is purple"

---

### Conversation History
${history}

### User Message
${userMessage}

### Bot Reply
${botReply}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    return JSON.parse(text);
  } catch (err) {
    console.error("❌ Memory evaluation error:", err);
    return { should_write_memory: false };
  }
}

/**
 * Save memory if Gemini decides it's important.
 */
export async function processMemoryUpdate(
  userId: number,
  userMessage: string,
  botReply: string,
  history: string
) {
  // Step 1: Ask Gemini if memory is important
  const decision = await evaluateMemoryNeed(
    userMessage,
    botReply,
    history
  );

  if (!decision || !decision.should_write_memory) {
    return false; // Nothing to store
  }

  const summary = decision.memory_to_write?.trim();
  if (!summary) return false;

  // Step 2: Save memory in DB
  await createMemory(userId, summary, 1.0);

  return true;
}

/**
 * Every time a memory is referenced in the context builder,
 * update its recency so the ranking stays fresh.
 */
export async function touchMemories(memoryIds: number[]) {
  for (const id of memoryIds) {
    await updateMemoryUsage(id);
  }
}