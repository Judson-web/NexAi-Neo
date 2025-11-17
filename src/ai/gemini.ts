import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";

const genAI = new GoogleGenerativeAI(config.gemini.key);

/**
 * Text generation using Gemini 2.5 Pro
 */
export async function generateText(prompt) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro"
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;

    const text = response.text();
    return text || "I couldn’t generate a response.";
  } catch (err) {
    console.error("❌ Gemini Error:", err);
    return "⚠️ Gemini API error.";
  }
}