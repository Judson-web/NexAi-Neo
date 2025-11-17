import TelegramBot from "node-telegram-bot-api";
import { generateText } from "../ai/gemini";
import { supabase } from "../db/client";

/**
 * Inline query handler for Nexus.
 * Triggered when a user types: @YourBot <query>
 */
export function registerInlineHandlers(bot: TelegramBot) {
  bot.on("inline_query", async (ctx) => {
    try {
      const query = ctx.query?.trim() || "";

      if (!query) {
        return bot.answerInlineQuery(ctx.id, [
          {
            type: "article",
            id: "empty",
            title: "Type something...",
            input_message_content: {
              message_text: "Please enter a question."
            }
          }
        ]);
      }

      // Fetch Gemini response
      const answer = await generateText(query);

      // Log inline usage to Supabase
      await supabase.from("inline_logs").insert({
        user_id: ctx.from?.id || null,
        query,
        response: answer
      });

      const results = [
        {
          type: "article",
          id: "nexus-response",
          title: "Nexus AI",
          description: answer.substring(0, 60),
          input_message_content: {
            message_text: answer
          }
        }
      ];

      await bot.answerInlineQuery(results, { cache_time: 2 });
    } catch (err) {
      console.error("❌ Inline Query Error:", err);
    }
  });
}