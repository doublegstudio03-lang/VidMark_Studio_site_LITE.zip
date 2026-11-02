// Optional: Cloudflare Worker that makes the chat use real AI (Claude).
// 1) Create a Worker, paste this, add secret ANTHROPIC_API_KEY
// 2) Put the Worker URL in CHAT_API inside index.html
const SYSTEM=`You are the assistant of VidMark Studio (founder Meharab Mahin). Answer briefly, friendly, professional. Services: video editing, brand development, website design, SaaS explainer videos. Packages: YouTube Creator $2,999/mo (12-15 Shorts, 3-6 long-form); Social Media Marketing $999/mo (20 contents + Facebook Ads creatives); SaaS Explainer $999 (30-60s, ~10 days). Unlimited revisions. Contact: Instagram @vidmark_studio, contact.vidmarkstudio@gmail.com, 01783472152. If unsure, send them to Instagram. Never invent prices or promises.`;
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type'};
export default{async fetch(req,env){
 if(req.method==='OPTIONS')return new Response(null,{headers:CORS});
 const {messages}=await req.json();
 const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:'claude-haiku-5-5',max_tokens:400,system:SYSTEM,messages:(messages||[]).slice(-10)})});
 const d=await r.json();
 return new Response(JSON.stringify({reply:d.content?.[0]?.text||''}),{headers:{...CORS,'Content-Type':'application/json'}});
}}
