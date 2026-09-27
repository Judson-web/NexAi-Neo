export default async function handler(req,res){
  if(req.method!="GET")return res.status(405).json({error:"Method not allowed."});
  const id=String(req.query.id||"").trim();
  if(!/^\\d{15,22}$/.test(id))return res.status(400).json({error:"Enter a valid Discord user ID."});
  const token=process.env.DISCORD_BOT_TOKEN;
  if(!token)return res.status(503).json({error:"Discord API access is not configured."});
  try{
    const r=await fetch("https://discord.com/api/v10/users/"+id,{headers:{Authorization:"Bot "+token,Accept:"application/json"}});
    const d=await r.json().catch(()=>({}));
    if(!r.ok){
      if(r.status===404)return res.status(404).json({error:"Discord user not found."});
      if(r.status===429)return res.status(429).setHeader("Retry-After",r.headers.get("retry-after")||"1").json({error:"Discord rate limit reached. Try again shortly."});
      return res.status(502).json({error:"Discord API request failed."});
    }
    if(!d.avatar)return res.status(404).json({error:"This user does not have a custom avatar."});
    const animated=d.avatar.startsWith("a_"),format=animated?"gif":"png";
    const avatarUrl=`https://cdn.discordapp.com/avatars/${d.id}/${d.avatar}.${format}?size=1024`;
    res.setHeader("Cache-Control","public, s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({id:d.id,username:d.username,globalName:d.global_name||null,avatar:d.avatar,animated,format,avatarUrl});
  }catch(e){console.error("discord-user",e);return res.status(502).json({error:"Could not reach Discord right now."})}
}