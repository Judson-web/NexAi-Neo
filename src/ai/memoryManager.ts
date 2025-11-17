// src/ai/memoryManager.ts

import { supabase } from "../db/client.js";
import { config } from "../config.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(config.gemini.key);

/* ----------------------------------------------------------
   Ask Gemini: Should this message become a memory?
---------------------------------------------------------- */
async function evaluateMemoryRelevance(
  userMessage: string,
  aiReply: string,
  history: string
): Promise<string | null> {
  try {
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-pro"
    });

    const prompt = `
You are a memory extraction model.

Given the user's latest message and the AI's reply,
decide if this contains *long-term useful info* about the user.

Examples of valid memories:
- user preferences ("I like horror movies")
- personal data they want the AI to remember
- goals or projects they are working on
- writing style or personality traits
- long-term dislikes or limitations

Invalid memories:
- random questions
- temporary tasks
- jokes
- greetings

Output ONLY one of the following:
1. A short memory sentence (if relevant)
2. "NO_MEMORY"
---

Conversation history:
${history}

User message: ${userMessage}
AI reply: ${aiReply}

Extracted memory:
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    if (!text || text === "NO_MEMORY") return null;

    return text;
  } catch (err) {
    console.error("❌ Memory relevance error:", err);
    return null;
  }
}

/* ----------------------------------------------------------
   Save a new memory row with initial score
---------------------------------------------------------- */
export async function saveMemory(
  userId: number,
  memory: string
) {
  try {
    const { error } = await supabase.from("memories").insert({
      user_id: userId,
      memory,
      score: 1,        // initial importance
      last_used: new Date().toISOString()
    });

    if (error) console.error("❌ saveMemory error:", error);
  } catch (err) {
    console.error("❌ saveMemory fatal:", err);
  }
}

/* ----------------------------------------------------------
   Touch memories (mark them as recently used)
---------------------------------------------------------- */
export async function touchMemories(memoryIds: number[]) {
  if (!memoryIds.length) return;

  try {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("memories")
      .update({ last_used: now, score: supabase.rpc("increment_score") })
      .in("id", memoryIds);

    if (error) console.error("❌ touchMemories error:", error);
  } catch (err) {
    console.error("❌ touchMemories fatal:", err);
  }
}

/* ----------------------------------------------------------
   Main entry: process memory update pipeline
---------------------------------------------------------- */
export async function processMemoryUpdate(
  userId: number,
  userMessage: string,
  aiReply: string,
  history: string
) {
  // Ask the LLM if this should be remembered
  const extracted = await evaluateMemoryRelevance(
    userMessage,
    aiReply,
    history
  );

  if (!extracted) return;

  // Save memory
  await saveMemory(userId, extracted);
}