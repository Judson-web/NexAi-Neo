import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";

const genAI = new GoogleGenerativeAI(config.gemini.key);

/**
 * Generate an AI image (PNG) using Gemini.
 * Uses gemini-pro-vision (the correct image-capable model).
 */
export async function generateImage(prompt) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-pro-vision"
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: "image/png"
      }
    });

    const base64 = result.response.text();

    if (!base64) {
      console.error("❌ Gemini returned empty image output");
      return null;
    }

    return Buffer.from(base64, "base64");

  } catch (err) {
    console.error("❌ Image Error:", err);
    return null;
  }
}