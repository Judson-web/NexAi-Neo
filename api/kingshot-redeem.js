import {redeemKingshot} from"../lib/kingshot-redeem.js";

export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 const result=await redeemKingshot(req.body||{});
 return res.status(result.httpStatus).json(result.error?{error:result.error}:{
  ok:result.ok,status:result.status,statusLabel:result.statusLabel,message:result.message,errCode:result.errCode
 });
}
