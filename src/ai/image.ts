import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";

const genAI = new GoogleGenerativeAI(config.gemini.key);

/**
 * Generate an image using JSON output from Gemini 2.x models.
 * This avoids PNG response types (no longer supported).
 */
export async function generateImage(prompt) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro"   // more capable for multimodal
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `Generate an image. ${prompt}` }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const jsonText = result.response.text();
    const parsed = JSON.parse(jsonText);

    if (
      parsed &&
      parsed.image &&
      parsed.image.data
    ) {
      return Buffer.from(parsed.image.data, "base64");
    }

    console.error("❌ No image data found in JSON response.");
    return null;

  } catch (err) {
    console.error("❌ Image Error:", err);
    return null;
  }
}