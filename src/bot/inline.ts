import TelegramBot from "node-telegram-bot-api";
import { generateText } from "../ai/gemini.js";
import { supabase } from "../db/client.js";

/**
 * Inline mode handler
 * Triggered when user types:  @YourBot query...
 */
export function registerInlineHandlers(bot: TelegramBot) {
  bot.on("inline_query", async (query) => {
    try {
      const text = query.query?.trim() || "";
      const userId = query.from.id;

      // No query: show a placeholder result
      if (!text) {
        return bot.answerInlineQuery(query.id, [
          {
            type: "article",
            id: "empty",
            title: "Start typing…",
            description: "Ask Nexus anything.",
            input_message_content: {
              message_text: "Type something to get an AI response."
            }
          }
        ]);
      }

      // Generate AI answer (WITH memory system)
      const answer = await generateText(text, userId);

      // Log usage (optional but clean)
      await supabase.from("inline_logs").insert({
        user_id: userId,
        query: text,
        response: answer
      });

      // Respond with AI message
      await bot.answerInlineQuery(
        query.id,
        [
          {
            type: "article",
            id: "nexus_response",
            title: "Nexus AI",
            description: answer.slice(0, 60),
            input_message_content: {
              message_text: answer
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