import {redeemKingshot} from"../lib/kingshot-redeem.js";
import {rateLimit} from"../lib/request-rate-limit.js";

export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 if(!rateLimit(req,res,"redeem",12,60000))return res.status(429).json({error:"Too many redemption requests. Please try again shortly."});
 const result=await redeemKingshot(req.body||{});
 return res.status(result.httpStatus).json(result.error?{error:result.error}:{ok:result.ok,status:result.status,statusLabel:result.statusLabel,message:result.message,errCode:result.errCode});
}
