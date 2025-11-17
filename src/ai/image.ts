import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";

const genAI = new GoogleGenerativeAI(config.gemini.key);

export async function generateImage(prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "image/png" }
    });

    const base64 = await result.response.text();
    return base64 ? Buffer.from(base64, "base64") : null;

  } catch (err) {
    console.error("❌ Image Error:", err);
    return null;
  }
}