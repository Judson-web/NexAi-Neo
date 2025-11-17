import "dotenv/config";

export const config = {
  supabase: {
    url: process.env.SUPABASE_URL,
    anon: process.env.SUPABASE_ANON_KEY,
    service: process.env.SUPABASE_SERVICE_ROLE_KEY
  },

  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN
  },

  gemini: {
    key: process.env.GEMINI_API_KEY
  },

  server: {
    port: process.env.PORT,
    webhookUrl: process.env.WEBHOOK_URL
  }
};

// Validate
for (const [section, obj] of Object.entries(config)) {
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      if (!v) console.error(`❌ Missing: ${section}.${k}`);
    }
  }
}