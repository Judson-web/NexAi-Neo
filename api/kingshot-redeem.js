import {redeemKingshot} from"../lib/kingshot-redeem.js";
import crypto from"node:crypto";
const SUPABASE_URL=process.env.SUPABASE_URL||"https://wocxvtptqapietlteshr.supabase.co";
const SUPABASE_KEY=process.env.SUPABASE_PUBLISHABLE_KEY||"sb_publishable_zF1yhk4TYTujQh8w5NyAJA_3H2K5CEg";
async function rpc(name,body){const r=await fetch(SUPABASE_URL+"/rest/v1/rpc/"+name,{method:"POST",headers:{apikey:SUPABASE_KEY,authorization:"Bearer "+SUPABASE_KEY,"content-type":"application/json"},body:JSON.stringify(body),signal:AbortSignal.timeout(5000)});const d=await r.json().catch(()=>null);if(!r.ok)throw Error(d?.message||"Rate-limit service unavailable.");return Array.isArray(d)?d[0]:d}
function clientKey(req){const ip=String(req.headers["x-forwarded-for"]||req.headers["x-real-ip"]||"").split(",")[0].trim();const ua=String(req.headers["user-agent"]||"").slice(0,200);const day=new Date().toISOString().slice(0,10);return crypto.createHash("sha256").update(ip+"|"+ua+"|"+day+"|"+(process.env.KINGSHOT_API_SECRET||"rate")).digest("hex")}
export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 try{const limit=await rpc("check_kingshot_redeem_rate_limit",{p_bucket_key:clientKey(req),p_window_seconds:60,p_max_requests:10});if(!limit?.allowed){res.setHeader("Retry-After",String(limit.retry_after||60));return res.status(429).json({error:"Too many redemption requests. Please try again shortly."})}}catch(e){return res.status(503).json({error:"Redemption service is temporarily unavailable. Please try again shortly."})}
 const result=await redeemKingshot(req.body||{});
 return res.status(result.httpStatus).json(result.error?{error:result.error}:{ok:result.ok,status:result.status,statusLabel:result.statusLabel,message:result.message,errCode:result.errCode});
}
