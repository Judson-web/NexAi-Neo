import TelegramBot from "node-telegram-bot-api";
import { upsertUser } from "../db/users.js";
import { generateText } from "../ai/gemini.js";

/* ----------------------------------------------------------
   1. Convert Gemini Markdown → Telegram-safe HTML
---------------------------------------------------------- */
function formatMarkdownToHTML(text: string = ""): string {
  if (!text) return "";

  // Escape HTML first
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Restore HTML tags for formatting
  // Bold: **text**
  html = html.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

  // Italic: *text* or _text_
  html = html.replace(/(?:\*)([^*]+)(?:\*)/g, "<i>$1</i>");
  html = html.replace(/_(.+?)_/g, "<i>$1</i>");

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Code blocks: ```lang\n code ```
  html = html.replace(/```([^`]+)```/gs, (match, code) => {
    const clean = code.trim().replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    return `<pre><code>${clean}</code></pre>`;
  });

  // Headings ## Title → <b>TITLE</b>
  html = html.replace(/^### (.+)$/gm, "<b>$1</b>");
  html = html.replace(/^## (.+)$/gm, "<b>$1</b>");
  html = html.replace(/^# (.+)$/gm, "<b>$1</b>");

  // Links: [text](url)
  html = html.replace(/([^]+)\]([^)]+)/g, `<a href="$2">$1</a>`);

  // Bullet lists → preserve formatting
  html = html.replace(/^\* (.+)$/gm, "• $1");

  return html;
}

/* ----------------------------------------------------------
   2. Telegram message splitter (to avoid the 4096 limit)
---------------------------------------------------------- */
function chunkText(text: string, size = 3500) {
  const parts = [];
  for (let i = 0; i < text.length; i += size) {
    parts.push(text.slice(i, i + size));
  }
  return parts;
}

/* ----------------------------------------------------------
   3. Register handlers
---------------------------------------------------------- */
export function registerMessageHandlers(bot: TelegramBot) {

  // /start command with image + caption
  bot.onText(/\/start/, async (msg) => {
    await upsertUser(msg.from);

    const welcomeImage =
      "https://firebasestorage.googleapis.com/v0/b/crnn-b7d8f.appspot.com/o/files%2FIMG_20250717_215454_617.webp?alt=media&token=474c6c29-9eeb-48f6-bb8e-fbf0b167d476";

    const caption = `
👋 Welcome to Nexus!
I'm powered by Gemini 2.5 Pro + Supabase.

Ask me anything, or try:
• Inline mode — type @YourBot <query>
(⚠️ Image generation is currently disabled)
    `.trim();

    await bot.sendPhoto(msg.chat.id, welcomeImage, {
      caption,
      parse_mode: "Markdown"
    });
  });

  // /image command (disabled)
  bot.onText(/\/image (.+)/, async (msg) => {
    await bot.sendMessage(
      msg.chat.id,
      "⚠️ Image generation is temporarily disabled while Nexus upgrades to a new image engine."
    );
  });

  // Default text handler
  bot.on("message", async (msg) => {
    if (msg.text?.startsWith("/")) return;

    await upsertUser(msg.from);

    const prompt = msg.text || "";
    const reply = await generateText(prompt);

    // Convert Gemini Markdown → Telegram HTML
    const html = formatMarkdownToHTML(reply);

    // Split long output
    const parts = chunkText(html);

    for (const part of parts) {
      await bot.sendMessage(msg.chat.id, part, { parse_mode: "HTML" });
    }
  });
}