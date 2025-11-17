#!/bin/bash

# FILE: scripts/set-webhook.sh
# Registers the Telegram webhook for Nexus with Firebase Functions.
# Works in Cloud Shell, Linux, macOS, Windows Git Bash.

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
  echo ""
  echo "❌ TELEGRAM_BOT_TOKEN is not set."
  echo "   Run this first:"
  echo "   export TELEGRAM_BOT_TOKEN=\"YOUR_BOT_TOKEN_HERE\""
  echo ""
  exit 1
fi

PROJECT_ID="nexusaineo"
REGION="us-central1"
WEBHOOK_URL="https://${REGION}-${PROJECT_ID}.cloudfunctions.net/api/telegram/webhook"

echo "➡ Setting webhook to:"
echo "   $WEBHOOK_URL"
echo ""

RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -d "url=${WEBHOOK_URL}")

echo "🛰 Telegram response:"
echo "$RESPONSE"
echo ""

if [[ "$RESPONSE" == *"true"* ]]; then
  echo "✅ Webhook successfully set!"
else
  echo "⚠ Something didn’t look right. Check the token or deploy status."
fi