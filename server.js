// WordBridge backend - Node.js + Express
const express = require('express');
const path = require('path');

const LANGS = {en:'English',es:'Spanish',fr:'French',de:'German',it:'Italian',pt:'Portuguese',hi:'Hindi',te:'Telugu',ta:'Tamil',kn:'Kannada',ml:'Malayalam',mr:'Marathi',bn:'Bengali',gu:'Gujarati',pa:'Punjabi',ur:'Urdu',ar:'Arabic','zh-CN':'Chinese',ja:'Japanese',ko:'Korean',ru:'Russian',tr:'Turkish',nl:'Dutch',pl:'Polish',sv:'Swedish',th:'Thai',vi:'Vietnamese',id:'Indonesian',el:'Greek',he:'Hebrew',uk:'Ukrainian',fa:'Persian',sw:'Swahili',ne:'Nepali'};
const MAX_CHARS = 5000;
const CHUNK = 450;

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Simple rate limit: 60 requests per minute per IP
const hits = new Map();
app.use('/api', (req, res, next) => {
  const now = Date.now();
  const recent = (hits.get(req.ip) || []).filter(t => now - t < 60000);
  recent.push(now);
  hits.set(req.ip, recent);
  if (recent.length > 60) return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
  next();
});
setInterval(() => hits.clear(), 10 * 60 * 1000).unref();

// Split long text into small parts (by sentence)
function splitText(text, max) {
  const sentences = text.match(/[^.!?\n]+[.!?\n]*\s*/g) || [text];
  const parts = [];
  for (let s of sentences) {
    while (s.length > max) { parts.push(s.slice(0, max)); s = s.slice(max); }
    if (parts.length && (parts[parts.length - 1] + s).length <= max) parts[parts.length - 1] += s;
    else parts.push(s);
  }
  return parts.filter(p => p.trim());
}

// Engine 1: Google (no key needed)
async function viaGoogle(q, sl, tl) {
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=' + sl + '&tl=' + tl + '&q=' + encodeURIComponent(q);
  const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error('Google engine error ' + r.status);
  const d = await r.json();
  return { text: d[0].map(x => x[0]).join(''), detected: d[2] || '' };
}

// Engine 2 (backup): MyMemory
async function viaMyMemory(q, sl, tl) {
  const pair = (sl === 'auto' ? 'Autodetect' : sl) + '|' + tl;
  const url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(q) + '&langpair=' + encodeURIComponent(pair);
  const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
  const d = await r.json();
  if (String(d.responseStatus) !== '200') throw new Error(d.responseDetails || 'MyMemory engine error');
  return { text: d.responseData.translatedText, detected: (d.responseData.detectedLanguage || '').slice(0, 2) };
}

async function translatePart(q, sl, tl) {
  try { return await viaGoogle(q, sl, tl); }
  catch (e1) { return await viaMyMemory(q, sl, tl); }
}

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.get('/api/languages', (req, res) => res.json(LANGS));

app.post('/api/translate', async (req, res) => {
  const { text, from, to } = req.body || {};
  if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'Please enter some text.' });
  if (text.length > MAX_CHARS) return res.status(400).json({ error: 'Text is too long (max ' + MAX_CHARS + ' characters).' });
  if (from !== 'auto' && !LANGS[from]) return res.status(400).json({ error: 'Unknown source language.' });
  if (!LANGS[to]) return res.status(400).json({ error: 'Unknown target language.' });

  try {
    const out = [];
    let detected = '';
    for (const part of splitText(text.trim(), CHUNK)) {
      const r = await translatePart(part, from, to);
      out.push(r.text);
      if (!detected) detected = r.detected;
    }
    res.json({ translatedText: out.join(' '), detected });
  } catch (e) {
    console.error('Translate failed:', e.message);
    res.status(502).json({ error: 'Translation service is unavailable right now. Please try again in a moment.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('WordBridge running at http://localhost:' + PORT));