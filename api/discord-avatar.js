export default async function handler(req,res){
  if(req.method!=="GET")return res.status(405).json({error:"Method not allowed."});
  const id=String(req.query.id||"").trim();
  const hash=String(req.query.hash||"").trim();
  const requestedFormat=String(req.query.format||"png").toLowerCase();
  const format=["png","jpg","jpeg","webp","gif"].includes(requestedFormat)?(requestedFormat==="jpeg"?"jpg":requestedFormat):"png";
  const size=Number(req.query.size||1024);
  const allowedSizes=[16,32,64,128,256,512,1024,2048,4096];
  if(!/^\d{15,22}$/.test(id)||!/^[a-zA-Z0-9_]{20,80}$/.test(hash)||!allowedSizes.includes(size))return res.status(400).json({error:"Invalid avatar request."});
  const url=`https://cdn.discordapp.com/avatars/${id}/${hash}.${format}?size=${size}`;
  try{
    const r=await fetch(url,{headers:{Accept:"image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"}});
    if(!r.ok)return res.status(r.status===404?404:502).json({error:"Avatar image is unavailable in that format."});
    const type=r.headers.get("content-type")||`image/${format}`;
    const data=Buffer.from(await r.arrayBuffer());
    res.setHeader("Content-Type",type);
    res.setHeader("Cache-Control","public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800");
    res.setHeader("Content-Length",String(data.length));
    return res.status(200).send(data);
  }catch(e){console.error("discord-avatar",e);return res.status(502).json({error:"Could not load the avatar right now."})}
}