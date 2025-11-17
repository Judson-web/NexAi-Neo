/**
 * functions/src/genai/geminiClient.ts
 *
 * Provides:
 *   - generateText()    : Gemini text generation
 *   - generateImage()   : Gemini image generation (PNG buffer)
 *
 * Works in Node 20 with native fetch() (no Axios required).
 * Implements retry with exponential backoff.
 *
 * NOTE:
 *   - Do NOT expose your API key to clients.
 *   - Key should come from Firebase functions:config or env variable.
 */

const TEXT_MODEL = "gemini-1.5-flash"; // fast and cheap, change if needed
const IMAGE_MODEL = "imagen-3.0";      // Google Imagen 3 (Gemini Image Endpoint)

interface TextGenOptions {
  prompt: string;
  apiKey: string;
}

interface ImageGenOptions {
  prompt: string;
  apiKey: string;
}

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

/**
 *--------- Helper: retry wrapper ----------
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 350): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

/**
 *--------- Text generation ----------
 * Uses: POST /models/<model>:generateContent
 */
export async function generateText({ prompt, apiKey }: TextGenOptions): Promise<string> {
  if (!apiKey) throw new Error("Gemini API key missing");

  const url = `${GEMINI_BASE_URL}/models/${TEXT_MODEL}:generateContent?key=${apiKey}`;

  return withRetry(async () => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini text API error: ${response.status} → ${err}`);
    }

    const json = await response.json();
    const text =
      json?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I could not think of anything. Try again?";

    return text;
  });
}

/**
 *--------- Image generation ----------
 * Uses Imagen 3 API:
 *   POST /models/imagen-3.0:generateImage
 * Returns PNG buffer.
 */
export async function generateImage({ prompt, apiKey }: ImageGenOptions): Promise<Buffer> {
  if (!apiKey) throw new Error("Gemini API key missing");

  const url = `${GEMINI_BASE_URL}/models/${IMAGE_MODEL}:generateImage?key=${apiKey}`;

  return withRetry(async () => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: {
          text: prompt,
        },
        // Optional quality settings
        // Use "high" for best, "standard" for cheap
        imageGenerationConfig: {
          quality: "high",
          mimeType: "image/png",
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini image API error: ${response.status} → ${err}`);
    }

    const json = await response.json();

    const base64Img =
      json?.images?.[0]?.data ||
      null;

    if (!base64Img) {
      throw new Error("Gemini returned no image data");
    }

    return Buffer.from(base64Img, "base64");
  });
}