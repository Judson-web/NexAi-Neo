import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";

const genAI = new GoogleGenerativeAI(config.gemini.key);

// Simple, clean text generation module
export async function generateText(prompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;

    const text = response.text();
    return text || "I couldn't generate a response.";
  } catch (err) {
    console.error("❌ Gemini generateText Error:", err);
    return "⚠️ Gemini API error. Try again soon.";
  }
}

/**
 * For more advanced chat-style messages later
 */
export async function generateChatResponse(history: string[]): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = history.join("\n");

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return text || "I couldn’t generate a response.";
  } catch (err) {
    console.error("❌ Gemini Chat Error:", err);
    return "⚠️ Gemini chat error.";
  }
}