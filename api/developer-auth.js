import{rateLimit}from"../lib/request-rate-limit.js";
import{auth,clearDeveloperCookies,errorMessage,setDeveloperSession}from"../lib/developer-user-auth.js";
const json=(res,status,data)=>res.status(status).json(data);
export default async function handler(req,res){
 if(!["GET","POST","DELETE"].includes(req.method))return json(res,405,{error:"Method not allowed"});
 try{
  if(req.method==="GET"){
   const {getDeveloperUser}=await import("../lib/developer-user-auth.js");const user=await getDeveloperUser(req,res);
   return json(res,200,{authenticated:Boolean(user),user:user?{id:user.id,email:user.email,emailConfirmed:Boolean(user.email_confirmed_at)}:null});
  }
  if(req.method==="DELETE"){
   const {cookies}=await import("../lib/developer-user-auth.js");const c=cookies(req);if(c.ks_dev_access)await auth("logout",{method:"POST",headers:{Authorization:"Bearer "+c.ks_dev_access}}).catch(()=>{});clearDeveloperCookies(res);return json(res,200,{ok:true});
  }
  if(!rateLimit(req,res,"developer-auth",12,60000))return json(res,429,{error:"Too many authentication attempts. Please wait a minute."});
  const body=req.body||{},action=String(body.action||"").toLowerCase(),email=String(body.email||"").trim().toLowerCase(),password=String(body.password||"");
  if(!email||!/^\S+@\S+\.\S+$/.test(email))return json(res,400,{error:"Enter a valid email address."});
  if(action==="signup"){
   if(password.length<8)return json(res,400,{error:"Use a password with at least 8 characters."});
   const {r,d}=await auth("signup",{method:"POST",body:JSON.stringify({email,password})});
   if(!r.ok)return json(res,r.status>=400&&r.status<500?r.status:502,{error:errorMessage(d,"Could not create your developer account.")});
   if(d?.access_token&&d?.refresh_token)setDeveloperSession(res,d);
   return json(res,200,{ok:true,authenticated:Boolean(d?.access_token),confirmationRequired:!d?.access_token,email});
  }
  if(action==="login"){
   const {r,d}=await auth("token?grant_type=password",{method:"POST",body:JSON.stringify({email,password})});
   if(!r.ok)return json(res,r.status===400?401:502,{error:errorMessage(d,"Invalid email or password.")});
   if(!d?.access_token||!d?.refresh_token)return json(res,403,{error:"Please verify your email address before signing in."});
   setDeveloperSession(res,d);return json(res,200,{ok:true,user:{id:d.user?.id,email:d.user?.email,emailConfirmed:Boolean(d.user?.email_confirmed_at)}});
  }
  return json(res,400,{error:"Unknown authentication action."});
 }catch(e){return json(res,502,{error:e.message||"Developer authentication is unavailable."})}
}
