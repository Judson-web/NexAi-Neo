import {rateLimit} from"../lib/request-rate-limit.js";

const SUPABASE_URL=process.env.SUPABASE_URL||"https://wocxvtptqapietlteshr.supabase.co";
const SUPABASE_KEY=process.env.SUPABASE_PUBLISHABLE_KEY||"sb_publishable_zF1yhk4TYTujQh8w5NyAJA_3H2K5CEg";
export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 if(!rateLimit(req,res,"support",6,60000))return res.status(429).json({error:"Too many support requests. Please try again shortly."});
 try{
  const body=req.body||{},playerId=String(body.playerId||"").trim(),reason=String(body.reason||"").trim().slice(0,1000);
  if(!/^[0-9]{5,20}$/.test(playerId))return res.status(400).json({error:"Enter a valid Player ID."});
  if(reason.length<5)return res.status(400).json({error:"Please provide a little more detail about the request."});
  const r=await fetch(SUPABASE_URL+"/rest/v1/rpc/submit_kingshot_support_ticket",{method:"POST",headers:{"apikey":SUPABASE_KEY,"authorization":"Bearer "+SUPABASE_KEY,"content-type":"application/json"},body:JSON.stringify({p_player_id:playerId,p_reason:reason}),signal:AbortSignal.timeout(8000)});
  const d=await r.json().catch(()=>null);
  if(!r.ok)return res.status(400).json({error:d?.message||"Could not submit the support request."});
  return res.status(200).json({ok:true,ticket:Array.isArray(d)?d[0]:d});
 }catch(e){return res.status(502).json({error:e.message||"Support service unavailable."})}
}
