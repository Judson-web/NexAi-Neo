export default async function handler(req,res){
 if(req.method!=="GET")return res.status(405).json({error:"Method not allowed"});
 const id=String(req.query?.id||"").trim();
 if(!/^\\d{5,20}$/.test(id))return res.status(400).json({error:"Invalid player ID."});
 const key=process.env.MIGHTPULSE_API_KEY||process.env.KSS_API_KEY;
 if(!key)return res.status(503).json({error:"MightPulse API key is not configured on the server."});
 try{
  const r=await fetch("https://api.mightpulse.com/v1/players/"+encodeURIComponent(id)+"?include=base",{headers:{Authorization:"Bearer "+key},signal:AbortSignal.timeout(15000)});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)return res.status(r.status===404?404:502).json({error:d?.message||d?.error||"MightPulse could not find this player."});
  return res.status(200).json({player:d.player||d});
 }catch(e){return res.status(504).json({error:"MightPulse request timed out."})}
}
