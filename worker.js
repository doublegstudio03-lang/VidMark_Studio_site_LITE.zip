// Cloudflare Worker: makes the website chat answer ANYTHING with real AI (Claude).
//
// Setup (about 5 minutes):
// 1) Cloudflare dashboard > Workers & Pages > Create Worker > paste this file > Deploy.
// 2) Worker > Settings > Variables and Secrets > add a SECRET named ANTHROPIC_API_KEY
//    (get the key at console.anthropic.com). NEVER put the key inside index.html.
// 3) Optional: add a variable ALLOWED_ORIGIN = https://your-website.com so only your site can use it.
// 4) Copy the Worker URL and paste it into  const CHAT_API=""  near the end of index.html.
// If the Worker is down or the key runs out, the chat automatically falls back to the built-in replies.

const SYSTEM = `You are the friendly chat assistant on the VidMark Studio website (founder: Meharab Mahin).

How to chat:
- You can talk about anything helpful: greetings and small talk (reply to "hello" with a greeting, to "how are you" with a warm answer), business and startup ideas, video/content ideas, marketing, freelancing, and general questions.
- Reply in the same language and style as the visitor (English, Bangla, or Banglish written in English letters).
- Keep replies short and practical: usually 2-6 sentences. For business ideas, give 3 concrete options with one line on how to start each, and remind them to test with real customers first.
- Be honest. You are an AI assistant. Never invent facts, guarantees, earnings or promises. If you don't know something, say so.
- Mention VidMark services only when relevant and naturally; don't force a sales pitch.
- Politely decline harmful, illegal or explicit requests.

VidMark Studio facts (use only these for prices and services):
- Services: video editing, brand development, website design, SaaS explainer videos. Also Shorts/Reels, UGC, talking-head, gaming, real-estate and documentary edits.
- Video packages (unlimited revisions): YouTube Creator $2,999/mo (12-15 Shorts + 3-6 long-form); Social Media Marketing $999/mo (20 contents + Facebook Ads creatives); SaaS Explainer $999 (30-60 sec, about 10 days).
- Website design: from $135 (Landing Page) up to $1,600 (Custom Web App / SaaS MVP); domain and hosting included; final price depends on scope.
- Team: 8+ video editors, 3+ web designers, 4 SaaS video experts, 2 brand strategists, 1 project manager.
- Location: Bangladesh. Contact: Instagram @vidmark_studio (fastest), contact.vidmarkstudio@gmail.com, 01783472152.
- For anything about VidMark you are unsure of (custom quotes, schedules), send them to Instagram.`;

export default {
  async fetch(req, env) {
    const origin = env.ALLOWED_ORIGIN || '*';
    const CORS = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin'
    };
    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (req.method !== 'POST') return json({ reply: '' }, 405);

    try {
      const body = await req.json();
      // keep only valid roles, trim lengths, last 10 turns, must start with a user message
      let messages = (Array.isArray(body.messages) ? body.messages : [])
        .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
        .map(m => ({ role: m.role, content: m.content.slice(0, 600) }))
        .slice(-10);
      while (messages.length && messages[0].role !== 'user') messages.shift();
      if (!messages.length) return json({ reply: '' });

      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ model: 'claude-haiku-5-5', max_tokens: 500, system: SYSTEM, messages })
      });
      if (!r.ok) return json({ reply: '' });          // widget falls back to built-in answers
      const d = await r.json();
      const text = (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
      return json({ reply: text });
    } catch (e) {
      return json({ reply: '' });
    }
  }
};
