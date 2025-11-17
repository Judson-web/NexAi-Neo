import TelegramBot from "node-telegram-bot-api";
import { generateText } from "../ai/gemini.js";
import { supabase } from "../db/client.js";

export function registerInlineHandlers(bot: TelegramBot) {
  bot.on("inline_query", async (query) => {
    try {
      const text = query.query?.trim() || "";

      if (!text) {
        return bot.answerInlineQuery(query.id, [{
          type: "article",
          id: "empty",
          title: "Type something...",
          input_message_content: { message_text: "Please enter a question." }
        }]);
      }

      const answer = await generateText(text);

      await supabase.from("inline_logs").insert({
        user_id: query.from.id,
        query: text,
        response: answer
      });

      await bot.answerInlineQuery(query.id, [{
        type: "article",
        id: "response",
        title: "Nexus",
        description: answer.slice(0, 50),
        input_message_content: { message_text: answer }
      }], { cache_time: 2 });

    } catch (err) {
      console.error("❌ Inline Query Error", err);
    }
  });
}