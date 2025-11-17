import "dotenv/config";

export const config = {
  supabase: {
    url: process.env.SUPABASE_URL!,
    anon: process.env.SUPABASE_ANON_KEY!,
    service: process.env.SUPABASE_SERVICE_ROLE_KEY!
  },

  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN!
  },

  gemini: {
    key: process.env.GEMINI_API_KEY!
  },

  server: {
    port: process.env.PORT || 3000,
    webhookUrl: process.env.WEBHOOK_URL || ""
  }
};

// Validation to prevent silent failures
const missing = Object.entries(config)
  .flatMap(([section, values]) =>
    typeof values === "object"
      ? Object.entries(values)
          .filter(([, v]) => !v)
          .map(([key]) => `${section}.${key}`)
      : []
  );

if (missing.length > 0) {
  console.error("❌ Missing required environment variables:");
  for (const m of missing) console.error(" -", m);
  process.exit(1);
}