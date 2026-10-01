import crypto from "node:crypto";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://wocxvtptqapietlteshr.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

function hashKey(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function getBearer(req) {
  const header = String(req.headers.authorization || "");
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

async function rpc(name, body) {
  if (!SUPABASE_KEY) throw new Error("Supabase service key is not configured on the server.");
  const r = await fetch(SUPABASE_URL + "/rest/v1/rpc/" + name, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, authorization: "Bearer " + SUPABASE_KEY, "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000)
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(data?.message || data?.hint || "API key service unavailable.");
  return Array.isArray(data) ? data : [data];
}

export async function authenticateDeveloper(req, res) {
  const rawKey = getBearer(req);
  if (!/^ks_live_[A-Za-z0-9_-]{32,128}$/.test(rawKey)) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "A valid developer API key is required." } });
    return null;
  }

  const rows = await rpc("consume_kingshot_api_key", { p_key_hash: hashKey(rawKey) });
  const key = rows[0];
  if (!key) {
    res.status(401).json({ error: { code: "INVALID_API_KEY", message: "The supplied developer API key is invalid or inactive." } });
    return null;
  }

  if (!key.allowed) {
    res.setHeader("Retry-After", "86400");
    res.status(429).json({
      error: { code: "DAILY_LIMIT_EXCEEDED", message: "This API key has reached its daily request limit." },
      usage: { dailyRequests: key.daily_requests, dailyLimit: key.daily_limit }
    });
    return null;
  }

  return key;
}

export function apiHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Cache-Control", "no-store");
}
