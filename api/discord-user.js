export default async function handler(req,res){
  const id=String(req.query.id||"").trim();
  if(!/^\d{15,22}$/.test(id))return res.status(400).json({error:"That is not a valid Discord user ID."});
  const token=process.env.DISCORD_BOT_TOKEN;
  if(!token)return res.status(503).json({error:"Discord API access is not configured on this deployment yet. Add DISCORD_BOT_TOKEN in Vercel project environment variables."});
  try{
    const r=await fetch("https://discord.com/api/v10/users/"+id,{headers:{Authorization:"Bot "+token,Accept:"application/json"}});
    const d=await r.json();
    if(!r.ok)return res.status(r.status===404?404:502).json({error:r.status===404?"Discord user not found.":"Discord API request failed."});
    if(!d.avatar)return res.status(404).json({error:"This user does not have a custom Discord avatar."});
    const animated=d.avatar.startsWith("a_"),format=animated?"gif":"png";
    const avatarUrl="https://cdn.discordapp.com/avatars/"+d.id+"/"+d.avatar+"."+format+"?size=1024";
    return res.status(200).json({id:d.id,username:d.username,globalName:d.global_name||null,discriminator:d.discriminator||"0",avatar:d.avatar,animated,format,avatarUrl});
  }catch(e){console.error(e);return res.status(502).json({error:"Could not reach Discord right now."})}
}