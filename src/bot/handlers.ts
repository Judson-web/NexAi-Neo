// src/bot/handlers.ts
import TelegramBot from "node-telegram-bot-api";
import { upsertUser } from "../db/users.js";
import { generateText } from "../ai/gemini.js";

/* ----------------------------------------------------------
   1. Convert Gemini Markdown → Telegram-safe HTML
---------------------------------------------------------- */
function formatMarkdownToHTML(text: string = ""): string {
  if (!text) return "";

  // Escape unsafe HTML
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold **text**
  html = html.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

  // Italic *text* OR _text_
  html = html.replace(/(?<!\*)\*(?!\*)([^*]+)(?<!\*)\*(?!\*)/g, "<i>$1</i>");
  html = html.replace(/_(.+?)_/g, "<i>$1</i>");

  // Inline code `code`
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Code blocks ``` code ```
  html = html.replace(/```([\s\S]+?)```/g, (m, code) => {
    const clean = code.trim();
    return `<pre><code>${clean}</code></pre>`;
  });

  // Headings
  html = html.replace(/^### (.+)$/gm, "<b>$1</b>");
  html = html.replace(/^## (.+)$/gm, "<b>$1</b>");
  html = html.replace(/^# (.+)$/gm, "<b>$1</b>");

  // Bullet lists
  html = html.replace(/^\* (.+)$/gm, "• $1");

  return html;
}

/* ----------------------------------------------------------
   2. Split long messages (Telegram hard limit: 4096 chars)
---------------------------------------------------------- */
function chunkText(text: string, size = 3500) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

/* ----------------------------------------------------------
   3. Register bot handlers
---------------------------------------------------------- */
export function registerMessageHandlers(bot: TelegramBot) {

  /* --------------------------------------------------------
     /start — Image + Caption + Inline Buttons
  -------------------------------------------------------- */
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

    const inlineButtons = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "💬 Ask Nexus", switch_inline_query_current_chat: "" }
          ],
          [
            { text: "📜 Commands", callback_data: "show_commands" },
            { text: "ℹ️ About", callback_data: "show_about" }
          ],
          [
            { text: "👨‍💻 Developer", url: "https://t.me/developer" }
          ]
        ]
      },
      parse_mode: "Markdown"
    };

    await bot.sendPhoto(msg.chat.id, welcomeImage, {
      caption,
      ...inlineButtons
    });
  });

  /* --------------------------------------------------------
     /image — disabled temporarily
  -------------------------------------------------------- */
  bot.onText(/\/image (.+)/, async (msg) => {
    await bot.sendMessage(
      msg.chat.id,
      "⚠️ Image generation is temporarily disabled while Nexus upgrades to a new image engine."
    );
  });

  /* --------------------------------------------------------
     Default text → Gemini response (HTML formatted)
  -------------------------------------------------------- */
  bot.on("message", async (msg) => {
    if (msg.text?.startsWith("/")) return;

    await upsertUser(msg.from);

    const prompt = msg.text || "";
    const reply = await generateText(prompt, msg.from.id);

    const safeHTML = formatMarkdownToHTML(reply);
    const parts = chunkText(safeHTML);

    for (const part of parts) {
      await bot.sendMessage(msg.chat.id, part, { parse_mode: "HTML" });
    }
  });

  /* --------------------------------------------------------
     Inline button callbacks
  -------------------------------------------------------- */
  bot.on("callback_query", async (query) => {
    const chatId = query.message?.chat.id;
    if (!chatId) return;

    if (query.data === "show_commands") {
      await bot.sendMessage(
        chatId,
        `
📜 *Commands*

/start — Restart bot  
/image — Disabled  
Inline Mode — @YourBot <query>  
        `.trim(),
        { parse_mode: "Markdown" }
      );
    }

    if (query.data === "show_about") {
      await bot.sendMessage(
        chatId,
        `
ℹ️ *About Nexus*

• Powered by Gemini 2.5 Pro  
• Conversational memory system  
• Supabase user tracking  
• Inline smart search  
• Ultra-fast Telegram integration  
        `.trim(),
        { parse_mode: "Markdown" }
      );
    }

    await bot.answerCallbackQuery(query.id);
  });
}