import crypto from"node:crypto";
import {rateLimit} from"../lib/request-rate-limit.js";
const SUPABASE_URL=process.env.SUPABASE_URL||"https://wocxvtptqapietlteshr.supabase.co";
const SUPABASE_KEY=process.env.SUPABASE_PUBLISHABLE_KEY||"sb_publishable_zF1yhk4TYTujQh8w5NyAJA_3H2K5CEg";
const COOKIE="ks_admin_session";
function hash(value){return crypto.createHash("sha256").update(String(value)).digest("hex")}
function token(){return crypto.randomBytes(32).toString("hex")}
function getCookie(req){const raw=String(req.headers.cookie||"");const part=raw.split(";").map(x=>x.trim()).find(x=>x.startsWith(COOKIE+"="));return part?decodeURIComponent(part.slice(COOKIE.length+1)):""}
function setCookie(res,value,maxAge){res.setHeader("Set-Cookie",COOKIE+"="+encodeURIComponent(value)+"; Max-Age="+maxAge+"; Path=/; HttpOnly; Secure; SameSite=Strict")}
async function rpc(name,body){const r=await fetch(SUPABASE_URL+"/rest/v1/rpc/"+name,{method:"POST",headers:{"apikey":SUPABASE_KEY,"authorization":"Bearer "+SUPABASE_KEY,"content-type":"application/json"},body:JSON.stringify(body),signal:AbortSignal.timeout(8000)});const d=await r.json().catch(()=>null);if(!r.ok)throw Error(d?.message||"Admin service unavailable.");return d}
export default async function handler(req,res){
 if(!["POST","DELETE"].includes(req.method))return res.status(405).json({error:"Method not allowed"});
 try{
  if(req.method==="DELETE"){const session=getCookie(req);if(session)await rpc("kingshot_admin_logout",{p_token_hash:hash(session)}).catch(()=>{});setCookie(res,"",0);return res.status(200).json({ok:true})}
  if(!rateLimit(req,res,"admin-login",5,900000))return res.status(429).json({error:"Too many login attempts. Please try again later."});
  const body=req.body||{},email=String(body.email||"").trim().toLowerCase(),password=String(body.password||"");
  if(!email||!password)return res.status(400).json({error:"Email and password are required."});
  const session=token();
  const ok=await rpc("kingshot_admin_create_session",{p_email:email,p_password_hash:hash(password),p_token_hash:hash(session)});
  if(!ok)return res.status(401).json({error:"Invalid admin credentials."});
  setCookie(res,session,43200);
  return res.status(200).json({ok:true});
 }catch(e){return res.status(502).json({error:e.message||"Admin authentication failed."})}
}
