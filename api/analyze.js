// =======================================================================
// /api/analyze — Vercel Serverless Function
// Proxies the item photo(s) + free-text request to an AI vision model and
// returns a structured list of suggested line items (name, qty, unit cost).
//
// Supports EITHER Anthropic OR OpenAI — set whichever key(s) you have in
// Vercel → Project → Settings → Environment Variables:
//
//   ANTHROPIC_API_KEY     your key from https://console.anthropic.com
//   ANTHROPIC_MODEL         optional, defaults to "claude-sonnet-5"
//                          (check https://docs.claude.com/en/docs/about-claude/models/overview)
//
//   OPENAI_API_KEY         your key from https://platform.openai.com/api-keys
//   OPENAI_MODEL            optional, defaults to "gpt-4.1-mini"
//                          (check https://platform.openai.com/docs/models for the
//                          current recommended vision-capable model — model names
//                          change often, verify before relying on the default here)
//
// If BOTH keys are set, Anthropic is tried first and OpenAI is used as an
// automatic fallback if the Anthropic call fails. Set AI_PROVIDER=openai to
// force OpenAI first instead.
// =======================================================================

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const MAX_IMAGES = 4;
const ALLOWED_MEDIA = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function buildPromptText(text, markupPercent) {
  return (
    'أنت مساعد فني لشركة iCOOL للتجارة والمقاولات (تكييف، طاقة شمسية، كهرباء، سباكة) في لبنان. ' +
    'الصور المرفقة قد تكون من نوعين: (أ) صور فوتوغرافية لبضائع/مواد فعلية — في هذه الحالة قدّر تكلفة الوحدة بناءً على أسعار السوق اللبناني التقريبية. ' +
    '(ب) صورة أو صفحات مستند (فاتورة أو عرض سعر من مورّد) تُظهر أسماء بنود وأسعارًا مكتوبة بوضوح — في هذه الحالة اقرأ واستخرج الاسم والكمية والسعر كما هو مكتوب بالضبط في المستند، ولا تُخمّن سعرًا مختلفًا عنه. ' +
    'استنتج أي النوعين تنطبق على كل صورة حسب محتواها. ' +
    'اقرأ أيضًا وصف الطلب النصي إن وُجد، واجمع كل ذلك في قائمة واحدة ببنود الفاتورة المقترحة. ' +
    'لكل بند أعطِ: name (اسم البند بالعربية، مختصر وواضح كما يُكتب في فاتورة فنية)، qty (الكمية كرقم)، ' +
    'unit_cost (تكلفة الوحدة بالدولار الأميركي كرقم — إما مقروءة حرفيًا من مستند المورّد، أو مقدَّرة من السوق إذا كانت صورة بضاعة فقط). ' +
    'لا تُضف نسبة الربح ولا الأجرة بنفسك، فهما ستُطبَّقان برمجيًا بعد ذلك على التكلفة التي تُعيدها. ' +
    'أعد الإجابة بصيغة JSON فقط دون أي نص إضافي قبله أو بعده وبدون Markdown، بالشكل التالي حرفيًا: ' +
    '{"items":[{"name":"...","qty":1,"unit_cost":0}], "notes":"ملاحظة قصيرة اختيارية بالعربية إن لزم، مثلاً إن كانت الأسعار مقروءة من مستند مورّد أو مقدَّرة من السوق"}. ' +
    '\n\nوصف الطلب من الفني:\n' + (text || '(لا يوجد وصف نصي، استند إلى الصور/المستند المرفق فقط)') +
    '\n\n(نسبة الزيادة المطلوبة على السعر: ' + markupPercent + '% — لمعلوماتك فقط، لا تُطبّقها في unit_cost).'
  );
}

function extractJson(raw) {
  const cleaned = String(raw || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

async function callAnthropic(images, promptText) {
  const content = images
    .map(img => ({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } }))
    .concat([{ type: 'text', text: promptText }]);

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 1500, messages: [{ role: 'user', content }] }),
  });
  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw Object.assign(new Error('anthropic_http_' + resp.status), { status: 502, detail: errText.slice(0, 500) });
  }
  const data = await resp.json();
  const textBlocks = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
  return extractJson(textBlocks);
}

async function callOpenAI(images, promptText) {
  const content = [{ type: 'text', text: promptText }].concat(
    images.map(img => ({ type: 'image_url', image_url: { url: 'data:' + img.mediaType + ';base64,' + img.data } }))
  );

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + process.env.OPENAI_API_KEY,
    },
    body: JSON.stringify({ model: OPENAI_MODEL, max_tokens: 1500, messages: [{ role: 'user', content }] }),
  });
  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw Object.assign(new Error('openai_http_' + resp.status), { status: 502, detail: errText.slice(0, 500) });
  }
  const data = await resp.json();
  const raw = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
  return extractJson(raw);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  if (!hasAnthropic && !hasOpenAI) {
    return res.status(500).json({
      error: 'لم يتم ضبط أي مفتاح ذكاء اصطناعي على السيرفر. أضف ANTHROPIC_API_KEY أو OPENAI_API_KEY (أو كليهما) من Vercel → Settings → Environment Variables ثم أعد النشر (Redeploy).',
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { return res.status(400).json({ error: 'JSON غير صالح' }); }
  }
  const text = (body && body.text) ? String(body.text).slice(0, 4000) : '';
  const markupPercent = Number(body && body.markupPercent) || 0;
  const rawImages = Array.isArray(body && body.images) ? body.images.slice(0, MAX_IMAGES) : [];
  const images = rawImages.filter(img => img && img.data && ALLOWED_MEDIA.has(img.mediaType));

  if (!text && images.length === 0) {
    return res.status(400).json({ error: 'أرسل نصًا أو صورة واحدة على الأقل' });
  }

  const promptText = buildPromptText(text, markupPercent);
  const preferOpenAiFirst = (process.env.AI_PROVIDER || '').toLowerCase() === 'openai';
  const attempts = [];
  if (preferOpenAiFirst) {
    if (hasOpenAI) attempts.push('openai');
    if (hasAnthropic) attempts.push('anthropic');
  } else {
    if (hasAnthropic) attempts.push('anthropic');
    if (hasOpenAI) attempts.push('openai');
  }

  let lastErr = null;
  for (const p of attempts) {
    try {
      const parsed = p === 'anthropic' ? await callAnthropic(images, promptText) : await callOpenAI(images, promptText);
      if (!Array.isArray(parsed.items)) parsed.items = [];
      parsed.items = parsed.items.slice(0, 40).map(it => ({
        name: String(it.name || '').slice(0, 120),
        qty: Number(it.qty) || 1,
        unit_cost: Math.max(0, Number(it.unit_cost) || 0),
      }));
      parsed._provider = p; // handy for debugging, not shown in the UI
      return res.status(200).json(parsed);
    } catch (err) {
      lastErr = err; // try next provider, if any
    }
  }

  return res.status((lastErr && lastErr.status) || 502).json({
    error: 'فشل الاتصال بخدمة الذكاء الاصطناعي (' + (lastErr ? lastErr.message : 'unknown') + ')',
    detail: lastErr && lastErr.detail,
  });
};
