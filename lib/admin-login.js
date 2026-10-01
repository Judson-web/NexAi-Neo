import crypto from"node:crypto";
import {rateLimit} from"../lib/request-rate-limit.js";
const SUPABASE_URL=process.env.SUPABASE_URL||"https://wocxvtptqapietlteshr.supabase.co";
const SUPABASE_KEY=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY;
const COOKIE="__Host-ks_admin_session",FALLBACK_COOKIE="ks_admin_session";
function hash(value){return crypto.createHash("sha256").update(String(value)).digest("hex")}
function token(){return crypto.randomBytes(32).toString("hex")}
function getCookie(req){const raw=String(req.headers.cookie||"");const parts=raw.split(";").map(x=>x.trim());for(const name of [COOKIE,FALLBACK_COOKIE]){const part=parts.find(x=>x.startsWith(name+"="));if(part)return decodeURIComponent(part.slice(name.length+1))}return""}
function setCookie(res,value,maxAge){const v=encodeURIComponent(value);const base="; Max-Age="+maxAge+"; Path=/; HttpOnly; Secure; SameSite=Strict";const fallback="; Max-Age="+maxAge+"; Path=/; HttpOnly; Secure; SameSite=Lax";res.setHeader("Set-Cookie",[COOKIE+"="+v+base,FALLBACK_COOKIE+"="+v+fallback])}
async function rpc(name,body){const r=await fetch(SUPABASE_URL+"/rest/v1/rpc/"+name,{method:"POST",headers:{"apikey":SUPABASE_KEY,"authorization":"Bearer "+SUPABASE_KEY,"content-type":"application/json"},body:JSON.stringify(body),signal:AbortSignal.timeout(8000)});const d=await r.json().catch(()=>null);if(!r.ok)throw Error(d?.message||"Admin service unavailable.");return d}
export default async function handler(req,res){
 res.setHeader("Cache-Control","private, no-store");
 if(!["POST","DELETE"].includes(req.method))return res.status(405).json({error:"Method not allowed"});
 try{
  if(req.method==="DELETE"){const session=getCookie(req);if(session)await rpc("kingshot_admin_logout",{p_token_hash:hash(session)}).catch(()=>{});setCookie(res,"",0);return res.status(200).json({ok:true})}
  if(!rateLimit(req,res,"admin-login",5,900000))return res.status(429).json({error:"Too many login attempts. Please try again later."});
  const body=req.body||{},email=String(body.email||"").trim().toLowerCase(),password=String(body.password||"");
  if(!email||!password)return res.status(400).json({error:"Email and password are required."});
  const session=token();
  const ok=await rpc("kingshot_admin_create_session",{p_email:email,p_password_hash:password,p_token_hash:hash(session)});
  if(!ok)return res.status(401).json({error:"Invalid admin credentials."});
  setCookie(res,session,43200);
  return res.status(200).json({ok:true});
 }catch(e){return res.status(502).json({error:e.message||"Admin authentication failed."})}
}
