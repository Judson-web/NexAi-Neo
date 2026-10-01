import crypto from"node:crypto";
import{getDeveloperUser}from"../lib/developer-user-auth.js";
const SUPABASE_URL=process.env.SUPABASE_URL||"https://wocxvtptqapietlteshr.supabase.co";
const SUPABASE_KEY=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY;
async function db(path,options={}){if(!SUPABASE_KEY)throw Error("Developer key service is not configured.");const r=await fetch(SUPABASE_URL+"/rest/v1/"+path,{...options,headers:{"apikey":SUPABASE_KEY,"authorization":"Bearer "+SUPABASE_KEY,"content-type":"application/json",Prefer:"return=representation",...(options.headers||{})},signal:AbortSignal.timeout(8000)});const d=await r.json().catch(()=>null);if(!r.ok)throw Error(d?.message||"Developer key service unavailable.");return d}
const hash=v=>crypto.createHash("sha256").update(String(v)).digest("hex");
const makeKey=()=> "ks_live_"+crypto.randomBytes(32).toString("base64url");
const cors=res=>{res.setHeader("Access-Control-Allow-Origin",process.env.DEVELOPER_CORS_ORIGIN||"https://kingshot-autoredeemer.vercel.app");res.setHeader("Vary","Origin");res.setHeader("Access-Control-Allow-Headers","Content-Type");res.setHeader("Access-Control-Allow-Methods","GET, POST, DELETE, OPTIONS");res.setHeader("Cache-Control","no-store")};
const originAllowed=req=>{const origin=String(req.headers.origin||"");if(!origin)return true;const allowed=String(process.env.DEVELOPER_APP_ORIGIN||"https://kingshot-autoredeemer.vercel.app").replace(/\/$/,"");return origin===allowed};
export default async function handler(req,res){
 cors(res);
 if(req.method==="OPTIONS")return res.status(204).end();
 if(!["GET","POST","DELETE"].includes(req.method))return res.status(405).json({error:"Method not allowed"});
 try{
  const user=await getDeveloperUser(req,res);if(!user)return res.status(401).json({error:"Authentication required."});
  if(!originAllowed(req))return res.status(403).json({error:"Cross-origin developer key requests are not allowed."});
  if(req.method==="GET"){
   const rows=await db("kingshot_api_keys?select=id,name,key_prefix,active,requests_per_minute,daily_limit,total_requests,last_used_at,created_at&owner_user_id=eq."+encodeURIComponent(user.id)+"&order=created_at.desc");
   return res.status(200).json({keys:(rows||[]).map(k=>({...k,key_mask:k.key_prefix+"••••••••"}))});
  }
  if(req.method==="POST"){
   const body=req.body||{},name=String(body.name||"").trim().slice(0,80)||"Untitled project";
   const existing=await db("kingshot_api_keys?select=id&owner_user_id=eq."+encodeURIComponent(user.id)+"&active=eq.true");
   if((existing||[]).length>=3)return res.status(409).json({error:"You can have up to 3 active API keys."});
   const raw=makeKey(),row=(await db("kingshot_api_keys",{method:"POST",body:JSON.stringify({name,key_prefix:raw.slice(0,18),key_hash:hash(raw),owner_user_id:user.id,active:true,requests_per_minute:2,daily_limit:100,total_requests:0})}))[0];
   return res.status(201).json({ok:true,key:raw,keyRecord:{id:row.id,name:row.name,key_prefix:row.key_prefix,requests_per_minute:row.requests_per_minute,daily_limit:row.daily_limit,created_at:row.created_at}});
  }
  const id=String(req.body?.id||req.query?.id||"");if(!/^[0-9a-f-]{36}$/.test(id))return res.status(400).json({error:"Invalid API key."});
  const rows=await db("kingshot_api_keys?id=eq."+encodeURIComponent(id)+"&owner_user_id=eq."+encodeURIComponent(user.id)+"&select=id,active");if(!rows?.length)return res.status(404).json({error:"API key not found."});
  if(!rows[0].active)return res.status(409).json({error:"API key is already revoked."});
  await db("kingshot_api_keys?id=eq."+encodeURIComponent(id)+"&owner_user_id=eq."+encodeURIComponent(user.id),{method:"PATCH",body:JSON.stringify({active:false,updated_at:new Date().toISOString()})});
  return res.status(200).json({ok:true});
 }catch(e){return res.status(502).json({error:e.message||"Could not manage API keys."})}
}