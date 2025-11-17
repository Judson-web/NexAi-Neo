
📄 README.md (Complete Production Version)

Create:

NexAi-Neo/README.md

Paste this complete file:

# 🚀 Nexus AI — Telegram + Gemini + Supabase Bot

Nexus is a fully serverless AI assistant powered by:

- **Gemini 1.5 Flash** (text + image)
- **Supabase Postgres** (user DB + inline logs)
- **Telegram Bot API**
- **Express** (webhook server)
- **TypeScript**

This project is clean, modular, modern, and deployable to **Render** for free.


---

## 📦 Features

### ✔ AI Text Chat  
Gemini-powered natural language responses.

### ✔ AI Image Generation  
Generate PNG images using Gemini 1.5 Flash.

### ✔ Inline Mode  
Type:

@NexusBot your question

to get instant answers inside any chat.

### ✔ User Tracking  
Automatically logs users in Supabase.

### ✔ Inline Query Logging  
Stores every inline query & answer.

### ✔ Fully Typed with TypeScript  
Production-grade architecture.


---

# 📂 Project Structure

src/ │ ├── config.ts ├── server.ts │ ├── bot/ │   ├── index.ts │   ├── handlers.ts │   └── inline.ts │ ├── ai/ │   ├── gemini.ts │   └── image.ts │ ├── db/ │   ├── client.ts │   └── users.ts │ └── types.ts

---

# 🔧 Environment Variables

Create a `.env` (never commit it):

SUPABASE_URL=your_supabase_url SUPABASE_ANON_KEY=your_publishable_key SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

TELEGRAM_BOT_TOKEN=your_bot_token GEMINI_API_KEY=your_gemini_key

WEBHOOK_URL=https://your-render-service.onrender.com/webhook PORT=3000

You may commit `.env.example` (included in repo).

---

# 🗄 Database Schema (Supabase)

Create these tables using the SQL editor:

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  language_code TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inline_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT,
  query TEXT,
  response TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

No RLS needed for backend-only access.


---

🧪 Local Development

Install dependencies:

npm install

Start dev server:

npm run dev

Build production:

npm run build

Start compiled build:

npm start


---

☁️ Deploying to Render

1. Create a new Web Service

GitHub repository: NexAi-Neo

Runtime: Node

Build command:


npm install && npm run build

Start command:


npm start

2. Add environment variables

In Render dashboard → Environment Variables, paste your .env values.

3. Deploy the service.

You will get a URL like:

https://nexus-ai-backend.onrender.com


---

🤖 Telegram Webhook Setup

After Render finishes deploying:

Go to this URL in your browser:

https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://your-render-url.onrender.com/webhook

If successful, Telegram will reply:

{"ok":true,"result":true,"description":"Webhook was set"}


---

🧩 Troubleshooting

Bot not responding?

Check that WEBHOOK_URL is set correctly.

Make sure Render assigned the correct domain.

Ensure Telegram token is valid.

Check logs in Render dashboard.


Image generation fails?

Ensure your Gemini API key has permission for image generation.


Supabase errors?

Ensure service role key is used for backend access.

Confirm tables exist.



---

🎉 Nexus is Ready

Your bot has everything:

AI chat

AI images

Inline mode

Webhook server

Supabase logging


Deploy, plug in your keys, and enjoy your intelligent assistant.

Made with ❤️  using Supabase, Gemini, and Telegram API.

---

# 🎯 Next Step

You now have:

- All 10 source files  
- Fully documented README  
- Complete repository structure  
- Full environment config  
- Supabase schema  
- Deploy instructions  

Your project is now **100% ready to upload to GitHub**.

If you want, I can now generate:

### ✔ `.gitignore`  
### ✔ Render-specific build & deploy tips  
### ✔ Optional `webhook-set.sh` script  
### ✔ Example migrations  
### ✔ Extras (admin commands, memory, conversation history, etc.)

Just say:

**Next (gitignore)**