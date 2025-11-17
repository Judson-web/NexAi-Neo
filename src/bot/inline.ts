// src/bot/inline.ts
import TelegramBot from "node-telegram-bot-api";
import { generateText } from "../ai/gemini.js";
import { supabase } from "../db/client.js";

/* ----------------------------------------------------------
   Convert Gemini Markdown → Telegram-safe HTML
---------------------------------------------------------- */
function formatMarkdownToHTML(text: string = ""): string {
  if (!text) return "";

  // Escape base HTML
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

  // Italic
  html = html.replace(/(?<!\*)\*(?!\*)([^*]+)(?<!\*)\*(?!\*)/g, "<i>$1</i>");
  html = html.replace(/_(.+?)_/g, "<i>$1</i>");

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Code blocks
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

export function registerInlineHandlers(bot: TelegramBot) {

  bot.on("inline_query", async (query) => {
    try {
      const text = query.query?.trim() || "";
      const userId = query.from.id;

      /* ------------------------------------------------------
         Empty query → show hint
      ------------------------------------------------------ */
      if (!text) {
        return bot.answerInlineQuery(query.id, [
          {
            type: "article",
            id: "empty",
            title: "Type something…",
            input_message_content: {
              message_text: "Please enter a question."
            }
          }
        ]);
      }

      /* ------------------------------------------------------
         Generate AI answer (memory-enabled)
      ------------------------------------------------------ */
      const raw = await generateText(text, userId);
      const html = formatMarkdownToHTML(raw);

      /* ------------------------------------------------------
         Log inline request to Supabase
      ------------------------------------------------------ */
      await supabase.from("inline_logs").insert({
        user_id: userId,
        query: text,
        response: raw
      });

      /* ------------------------------------------------------
         Send inline result
      ------------------------------------------------------ */
      await bot.answerInlineQuery(
        query.id,
        [
          {
            type: "article",
            id: "nexus-inline-response",
            title: "Nexus AI",
            description: raw.slice(0, 60),
            input_message_content: {
              message_text: html,
              parse_mode: "HTML"
            }
          }
        ],
        { cache_time: 1 }
      );

    } catch (err) {
      console.error("❌ Inline Query Error:", err);
    }
  });

}