import crypto from "node:crypto";
import { redeemKingshot } from "../../lib/kingshot-redeem.js";
import { rateLimit } from "../../lib/request-rate-limit.js";
import { apiHeaders, authenticateDeveloper } from "../../lib/developer-api.js";

export default async function handler(req, res) {
  apiHeaders(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED", message: "Use POST /api/v1/redeem." } });

  if (!rateLimit(req, res, "developer-api-redeem", 60, 60000)) {
    return res.status(429).json({ error: { code: "RATE_LIMITED", message: "Too many requests. Please try again shortly." } });
  }

  let key;
  try {
    key = await authenticateDeveloper(req, res);
  } catch {
    return res.status(503).json({ error: { code: "AUTH_SERVICE_UNAVAILABLE", message: "Developer authentication is temporarily unavailable." } });
  }
  if (!key) return;

  const body = req.body || {};
  const result = await redeemKingshot({ playerId: body.playerId, code: body.code, kid: body.kingdomId ?? body.kid });

  const requestId = crypto.randomUUID();
  res.setHeader("X-Request-Id", requestId);
  res.setHeader("X-API-Version", "1");

  if (result.error) {
    return res.status(result.httpStatus).json({
      error: { code: result.errorCategory || "REDEEM_ERROR", message: result.error },
      requestId
    });
  }

  return res.status(result.httpStatus).json({
    ok: result.ok,
    status: result.status,
    statusLabel: result.statusLabel,
    message: result.message,
    errCode: result.errCode,
    requestId
  });
}
