export default async function handler(req,res){
  if(req.method!=="GET")return res.status(405).json({error:"Method not allowed."});
  const id=String(req.query.id||"").trim();
  const hash=String(req.query.hash||"").trim();
  const format=String(req.query.format||"png").toLowerCase()==="gif"?"gif":"png";
  if(!/^\d{15,22}$/.test(id)||!/^[a-zA-Z0-9_]{20,80}$/.test(hash))return res.status(400).json({error:"Invalid avatar."});
  const url=`https://cdn.discordapp.com/avatars/${id}/${hash}.${format}?size=1024`;
  try{
    const r=await fetch(url,{headers:{Accept:"image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"}});
    if(!r.ok)return res.status(r.status===404?404:502).json({error:"Avatar image is unavailable."});
    const type=r.headers.get("content-type")||`image/${format}`;
    const data=Buffer.from(await r.arrayBuffer());
    res.setHeader("Content-Type",type);
    res.setHeader("Cache-Control","public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800");
    res.setHeader("Content-Length",String(data.length));
    return res.status(200).send(data);
  }catch(e){console.error("discord-avatar",e);return res.status(502).json({error:"Could not load the avatar right now."})}
}