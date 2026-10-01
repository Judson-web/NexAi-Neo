import crypto from"node:crypto";
import{rateLimit}from"../lib/request-rate-limit.js";
import{auth,clearDeveloperCookies,errorMessage,setDeveloperSession,getDeveloperUser,cookies}from"../../lib/developer-user-auth.js";
const json=(res,status,data)=>res.status(status).json(data);
const originAllowed=req=>{const origin=String(req.headers.origin||"");if(!origin)return true;const allowed=String(process.env.DEVELOPER_APP_ORIGIN||"https://kingshot-autoredeemer.vercel.app").replace(/\/$/,"");return origin===allowed};
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(!["GET","POST","DELETE"].includes(req.method))return json(res,405,{error:"Method not allowed"});
 try{
  if(req.method==="GET"){const user=await getDeveloperUser(req,res);return json(res,200,{authenticated:Boolean(user),user:user?{id:user.id,email:user.email,emailConfirmed:Boolean(user.email_confirmed_at)}:null});}
  if(!originAllowed(req))return json(res,403,{error:"Cross-origin developer account requests are not allowed."});
  if(req.method==="DELETE"){const c=cookies(req);if(c["__Host-ks_dev_access"])await auth("logout",{method:"POST",headers:{Authorization:"Bearer "+c["__Host-ks_dev_access"]}}).catch(()=>{});clearDeveloperCookies(res);return json(res,200,{ok:true});}
  if(!rateLimit(req,res,"developer-auth-ip",12,60000))return json(res,429,{error:"Too many authentication attempts. Please wait a minute."});
  const body=req.body||{},action=String(body.action||"").toLowerCase(),email=String(body.email||"").trim().toLowerCase(),password=String(body.password||"");
  if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json(res,400,{error:"Enter a valid email address."});
  const emailKey=crypto.createHash("sha256").update(email).digest("hex").slice(0,24);
  if(!rateLimit(req,res,"developer-auth-email:"+emailKey,6,60000))return json(res,429,{error:"Too many attempts for this account. Please wait a minute."});
  if(action==="signup"){
   if(password.length<10)return json(res,400,{error:"Use a password with at least 10 characters."});
   const {r,d}=await auth("signup",{method:"POST",body:JSON.stringify({email,password})});
   if(!r.ok)return json(res,r.status>=400&&r.status<500?r.status:502,{error:errorMessage(d,"Could not create your developer account.")});
   if(d?.access_token&&d?.refresh_token&&d?.user?.email_confirmed_at)setDeveloperSession(res,d);
   return json(res,200,{ok:true,authenticated:Boolean(d?.access_token&&d?.user?.email_confirmed_at),confirmationRequired:!d?.user?.email_confirmed_at,email});
  }
  if(action==="login"){
   const {r,d}=await auth("token?grant_type=password",{method:"POST",body:JSON.stringify({email,password})});
   if(!r.ok)return json(res,r.status===400?401:502,{error:"Invalid email or password."});
   if(!d?.access_token||!d?.refresh_token||!d?.user?.email_confirmed_at)return json(res,403,{error:"Please verify your email address before signing in."});
   setDeveloperSession(res,d);return json(res,200,{ok:true,user:{id:d.user.id,email:d.user.email,emailConfirmed:true}});
  }
  return json(res,400,{error:"Unknown authentication action."});
 }catch(e){return json(res,502,{error:e.message||"Developer authentication is unavailable."})}
}