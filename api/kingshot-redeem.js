import crypto from"node:crypto";
const clean=s=>String(s??"").replace(/[\\u0000-\\u001F\\u007F]/g,"").trim();
const labels={SUCCESS:["Redeemed successfully.","Your gift rewards should be available in-game."],RECEIVED:["Already received.","This account has already claimed this code."],"SAME TYPE EXCHANGE":["Already claimed.","The code was already redeemed for this reward type."],TIME_ERROR:["Code expired.","This gift code is no longer valid."],CDK_NOT_FOUND:["Code not found.","Check the gift code and try again."],USAGE_LIMIT:["Usage limit reached.","This gift code has reached its redemption limit."],ROLE_NOT_EXIST:["Player not found.","The Player ID and kingdom could not be resolved."],STATE_MISMATCH:["Kingdom mismatch.","The supplied kingdom does not match this player."],SIGN_ERROR:["Redemption unavailable.","The upstream signature was rejected."],TIMEOUT_RETRY:["Try again shortly.","The gift service is rate-limiting or temporarily unavailable."]};
export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 const body=req.body||{};const fid=clean(body.playerId),code=clean(body.code),kid=clean(body.kid);
 if(!/^\d{5,20}$/.test(fid)||!/^\d{1,8}$/.test(kid)||!/^[A-Za-z0-9_-]{1,64}$/.test(code))return res.status(400).json({error:"Invalid player ID, kingdom, or gift code."});
 const secret=process.env.KINGSHOT_API_SECRET;if(!secret)return res.status(503).json({error:"Kingshot redemption secret is not configured on the server."});
 const payload={fid,cdk:code,kid,time:String(Math.floor(Date.now()/1000))};
 const encoded=Object.keys(payload).sort().map(k=>k+"="+payload[k]).join("&");
 const sign=crypto.createHash("md5").update(encoded+secret).digest("hex");
 try{
  const r=await fetch("https://kingshot-giftcode.centurygame.com/api/gift_code",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded","user-agent":"Mozilla/5.0"},body:new URLSearchParams({...payload,sign}),signal:AbortSignal.timeout(30000)});
  const d=await r.json().catch(()=>({}));
  if([429,502,503,504].includes(r.status))return res.status(503).json({error:"Kingshot is rate-limiting or temporarily unavailable. Try again shortly."});
  const msg=String(d.msg||"Unknown Error").replace(/\.$/,"").toUpperCase();
  let status=msg;
  if(msg==="RECEIVED"&&d.err_code===40008)status="RECEIVED";
  if(msg==="SAME TYPE EXCHANGE"&&d.err_code===40011)status="SAME TYPE EXCHANGE";
  if(msg==="TIME ERROR"&&d.err_code===40007)status="TIME_ERROR";
  if(msg==="CDK NOT FOUND"&&d.err_code===40014)status="CDK_NOT_FOUND";
  if(msg==="USED"&&d.err_code===40005)status="USAGE_LIMIT";
  if(msg==="TOO FREQUENT"&&d.err_code===40019)status="TIMEOUT_RETRY";
  if(msg==="NOT LOGIN")status="LOGIN_EXPIRED_MID_PROCESS";
  if(d.err_code===40001&&msg.toLowerCase().includes("NOT EXIST"))status="ROLE_NOT_EXIST";
  const [statusLabel,message]=labels[status]||[status,"Kingshot returned: "+msg];
  const ok=["SUCCESS","RECEIVED","SAME TYPE EXCHANGE"].includes(status);
  return res.status(ok?200:400).json({ok,status,statusLabel,message,errCode:d.err_code??null});
 }catch(e){return res.status(504).json({error:"Kingshot redemption request timed out."})}
}
