// Local server for HazeWatch SEA.
// Serves the static app and generates /config.js from .env so the
// Google Maps key and Map ID never live in source files.
//
//   npm run serve            → http://localhost:4173
//   PORT=8080 npm run serve
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT) || 4173;

// Real environment variables win over .env; .env is re-read each call so edits apply on reload.
function loadEnv() {
  const envPath = join(root, '.env');
  const file = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf8')) : {};
  const get = name => process.env[name] || file[name] || '';
  return { googleMapsApiKey: get('GOOGLE_MAPS_API_KEY'), mapId: get('GOOGLE_MAPS_MAP_ID') };
}

// Server-only secrets: never sent to the browser.
function loadSecrets() {
  const envPath = join(root, '.env');
  const file = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf8')) : {};
  const get = name => process.env[name] || file[name] || '';
  return { geminiKey: get('GEMINI_API_KEY'), geminiModel: get('GEMINI_MODEL') || 'gemini-3.8-flash' };
}

// ---------------------------------------------------------------------------
// AI chat: POST /api/chat → Gemini (structured JSON output)
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are HazeWatch AI, an air-quality assistant inside a live haze map of Asia-Pacific.
Answer ONLY from the JSON data provided with each question (cities with US AQI, PM2.5 in µg/m³, forecasts at +12h/+24h/+48h, wind, fire-hotspot clusters).
US AQI bands: 0-50 good, 51-100 moderate, 101-150 unhealthy for sensitive groups, 151-200 unhealthy, 201-300 very unhealthy, 301+ hazardous.
When asked which areas are serious, group nearby cities (same island/region, within a few hundred km) into named areas, e.g. "Riau & Jambi, Sumatra".
Treat AQI > 150 as serious; include 101-150 areas only if nothing is above 150 or the user asks about sensitive groups.
Use cityIds exactly as given in the data. Never invent cities or numbers.
Set focusHour to the forecast hour the question is about (0 = now, 12, 24 or 48).
Keep "answer" under 110 words, plain text, friendly, with practical precautions (masks, indoor activity). No medical diagnosis.
If the data source is "demo", mention briefly that values are illustrative.`;

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    answer: { type: 'STRING' },
    focusHour: { type: 'INTEGER', enum: [0, 12, 24, 48] },
    areas: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          cityIds: { type: 'ARRAY', items: { type: 'STRING' } },
          severity: { type: 'STRING', enum: ['sensitive', 'unhealthy', 'very_unhealthy', 'hazardous'] },
          reason: { type: 'STRING' },
        },
        required: ['name', 'cityIds', 'severity', 'reason'],
      },
    },
  },
  required: ['answer', 'focusHour', 'areas'],
};

const rateLimit = new Map(); // ip → recent request timestamps

async function readJson(req, limit = 120_000) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error('Request too large'), { status: 413 });
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function handleChat(req, res) {
  const send = (status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(body));
  };
  const { geminiKey, geminiModel } = loadSecrets();
  if (!geminiKey) return send(503, { error: 'no_key', message: 'GEMINI_API_KEY is not set in .env' });

  const ip = req.socket.remoteAddress;
  const now = Date.now();
  const recent = (rateLimit.get(ip) || []).filter(t => now - t < 60_000);
  if (recent.length >= 12) return send(429, { error: 'rate_limited', message: 'Too many questions — wait a minute.' });
  rateLimit.set(ip, [...recent, now]);

  let body;
  try {
    body = await readJson(req);
  } catch (err) {
    return send(err.status || 400, { error: 'bad_request', message: err.message });
  }
  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
  const question = String(body.question || '').slice(0, 600);
  if (!question.trim()) return send(400, { error: 'bad_request', message: 'Empty question' });

  const contents = [
    ...history.map(m => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: String(m.text).slice(0, 1500) }] })),
    { role: 'user', parts: [{ text: `Live data (JSON):\n${JSON.stringify(body.context)}\n\nQuestion: ${question}` }] },
  ];

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA, temperature: 0.3 },
      }),
    });
    const json = await r.json().catch(() => ({}));
    if (!r.ok) return send(502, { error: 'gemini_error', message: json.error?.message || `Gemini HTTP ${r.status}` });
    const text = (json.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      result = { answer: text || 'No answer returned.', focusHour: 0, areas: [] };
    }
    send(200, { ...result, model: geminiModel });
  } catch (err) {
    send(502, { error: 'gemini_unreachable', message: err.message });
  }
}

const configJs = config => `window.HAZEWATCH_CONFIG = ${JSON.stringify(config, null, 2)};\n`;

// `node server.mjs --write dist` writes dist/config.js for static hosting instead of serving.
const writeIdx = process.argv.indexOf('--write');
if (writeIdx > -1) {
  const dir = process.argv[writeIdx + 1] || 'dist';
  await writeFile(join(root, dir, 'config.js'), configJs(loadEnv()));
  console.log(`Wrote ${dir}/config.js from .env`);
  process.exit(0);
}

// Only app assets are served — never .env, source config or node_modules.
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};
const ALLOWED = [/^\/(index\.html|app\.js|styles\.css)$/, /^\/data\/[\w-]+\.json$/, /^\/public\/[\w-]+\.(svg|png|ico)$/];

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path === '/api/chat' && req.method === 'POST') return handleChat(req, res);
  if (path === '/config.js') {
    // Re-read .env on every request so edits apply on reload.
    res.writeHead(200, { 'Content-Type': TYPES['.js'], 'Cache-Control': 'no-store' });
    return res.end(configJs(loadEnv()));
  }
  const file = path === '/' ? '/index.html' : path;
  const full = normalize(join(root, file));
  if (!ALLOWED.some(re => re.test(file)) || !full.startsWith(root.endsWith(sep) ? root : root + sep)) {
    res.writeHead(404);
    return res.end('Not found');
  }
  try {
    const body = await readFile(full);
    res.writeHead(200, { 'Content-Type': TYPES[extname(full)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(port, () => {
  const { googleMapsApiKey } = loadEnv();
  console.log(`HazeWatch SEA → http://localhost:${port}`);
  console.log(googleMapsApiKey ? 'Google Maps key loaded from .env' : 'No GOOGLE_MAPS_API_KEY in .env — showing the offline map');
  const { geminiKey, geminiModel } = loadSecrets();
  console.log(geminiKey ? `AI chat: ${geminiModel}` : 'No GEMINI_API_KEY in .env — AI chat uses offline analysis');
});
