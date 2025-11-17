// src/ai/memoryManager.ts

import { supabase } from "../db/client.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";

const genAI = new GoogleGenerativeAI(config.gemini.key);

/* ----------------------------------------------------------
   1. Ask Gemini to decide if a message is a long-term memory
---------------------------------------------------------- */
async function extractMemory(userInput: string, aiReply: string, history: string) {
  const systemPrompt = `
You evaluate whether a user's message contains *long-term personal memory*.

Long-term memory examples:
• personal preferences ("I love anime", "I hate spicy food")
• personal profile ("I'm 17", "I live in Delhi")
• stable habits ("I wake up at 5am", "I always code at night")
• ongoing projects ("I'm building an app called Nexus")
• goals ("I want to become a designer")

DO NOT extract:
• temporary questions
• greetings
• single-use info
• random facts unrelated to the user

Return JSON ONLY in this format:
{
  "should_write_memory": true/false,
  "memory_to_write": "string"
}

Conversation history:
${history}

User message:
${userInput}

AI reply:
${aiReply}
  `.trim();

  try {
    const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-pro" });
    const result = await model.generateContent(systemPrompt);

    const raw = result.response.text();
    const json = JSON.parse(raw);

    return json;
  } catch (err) {
    console.error("❌ extractMemory Error:", err);
    return { should_write_memory: false, memory_to_write: "" };
  }
}

/* ----------------------------------------------------------
   2. Save memory if Gemini approves it
---------------------------------------------------------- */
export async function processMemoryUpdate(
  userId: number,
  userInput: string,
  aiReply: string,
  history: string
) {
  try {
    const evaluation = await extractMemory(userInput, aiReply, history);

    if (!evaluation.should_write_memory) return;

    const memory = evaluation.memory_to_write?.trim();
    if (!memory) return;

    // Insert into memories + usage
    const { data, error } = await supabase
      .from("memories")
      .insert({
        user_id: userId,
        memory,
        score: 1 // default weight
      })
      .select("id")
      .single();

    if (error) {
      console.error("❌ Failed to insert memory:", error);
      return;
    }

    // Add initial usage record
    await supabase.from("memory_usage").insert({
      memory_id: data.id,
      last_used: new Date().toISOString(),
      use_count: 1
    });

  } catch (err) {
    console.error("❌ processMemoryUpdate Error:", err);
  }
}

/* ----------------------------------------------------------
   3. Touch memories to mark as "fresh"
---------------------------------------------------------- */
export async function touchMemories(memoryIds: number[]) {
  if (!memoryIds.length) return;

  try {
    const updates = memoryIds.map((id) => ({
      memory_id: id,
      last_used: new Date().toISOString()
    }));

    await supabase.from("memory_usage").upsert(updates, {
      onConflict: "memory_id"
    });
  } catch (err) {
    console.error("❌ touchMemories Error:", err);
  }
}