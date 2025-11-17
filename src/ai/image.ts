import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";

const genAI = new GoogleGenerativeAI(config.gemini.key);

/**
 * Generate an AI image (PNG) from a text prompt.
 * Returns a Buffer ready to send via Telegram.
 */
export async function generateImage(prompt: string): Promise<Buffer | null> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
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

    const base64 = await result.response.text();

    if (!base64) {
      console.error("❌ Gemini returned empty image data.");
      return null;
    }

    return Buffer.from(base64, "base64");
  } catch (err) {
    console.error("❌ Gemini generateImage Error:", err);
    return null;
  }
}