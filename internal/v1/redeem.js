import{redeemKingshot}from"../../lib/kingshot-redeem.js";
import{rateLimit}from"../../lib/request-rate-limit.js";
import{apiHeaders,authenticateDeveloper,createRequestId}from"../../lib/developer-api.js";
export default async function handler(req,res){
 const requestId=createRequestId();res.setHeader("X-Request-Id",requestId);res.setHeader("X-API-Version","1");apiHeaders(res);
 if(req.method==="OPTIONS")return res.status(204).end();
 if(req.method!=="POST")return res.status(405).json({error:{code:"METHOD_NOT_ALLOWED",message:"Use POST /api/v1/redeem."},requestId});
 if(!rateLimit(req,res,"developer-api-redeem",60,60000))return res.status(429).json({error:{code:"RATE_LIMITED",message:"Too many requests. Please try again shortly."},requestId});
 let key;try{key=await authenticateDeveloper(req,res)}catch{return res.status(503).json({error:{code:"AUTH_SERVICE_UNAVAILABLE",message:"Developer authentication is temporarily unavailable."},requestId})}
 if(!key)return;
 const body=req.body||{},playerId=String(body.playerId??"").trim(),kingdomId=String(body.kingdomId??body.kid??"").trim(),code=String(body.code??"").trim();
 if(!/^\d{4,32}$/.test(playerId)||!/^\d{1,8}$/.test(kingdomId)||!/^[A-Za-z0-9_-]{3,64}$/.test(code))return res.status(400).json({error:{code:"INVALID_REQUEST",message:"playerId, kingdomId and code have an invalid format."},requestId});
 const result=await redeemKingshot({playerId,code,kid:kingdomId});
 if(result.error)return res.status(result.httpStatus).json({error:{code:result.errorCategory||"REDEEM_ERROR",message:result.error},requestId});
 return res.status(result.httpStatus).json({ok:result.ok,status:result.status,statusLabel:result.statusLabel,message:result.message,errCode:result.errCode,requestId});
}