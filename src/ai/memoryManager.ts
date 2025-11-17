import { GoogleGenerativeAI } from "@google/generative-ai";
import { upsertMemory } from "../db/memory.js";
import { config } from "../config.js";

const genAI = new GoogleGenerativeAI(config.gemini.key);

export async function autoSummarizeAndStore(userId, recentMessages) {
  try {
    // recentMessages: array of {role, content}
    const text = recentMessages.map(m => `${m.role}: ${m.content}`).join("\n");

    const prompt = `Extract up to 3 short, permanent facts about the user from the following conversation. 
Return as newline-separated one-sentence facts, no explanations. If none, return "NONE".\n\nConversation:\n${text}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
    const out = (await result.response).text();

    if (!out) return;

    if (out.trim().toUpperCase() === "NONE") return;

    const facts = out.split("\n").map(s => s.trim()).filter(Boolean).slice(0,3);
    for (const f of facts) {
      // cheap guard: avoid tiny facts
      if (f.length < 10) continue;
      await upsertMemory(userId, f, "auto_summary", 5);
    }
  } catch (e) {
    console.error("autoSummarizeAndStore err:", e);
  }
}