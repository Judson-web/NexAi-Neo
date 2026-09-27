# Discord PFP Extractor

A small React + Vite app for extracting public Discord profile avatars by user ID or Discord profile URL.

## Stack
- React 19 + Vite
- Vercel serverless API
- Discord API v10
- Discord CDN

## Vercel configuration
Set `DISCORD_BOT_TOKEN` in the Vercel Production environment. The token is only read by the serverless API and is never sent to the browser.

## Development
```bash
npm install
npm run dev
```
