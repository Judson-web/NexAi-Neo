import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";

const genAI = new GoogleGenerativeAI(config.gemini.key);

export async function generateText(prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text() || "I couldn’t generate a response.";
  } catch (err) {
    console.error("❌ Gemini Error:", err);
    return "⚠️ Gemini API error.";
  }
}