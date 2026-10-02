import crypto from "node:crypto";

const SUPABASE_URL=process.env.SUPABASE_URL||"https://wocxvtptqapietlteshr.supabase.co";
const SUPABASE_KEY=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY;
const WEBHOOK_URL=process.env.DISCORD_KINGSHOT_WEBHOOK_URL||process.env.DISCORD_SCRAPER_WEBHOOK_URL;

export default async function handler(req,res){
 if(req.method!=="GET")return res.status(405).json({error:"Method not allowed"});
 if(!SUPABASE_KEY||!WEBHOOK_URL)return res.status(503).json({error:"Webhook test is not configured"});
 const token=String(req.query?.token||"");
 if(!/^[a-f0-9]{64}$/i.test(token))return res.status(401).json({error:"Unauthorized"});
 const hash=crypto.createHash("sha256").update(token).digest("hex");
 const check=await fetch(SUPABASE_URL+"/rest/v1/kingshot_webhook_test_tokens?token_hash=eq."+hash+"&select=id",{
  headers:{apikey:SUPABASE_KEY,authorization:"Bearer "+SUPABASE_KEY},
  signal:AbortSignal.timeout(8000)
 });
 if(!check.ok)return res.status(500).json({error:"Token validation failed"});
 const rows=await check.json().catch(()=>[]);
 if(!Array.isArray(rows)||!rows.length)return res.status(401).json({error:"Unauthorized"});
 const deleted=await fetch(SUPABASE_URL+"/rest/v1/kingshot_webhook_test_tokens?token_hash=eq."+hash,{
  method:"DELETE",
  headers:{apikey:SUPABASE_KEY,authorization:"Bearer "+SUPABASE_KEY},
  signal:AbortSignal.timeout(8000)
 });
 if(!deleted.ok)return res.status(500).json({error:"Could not consume test token"});
 const payload={
  username:"Kingshot Auto Redeem",
  allowed_mentions:{parse:[]},
  embeds:[{
   title:"🧪 Webhook test",
   description:"Production Discord webhook test from Kingshot Auto Redeem.",
   color:0x5865F2,
   fields:[
    {name:"Status",value:"Webhook request accepted by the production function.",inline:true},
    {name:"Source",value:"Manual test",inline:true}
   ],
   timestamp:new Date().toISOString(),
   footer:{text:"Kingshot Redeemer"}
  }]
 };
 try{
  const response=await fetch(WEBHOOK_URL,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload),signal:AbortSignal.timeout(8000)});
  const body=await response.text().catch(()=>"");
  if(!response.ok)return res.status(502).json({ok:false,status:response.status,response:body.slice(0,500)});
  return res.status(200).json({ok:true,status:response.status,message:"Webhook test sent successfully"});
 }catch(error){
  return res.status(502).json({ok:false,error:error?.message||"Webhook request failed"});
 }
}
