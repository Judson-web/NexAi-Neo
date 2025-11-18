import TelegramBot from "node-telegram-bot-api";
import { upsertUser } from "../db/users.js";
import { generateText } from "../ai/gemini.js";

/* ----------------------------------------------------------
   Convert Gemini Markdown → Telegram-safe HTML
---------------------------------------------------------- */
function formatMarkdownToHTML(text: string = ""): string {
  if (!text) return "";

  // Escape HTML first
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold: **text**
  html = html.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

  // Italic: *text* or _text_
  html = html.replace(/(?:\*)([^*]+)(?:\*)/g, "<i>$1</i>");
  html = html.replace(/_(.+?)_/g, "<i>$1</i>");

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Code block: ``` code ```
  html = html.replace(/```([\s\S]+?)```/g, (m, code) => {
    const clean = code.trim();
    return `<pre><code>${clean}</code></pre>`;
  });

  // Headings → bold
  html = html.replace(/^### (.+)$/gm, "<b>$1</b>");
  html = html.replace(/^## (.+)$/gm, "<b>$1</b>");
  html = html.replace(/^# (.+)$/gm, "<b>$1</b>");

  // Bullet lists
  html = html.replace(/^\* (.+)$/gm, "• $1");

  return html;
}

/* ----------------------------------------------------------
   Telegram Message Splitter (4096 limit → safe 3500 chunks)
---------------------------------------------------------- */
function chunkText(text: string, size = 3500) {
  const parts: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    parts.push(text.slice(i, i + size));
  }
  return parts;
}

/* ----------------------------------------------------------
   Register all message handlers
---------------------------------------------------------- */
export function registerMessageHandlers(bot: TelegramBot) {

  /* --------------------------------------------------------
     /start — Image, caption, & inline buttons
  -------------------------------------------------------- */
  bot.onText(/\/start/, async (msg) => {
    await upsertUser(msg.from);

    const welcomeImage =
      "https://firebasestorage.googleapis.com/v0/b/crnn-b7d8f.appspot.com/o/files%2FIMG_20250717_215454_617.webp?alt=media&token=474c6c29-9eeb-48f6-bb8e-fbf0b167d476";

    const caption = `
👋 Welcome to Nexus!
I'm powered by Gemini 2.5 Pro + Supabase memory.

Ask me anything, or try:
• Inline mode — type @YourBot <query>
(⚠️ Image generation is currently disabled)
`.trim();

    const buttons = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "💬 Ask Nexus", switch_inline_query_current_chat: "" }],
          [
            { text: "📜 Commands", callback_data: "show_commands" },
            { text: "ℹ️ About", callback_data: "show_about" }
          ]
        ]
      },
      parse_mode: "Markdown"
    };

    await bot.sendPhoto(msg.chat.id, welcomeImage, {
      caption,
      ...buttons
    });
  });

  /* --------------------------------------------------------
     /image — disabled for now
  -------------------------------------------------------- */
  bot.onText(/\/image (.+)/, async (msg) => {
    await bot.sendMessage(
      msg.chat.id,
      "⚠️ Image generation is temporarily disabled while Nexus upgrades its engine."
    );
  });

  /* --------------------------------------------------------
     Main chat handler with memory-enabled AI
  -------------------------------------------------------- */
  bot.on("message", async (msg) => {
    if (msg.text?.startsWith("/")) return;

    await upsertUser(msg.from);

    const userId = msg.from?.id!;
    const prompt = msg.text || "";

    const reply = await generateText(prompt, userId);

    const html = formatMarkdownToHTML(reply);
    const parts = chunkText(html);

    for (const part of parts) {
      await bot.sendMessage(msg.chat.id, part, {
        parse_mode: "HTML"
      });
    }
  });

  /* --------------------------------------------------------
     Handle inline callback buttons
  -------------------------------------------------------- */
  bot.on("callback_query", async (query) => {
    const chatId = query.message?.chat.id;
    if (!chatId) return;

    if (query.data === "show_commands") {
      await bot.sendMessage(chatId,
        `
📜 *Commands*
/start — Welcome  
/image — Disabled  
/help — Coming soon  
        `.trim(),
        { parse_mode: "Markdown" }
      );
    }

    if (query.data === "show_about") {
      await bot.sendMessage(chatId,
        `
ℹ️ *About Nexus*
• Powered by Gemini 2.5 Pro  
• Long-term memory  
• Inline AI search  
• Supabase backend  
        `.trim(),
        { parse_mode: "Markdown" }
      );
    }

    await bot.answerCallbackQuery(query.id);
  });
}