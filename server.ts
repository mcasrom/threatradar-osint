import express from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createServer as createViteServer } from 'vite';
import { readDB, writeDB, GEMINI_API_KEY, APP_URL } from './src/db';
import { GoogleGenAI } from '@google/genai';
import helmet from 'helmet';
import Groq from 'groq-sdk';
import { Resend } from 'resend';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { registerUser, loginUser, generateToken, authMiddleware, planMiddleware } from './src/auth';
import { getUserById, getScanCount, createSubscription, updateSubscriptionStatus, updateUserPlan } from './src/sqlite';

const execAsync = promisify(exec);

// Initialize Gemini client
let ai: GoogleGenAI | null = null;
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

if (GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'threatradar-osint',
      },
    },
  });
}

const app = express();
app.set('trust proxy', 1); // Nginx + Cloudflare
const PORT = process.env.PORT || 3000;

// --- Security Middleware ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://static.cloudflareinsights.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.ipify.org", "http://ip-api.com", "https://ip-api.com", "ws://localhost:24678", "wss://localhost:24678", "https://static.cloudflareinsights.com"],
    },
  },
  hsts: false,
  upgradeInsecureRequests: false,
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || APP_URL,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  validate: { xForwardedForHeader: false },
  message: { error: 'Report generation limit reached. Try again later.' },
});

const scanLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  validate: { xForwardedForHeader: false },
  message: { error: 'Scan limit reached. Try again later.' },
});

app.use('/api/', apiLimiter);
app.use('/api/premium-report', reportLimiter);
app.use('/api/reports/auto-generate', reportLimiter);
app.use('/api/modules/run', scanLimiter);

// Demo pública — 3 scans/día por IP sin login
const demoLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  validate: { xForwardedForHeader: false },
  keyGenerator: (req: any) => req.ip || 'unknown',
  message: { error: 'Demo limit: 3 scans/día gratuitos. Regístrate para acceso ilimitado.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/demo', demoLimiter);

// --- Logging Middleware ---
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// --- Helper Functions ---
import { execSync } from 'child_process';

function checkToolAvailable(tool: string): boolean {
  try {
    const { stdout } = execSync(`which ${tool}`, { encoding: 'utf-8', env: { ...process.env, PATH: `/home/deploy/.local/bin:/home/deploy/go/bin:${process.env.PATH}` } });
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

const isValidIP = (ip: string): boolean => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
};

const isValidDomain = (domain: string): boolean => {
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
  return domainRegex.test(domain);
};

const isValidTarget = (target: string): boolean => {
  return isValidIP(target) || isValidDomain(target);
};

const isPrivateIP = (ip: string): boolean => {
  const parts = ip.split('.').map(Number);
  if (parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 127) return true;
  // Permitir IP propia del servidor Hetzner
  if (ip === '178.105.80.193') return true;
  return false;
};

const ACTIVE_SCAN_TOOLS = ['nmap', 'masscan', 'nikto', 'nuclei'];

const requiresPrivateTarget = (commandTemplate: string): boolean => {
  return ACTIVE_SCAN_TOOLS.some(tool => commandTemplate.toLowerCase().includes(tool));
};

const sanitizeTarget = (target: string): string => {
  return target.replace(/[;&|`$(){}[\]<>\\]/g, '').trim();
};

// --- Threat Map DB setup ---
(function initThreatMapTable() {
  const Database = require('better-sqlite3');
  const _db = new Database(require('path').join(process.cwd(), 'data/threatradar.db'));
  _db.prepare(`CREATE TABLE IF NOT EXISTS threat_map (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT NOT NULL,
    port INTEGER,
    lat REAL,
    lon REAL,
    country TEXT,
    threat_type TEXT,
    malware TEXT,
    source TEXT,
    first_seen TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`).run();
  _db.prepare(`CREATE INDEX IF NOT EXISTS idx_threat_map_created ON threat_map(created_at)`).run();
  _db.close();
})();

async function sendTelegramAlert(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' })
    });
  } catch (e: any) { console.error('[Telegram]', e.message); }
}

async function fetchThreatMapData() {
  try {
    const Database = require('better-sqlite3');
    const _db = new Database(require('path').join(process.cwd(), 'data/threatradar.db'));
    const tfKey = process.env.THREATFOX_API_KEY;
    if (!tfKey) { _db.close(); return; }
    const res = await fetch('https://threatfox-api.abuse.ch/api/v1/', {
      method: 'POST',
      headers: { 'Auth-Key': tfKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'get_iocs', days: 1 })
    });
    const data = await res.json();
    const iocs = (data.data || []).filter((x: any) => x.ioc_type === 'ip:port').slice(0, 100);
    _db.prepare(`DELETE FROM threat_map WHERE created_at < datetime('now', '-24 hours')`).run();
    const insert = _db.prepare(`INSERT OR IGNORE INTO threat_map (ip, port, lat, lon, country, threat_type, malware, source, first_seen, asn, org) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
    for (const ioc of iocs) {
      const parts = (ioc.ioc || '').split(':');
      const ip = parts[0]; const port = parseInt(parts[1]) || 0;
      if (!ip) continue;
      try {
        const geo = await fetch(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_API_KEY || ''}`).then((r: any) => r.json());
        const [lat, lon] = (geo.loc || '0,0').split(',').map(Number);
        const orgRaw = geo.org || '';
        const asnMatch = orgRaw.match(/^(AS\d+)\s+(.*)/);
        const asn = asnMatch ? asnMatch[1] : '';
        const org = asnMatch ? asnMatch[2] : orgRaw;
        insert.run(ip, port, lat, lon, geo.country || '', ioc.threat_type || '', ioc.malware || '', 'threatfox', ioc.first_seen || '', asn, org);
      } catch {}
    }
    _db.close();
    console.log(`[ThreatMap] Updated ${iocs.length} C2 IOCs`);
  } catch (e: any) { console.error('[ThreatMap] Error:', e.message); }
}
fetchThreatMapData();
setInterval(fetchThreatMapData, 60 * 60 * 1000);

// --- URLHaus Feed DB setup ---
(function initURLHausTable() {
  const Database = require('better-sqlite3');
  const _db = new Database(require('path').join(process.cwd(), 'data/threatradar.db'));
  _db.prepare(`CREATE TABLE IF NOT EXISTS urlhaus_feed (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT UNIQUE NOT NULL,
    url_status TEXT,
    threat TEXT,
    tags TEXT,
    host TEXT,
    date_added TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`).run();
  _db.prepare(`CREATE INDEX IF NOT EXISTS idx_urlhaus_created ON urlhaus_feed(created_at)`).run();
  _db.close();
})();
async function fetchURLHausData() {
  try {
    const Database = require('better-sqlite3');
    const _db = new Database(require('path').join(process.cwd(), 'data/threatradar.db'));
    const res = await fetch('https://urlhaus.abuse.ch/downloads/json_recent/', {
      method: 'GET'
    });
    const data = await res.json();
    // json_recent devuelve dict {host: [urls]}  — aplanar y tomar las 100 primeras online
    const allUrls: any[] = Object.values(data).flat();
    const urls = allUrls.filter((u: any) => u.url_status === 'online').slice(0, 100);
    _db.prepare(`DELETE FROM urlhaus_feed WHERE created_at < datetime('now', '-48 hours')`).run();
    const insert = _db.prepare(`INSERT OR IGNORE INTO urlhaus_feed (url, url_status, threat, tags, host, date_added) VALUES (?,?,?,?,?,?)`);
    for (const u of urls) {
      insert.run(
        u.url || '',
        u.url_status || '',
        u.threat || '',
        Array.isArray(u.tags) ? u.tags.join(',') : (u.tags || ''),
        u.host || '',
        u.dateadded || u.date_added || ''
      );
    }
    _db.close();
    console.log(`[URLHaus] Updated ${urls.length} malware URLs`);
  } catch (e: any) { console.error('[URLHaus] Error:', e.message); }
}
fetchURLHausData();
setInterval(fetchURLHausData, 6 * 60 * 60 * 1000); // cada 6h


// --- API Endpoints ---


// URLHaus malware URL feed
app.get('/api/urlhaus/feed', (req: any, res) => {
  try {
    const Database = require('better-sqlite3');
    const _db = new Database(require('path').join(process.cwd(), 'data/threatradar.db'));
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const threat = req.query.threat as string;
    let query = `SELECT url, url_status, threat, tags, host, date_added, created_at FROM urlhaus_feed`;
    const params: any[] = [];
    if (threat) { query += ` WHERE threat = ?`; params.push(threat); }
    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);
    const rows = _db.prepare(query).all(...params);
    const stats = _db.prepare(`SELECT threat, COUNT(*) as count FROM urlhaus_feed GROUP BY threat ORDER BY count DESC`).all();
    _db.close();
    res.json({ total: rows.length, stats, urls: rows });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// 0. Demo pública — sin auth, 3 scans/día por IP
app.post('/api/demo/scan', async (req: any, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: 'IP requerida' });
  const target = sanitizeTarget(ip);
  if (!isValidIP(target)) return res.status(400).json({ error: 'IP inválida' });
  try {
    const results: any = { ip: target, timestamp: new Date().toISOString(), demo: true };
    await Promise.allSettled([
      fetch(`https://internetdb.shodan.io/${target}`)
        .then(r => r.json()).then(d => { results.shodan = d; }).catch(() => {}),
      fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${target}&maxAgeInDays=90`, {
        headers: { Key: process.env.ABUSEIPDB_API_KEY || '', Accept: 'application/json' }
      }).then(r => r.json()).then(d => { results.abuseipdb = d; }).catch(() => {}),
      fetch(`https://api.greynoise.io/v3/community/${target}`)
        .then(r => r.json()).then(d => { results.greynoise = d; }).catch(() => {}),
      fetch(`https://ipinfo.io/${target}?token=${process.env.IPINFO_API_KEY || ''}`)
        .then(r => r.json()).then(d => { results.ipinfo = d; }).catch(() => {}),
    ]);
    const score = computeThreatScore(results);
    // Telegram alert si HIGH o CRITICAL
    if (score.level === 'HIGH' || score.level === 'CRITICAL') {
      const alertMsg = `Scan completado\nFactores: ${score.factors.join(', ')}\nConclusión: ${score.conclusion}`;
      fetch(`http://localhost:${process.env.PORT || 3013}/api/alerts/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: alertMsg, ip: target, score: score.score, level: score.level })
      }).catch(() => {});
    }
    res.json({ ...results, threatScore: score });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 0b. Threat Map live data
app.get('/api/threatmap/live', async (req, res) => {
  try {
    const Database = require('better-sqlite3');
    const _db = new Database(path.join(process.cwd(), 'data/threatradar.db'));
    const points = _db.prepare(`SELECT ip, port, lat, lon, country, threat_type, malware, source, first_seen FROM threat_map WHERE lat != 0 ORDER BY created_at DESC LIMIT 200`).all();
    _db.close();
    res.json({ points, count: points.length, updated: new Date().toISOString() });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ASN Clustering endpoint
app.get('/api/threatmap/asn', async (req, res) => {
  try {
    const Database = require('better-sqlite3');
    const _db = new Database(path.join(process.cwd(), 'data/threatradar.db'));
    const rows = _db.prepare(`
      SELECT asn, org, country,
             COUNT(*) as count,
             GROUP_CONCAT(DISTINCT malware) as malwares
      FROM threat_map
      WHERE asn IS NOT NULL AND asn != ''
      GROUP BY asn, org
      ORDER BY count DESC
      LIMIT 20
    `).all();
    const total = _db.prepare(`SELECT COUNT(*) as n FROM threat_map WHERE asn != '' AND asn IS NOT NULL`).get();
    _db.close();
    res.json({ asns: rows, total: total?.n || 0, updated: new Date().toISOString() });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(), 
    uptime: process.uptime(),
    version: '2.0.0'
  });
});

// 2. Server status
app.get('/api/status', (req, res) => {
  const db = readDB();
  res.json({
    status: 'online',
    modulesCount: db.customModules?.length || 0,
    reportsCount: db.reports?.length || 0,
    logReportsCount: db.logReports?.length || 0,
    hasGeminiKey: !!GEMINI_API_KEY,
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    hasResend: !!process.env.RESEND_API_KEY,
    tools: {
      nmap: checkToolAvailable('nmap'),
      dnsrecon: checkToolAvailable('dnsrecon'),
      theharvester: checkToolAvailable('theHarvester'),
      whois: checkToolAvailable('whois'),
      dig: checkToolAvailable('dig'),
      traceroute: checkToolAvailable('traceroute'),
      sslscan: checkToolAvailable('sslscan'),
      nikto: checkToolAvailable('nikto'),
      shodan: checkToolAvailable('shodan'),
      subfinder: checkToolAvailable('subfinder'),
      httpx: checkToolAvailable('httpx'),
      nuclei: checkToolAvailable('nuclei'),
      amass: checkToolAvailable('amass'),
      masscan: checkToolAvailable('masscan'),
      wafw00f: checkToolAvailable('wafw00f'),
    },
  });
});

// 3. Fetch OSINT Modules
app.get('/api/modules', (req, res) => {
  const db = readDB();
  const category = req.query.category as string;
  const modules = db.customModules || [];
  
  if (category) {
    return res.json(modules.filter((m: any) => m.category === category));
  }
  
  res.json(modules);
});

// 4. Create new OSINT Module
app.post('/api/modules', (req, res) => {
  const { name, description, version, commandTemplate, outputFormat, category } = req.body;
  if (!name || !commandTemplate) {
    return res.status(400).json({ error: 'Name and command template are required' });
  }
  
  const db = readDB();
  const newModule = {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name,
    description: description || '',
    version: version || '1.0.0',
    status: 'active',
    commandTemplate,
    outputFormat: outputFormat || 'text',
    category: category || 'custom'
  };
  
  db.customModules.push(newModule);
  writeDB(db);
  res.json({ success: true, module: newModule });
});

// 5. Run OSINT tool - REAL EXECUTION
app.post('/api/modules/run', async (req, res) => {
  const { moduleId, target } = req.body;
  
  if (!moduleId || !target) {
    return res.status(400).json({ error: 'moduleId and target are required' });
  }

  const sanitizedTarget = sanitizeTarget(target);
  if (!isValidTarget(sanitizedTarget)) {
    return res.status(400).json({ error: 'Invalid target. Must be a valid IP address or domain.' });
  }

  const db = readDB();
  const mod = db.customModules.find((m: any) => m.id === moduleId);
  if (!mod) {
    return res.status(404).json({ error: 'Module not found' });
  }

  try {
    // Opción D+A: herramientas activas solo en IPs privadas/propias
    if (requiresPrivateTarget(mod.commandTemplate) && isValidIP(sanitizedTarget) && !isPrivateIP(sanitizedTarget)) {
      return res.status(403).json({ 
        error: 'Escaneo activo solo permitido en redes privadas (192.168.x.x, 10.x.x.x) o tu propio servidor. Para IPs públicas usa los módulos OSINT pasivos.'
      });
    }

    let command = mod.commandTemplate.replace('{target}', sanitizedTarget);
    
    // Security validation
    if (command.includes(';') || command.includes('|') || command.includes('&&') || 
        command.includes('`') || command.includes('$(') || command.includes('\n')) {
      return res.status(400).json({ error: 'Command contains invalid characters' });
    }

    const toolEnv = { ...process.env, PATH: `/home/deploy/.local/bin:/home/deploy/go/bin:${process.env.PATH}` };
    const { stdout, stderr } = await execAsync(command, { 
      timeout: 120000,
      maxBuffer: 20 * 1024 * 1024,
      env: toolEnv
    });

    res.json({ 
      output: stdout || stderr || 'Command executed successfully with no output.',
      moduleId,
      target: sanitizedTarget,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.json({ 
      output: err.stdout || err.stderr || `Error executing command: ${err.message}`,
      moduleId,
      target: sanitizedTarget,
      timestamp: new Date().toISOString(),
      error: true
    });
  }
});

// 6. Premium AI Report
app.post('/api/premium-report', async (req, res) => {
  const { organization, infrastructure, customChatPrompt, chatHistory } = req.body;
  
  if (!organization || !infrastructure) {
    return res.status(400).json({ error: 'Organization name and infrastructure details are required' });
  }

  if (!ai) {
    return res.status(503).json({ 
      error: 'Gemini API key not configured. Set GEMINI_API_KEY in your .env file.',
      setup: 'Get your API key at https://aistudio.google.com/app/apikey'
    });
  }

  try {
    const prompt = customChatPrompt 
      ? `You are an expert Cyber Security Architect and Senior OSINT Specialist acting within the ThreatRadar OSINT console.
         System under test:
         - Organization: ${organization}
         - Infrastructure: ${infrastructure}
         
         Chat history: ${JSON.stringify(chatHistory || [])}
         
         User message: "${customChatPrompt}"
         
         Provide a direct, detailed professional cyber defense response in elegant markdown.`
      : `You are an expert Cyber Security Architect designing a comprehensive tactical threat assessment.
         Target Profile:
         - Organization: ${organization}
         - Infrastructure: ${infrastructure}
         
         Generate a detailed cyber intelligence assessment in markdown:
         1. EXECUTIVE SUMMARY & RISK SCORE (0-100)
         2. VECTOR PATHWAYS based on: ${infrastructure}
         3. SHODAN, SENSYS, LEAKIX QUERIES for: "${organization}"
         4. ANTIBOTNET DEFENSE PROTOCOLS
         5. ACTIONABLE REMEDIATION PLAN`;

    let reportText = '';
    let engine = 'gemini';
    try {
      const gRes = await ai.models.generateContent({
        model: 'gemini-2.0-flash', contents: prompt,
        config: { systemInstruction: 'Act as a military-grade security analyst. Provide high-fidelity technical advice in Spanish/English.' }
      });
      reportText = gRes.text || '';
    } catch {
      if (groq) {
        engine = 'groq';
        const gqRes = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'Act as a military-grade security analyst. Provide high-fidelity technical advice in Spanish/English.' },
            { role: 'user', content: prompt }
          ], max_tokens: 2000
        });
        reportText = gqRes.choices[0]?.message?.content || '';
      }
    }
    if (!reportText) reportText = 'No response generated.';
    const scoreMatch = reportText.match(/(score|puntuación|postura|health)[:\s]+(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[2]) : 68;
    res.json({ report: reportText, score, engine });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error generating AI report.' });
  }
});

// 7. Auto-generate reports
app.post('/api/reports/auto-generate', async (req, res) => {
  const { period, emailTo, webhookUrl } = req.body;
  if (!period) {
    return res.status(400).json({ error: 'Period parameter (daily, weekly, monthly) is required.' });
  }

  const db = readDB();
  const modules = db.customModules || [];
  const existingReports = db.logReports || [];
  
  let analysisText = `ThreatRadar OSINT Report [${period.toUpperCase()}]
Generated: ${new Date().toISOString()}
Active Modules: ${modules.length}
Previous Reports: ${existingReports.length}`;

  // Datos reales SQLite
  let realStats = '';
  try {
    const Database2 = require('better-sqlite3');
    const db2 = new Database2(require('path').join(process.cwd(), 'data/threatradar.db'));
    const c2count = db2.prepare('SELECT COUNT(*) as n FROM threat_map').get();
    const urlcount = db2.prepare('SELECT COUNT(*) as n FROM urlhaus_feed').get();
    const topAsn = db2.prepare('SELECT org, COUNT(*) as n FROM threat_map GROUP BY org ORDER BY n DESC LIMIT 5').all();
    const topCountry = db2.prepare('SELECT country, COUNT(*) as n FROM threat_map GROUP BY country ORDER BY n DESC LIMIT 5').all();
    const recentScans = db2.prepare('SELECT ip, threat_score, threat_level, country, isp, created_at FROM scan_history ORDER BY created_at DESC LIMIT 5').all();
    db2.close();
    realStats = `DATOS EN VIVO THREATRADAR:\n- C2s rastreados: ${c2count?.n || 0}\n- URLs malware URLHaus: ${urlcount?.n || 0}\n- Top ASNs: ${JSON.stringify(topAsn)}\n- Top países: ${JSON.stringify(topCountry)}\n- Últimos scans: ${JSON.stringify(recentScans)}`;
  } catch(e: any) {
    realStats = 'SQLite no disponible';
    console.error('[REPORT-SQLITE-ERROR]', e.message, e.stack);
  }

  const reportPrompt = `Eres analista CTI senior de ThreatRadar OSINT. Fecha actual: ${new Date().toUTCString()}.
Genera informe ${period} en español basado EXCLUSIVAMENTE en estos datos reales:

${realStats}

Formato markdown:
# ThreatRadar SOC Report — ${period.toUpperCase()} — ${new Date().toLocaleDateString('es-ES')}
## 1. Resumen Ejecutivo
## 2. Indicadores Clave
## 3. Top Amenazas por ASN y País
## 4. IPs recientes analizadas
## 5. Recomendaciones accionables

Usa los números reales. No inventes datos. No uses fechas anteriores a hoy.`;

  if (ai) {
    try {
      const gRes = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: reportPrompt });
      if (gRes.text) analysisText = gRes.text;
    } catch {
      if (groq) {
        try {
          const gqRes = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'Analista CTI senior. Usa SOLO los datos reales proporcionados. Nunca inventes datos ni fechas.' },
              { role: 'user', content: reportPrompt }
            ],
            max_tokens: 1200
          });
          analysisText = gqRes.choices[0]?.message?.content || analysisText;
        } catch {}
      }
    }
  }

  const newReport = {
    id: `REP-${Date.now()}`,
    date: new Date().toLocaleDateString(),
    period,
    analysisText,
    modulesCount: modules.length,
    recipientsCount: emailTo ? 1 : 0
  };

  let emailStatus = '';
  if (emailTo) {
    if (!resend) {
      emailStatus = 'Resend no configurado. Añade RESEND_API_KEY al .env';
    } else {
      try {
        const proxyRes = await fetch('https://www.viajeinteligencia.com/api/send-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: process.env.CRON_SECRET || '',
            to: emailTo,
            subject: `[ThreatRadar] ${period.toUpperCase()} Security Report - ${newReport.id}`,
            html: `<div style="font-family:monospace;padding:24px;background:#0c1322;color:#f4f4f5;border-radius:8px">
              <h2 style="color:#00f2ff;margin-bottom:4px">ThreatRadar SOC Report</h2>
              <p style="color:#8b949e;font-size:12px">ID: ${newReport.id} | ${new Date().toUTCString()}</p>
              <hr style="border-color:#1e2d3d;margin:16px 0">
              <pre style="background:#090e17;padding:16px;border-radius:4px;font-size:12px;white-space:pre-wrap">${analysisText}</pre>
              <p style="color:#8b949e;font-size:11px">ThreatRadar OSINT &mdash; alerts@viajeinteligencia.com</p>
            </div>`
          })
        });
        const proxyData = await proxyRes.json();
        emailStatus = proxyRes.ok ? `Email enviado a ${emailTo} via proxy` : `Proxy error: ${proxyData.error}`;
      } catch (err: any) {
        emailStatus = `Proxy error: ${err?.message}`;
      }
    }
  }

  // Webhook Discord/Slack
  let webhookStatus = "";
  if (webhookUrl && webhookUrl.startsWith("https://")) {
    try {
      const isDiscord = webhookUrl.includes("discord.com");
      const whBody = isDiscord
        ? JSON.stringify({ username: "ThreatRadar SOC", embeds: [{ title: `ThreatRadar ${period.toUpperCase()} Report`, description: analysisText.slice(0, 4000), color: 0x00e5ff }] })
        : JSON.stringify({ text: `ThreatRadar ${period.toUpperCase()} Report\n${analysisText.slice(0, 3000)}` });
      const whRes = await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: whBody });
      webhookStatus = whRes.ok ? `Webhook OK (${isDiscord ? "Discord" : "Slack"})` : `Webhook error ${whRes.status}`;
    } catch (e: any) { webhookStatus = `Webhook error: ${e.message}`; }
  }
  // Telegram
  await sendTelegramAlert(`⬡ <b>ThreatRadar SOC — ${period.toUpperCase()} REPORT</b>\n📋 ID: ${newReport.id}\n🌐 Módulos activos: ${modules.length}`);

  db.logReports.unshift(newReport);
  writeDB(db);

  res.json({
    success: true,
    report: newReport,
    notificationMessage: `Report compiled. ${emailTo ? `Email: ${emailStatus}` : 'No email configured.'}`
  });
});


// PDF Security Assessment Report (Pro/Enterprise)
app.post('/api/reports/pdf', authMiddleware, planMiddleware, async (req: any, res) => {
  const { target } = req.body;
  if (!target) return res.status(400).json({ error: 'target requerido' });
  const clean = String(target).trim().replace(/[^a-zA-Z0-9.\-_]/g, '');
  if (clean.length < 4) return res.status(400).json({ error: 'target invalido' });
  const { exec } = require('child_process');
  const fs = require('fs');
  const path = require('path');
  const outPdf = `/tmp/tr_${Date.now()}_${clean}.pdf`;
  const script = path.join(process.cwd(), 'generate_report.py');
  const env = { ...process.env, PATH: `/home/deploy/.local/bin:/home/deploy/go/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH||''}` };
  exec(`python3 ${script} --target ${clean} --output ${outPdf}`, { env, timeout: 300000 },
    (err: any, stdout: string, stderr: string) => {
      const exists = fs.existsSync(outPdf);
      if (err || !exists) return res.status(500).json({ error: 'Error PDF', detail: stderr });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="ThreatRadar_${clean}_${new Date().toISOString().slice(0,10)}.pdf"`);
      const stream = fs.createReadStream(outPdf);
      stream.pipe(res);
      stream.on('end', () => { try { fs.unlinkSync(outPdf); } catch {} });
    }
  );
});

app.get('/api/reports/auto-generate', (req, res) => {
  const db = readDB();
  res.json(db.logReports || []);
});

// 8. Stripe Billing
app.post('/api/billing/setup', authMiddleware, async (req: any, res) => {
  const { planName } = req.body;
  if (!planName) return res.status(400).json({ error: 'planName required' });
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(503).json({ error: 'Stripe not configured' });
  try {
    const stripe = require('stripe')(stripeKey);
    const priceMap: Record<string, string> = {
      'BASIC':      process.env.STRIPE_PRICE_BASIC || '',
      'PREMIUM':    process.env.STRIPE_PRICE_PREMIUM || '',
      'ENTERPRISE': process.env.STRIPE_PRICE_ENTERPRISE || ''
    };
    const priceId = priceMap[planName.toUpperCase()];
    if (!priceId) return res.status(400).json({ error: `Invalid plan: ${planName}` });
    const user = getUserById(req.user.id);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: user?.email || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${APP_URL}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}?payment=cancelled`,
      metadata: { plan: planName, userId: req.user.id }
    });
    createSubscription(`SUB-${Date.now()}`, req.user.id, planName, session.id, user?.email || '');
    res.json({ success: true, checkoutUrl: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Stripe error' });
  }
});
// Stripe webhook
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(503).send('Stripe not configured');
  const stripe = require('stripe')(stripeKey);
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret!);
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan?.toLowerCase();
      if (userId && plan) {
        updateUserPlan(userId, plan);
        updateSubscriptionStatus(session.id, 'completed');
      }
    }
    res.json({ received: true });
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// 9. External API integrations (proxied through server for security)

app.get('/api/geoip/:ip?', async (req, res) => {
  const ip = req.params.ip || '';
  const url = ip ? `http://ip-api.com/json/${ip}` : 'http://ip-api.com/json/';
  try {
    const r = await fetch(url);
    const data = await r.json();
    res.json(data);
  } catch (err: any) {
    res.status(503).json({ error: 'GeoIP lookup failed', detail: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, plan } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const user = await registerUser(email, password, plan);
    const token = generateToken(user);
    res.json({ token, user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const user = await loginUser(email, password);
    const token = generateToken(user);
    res.json({ token, user });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

app.get('/api/auth/me', authMiddleware, (req: any, res) => {
  res.json({ user: req.user });
});

app.get('/api/user/usage', authMiddleware, (req: any, res) => {
  const user = getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
  const scanCount = getScanCount(user.id);
  const used = scanCount[monthKey] || 0;
  const limits: any = { free: 10, pro: -1, enterprise: -1 };
  const limit = limits[user.plan] ?? 10;
  res.json({ email: user.email, plan: user.plan, scansUsed: used, scansLimit: limit, month: monthKey });
});
app.get('/api/osint/shodan/:ip', authMiddleware, async (req, res) => {
  // InternetDB: Shodan free — ports, CVEs, tags sin API key
  const ip = sanitizeTarget(req.params.ip);
  if (!isValidIP(ip)) return res.status(400).json({ error: 'Invalid IP' });

  try {
    const response = await fetch(`https://internetdb.shodan.io/${ip}`);
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/osint/abuseipdb/:ip', authMiddleware, async (req, res) => {
  const apiKey = process.env.ABUSEIPDB_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'AbuseIPDB API key not configured' });
  
  const ip = sanitizeTarget(req.params.ip);
  if (!isValidIP(ip)) return res.status(400).json({ error: 'Invalid IP' });

  try {
    const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90`, {
      headers: { 'Key': apiKey, 'Accept': 'application/json' }
    });
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/osint/virustotal/:ip', authMiddleware, async (req, res) => {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'VirusTotal API key not configured' });
  
  const ip = sanitizeTarget(req.params.ip);
  if (!isValidIP(ip)) return res.status(400).json({ error: 'Invalid IP' });

  try {
    const response = await fetch(`https://www.virustotal.com/api/v3/ip_addresses/${ip}`, {
      headers: { 'x-apikey': apiKey }
    });
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/osint/hibp/:email', authMiddleware, async (req, res) => {
  const apiKey = process.env.HIBP_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'HIBP API key not configured' });
  
  const email = req.params.email.replace(/[^a-zA-Z0-9@._+-]/g, '');
  if (!email.includes('@')) return res.status(400).json({ error: 'Invalid email' });

  try {
    const response = await fetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${email}`, {
      headers: { 'hibp-api-key': apiKey }
    });
    if (response.status === 404) {
      return res.json({ breaches: [], message: 'No breaches found' });
    }
    const data = await response.json();
    res.json({ breaches: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/osint/hunter/:domain', authMiddleware, async (req, res) => {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'Hunter API key not configured' });
  const domain = req.params.domain.replace(/[^a-zA-Z0-9.-]/g, '');
  if (!domain || !domain.includes('.')) return res.status(400).json({ error: 'Invalid domain' });
  try {
    const response = await fetch(`https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${apiKey}`);
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }

app.get('/api/osint/greynoise/:ip', authMiddleware, async (req, res) => {
  // GreyNoise Community — funciona sin key
  const ip = sanitizeTarget(req.params.ip);
  if (!isValidIP(ip)) return res.status(400).json({ error: 'Invalid IP' });
  try {
    const gnKey = process.env.GREYNOISE_API_KEY;
    const response = await fetch(`https://api.greynoise.io/v3/community/${ip}`, { headers: gnKey ? { key: gnKey } : {} });
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/osint/ipinfo/:ip', authMiddleware, async (req, res) => {
  const apiKey = process.env.IPINFO_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'IPInfo API key not configured' });
  const ip = sanitizeTarget(req.params.ip);
  if (!isValidIP(ip)) return res.status(400).json({ error: 'Invalid IP' });
  try {
    const response = await fetch(`https://ipinfo.io/${ip}?token=${apiKey}`);
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
});

// ── ThreatRadar Risk Score ────────────────────────────────────────────────
// Spec: wayahead Sprint 11 — algoritmo propio combinando 5 fuentes
function computeThreatScore(osintData: any): {
  score: number;
  level: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO';
  factors: string[];
  mitigationCommands: { label: string; cmd: string }[];
} {
  let score = 0;
  const factors: string[] = [];
  const HIGH_RISK_COUNTRIES = ['CN', 'RU', 'KP', 'IR', 'SY', 'CU', 'VE', 'BY'];

  // ── Factor 1: AbuseIPDB (max 30 pts según spec) ───────────────────────
  const abuse = osintData?.abuseipdb?.data;
  if (abuse) {
    if (abuse.abuseConfidenceScore > 50) {
      score += 30;
      factors.push(`AbuseIPDB: confianza de abuso ${abuse.abuseConfidenceScore}% (>50% → +30pts)`);
    } else if (abuse.abuseConfidenceScore > 20) {
      score += 10;
      factors.push(`AbuseIPDB: abuso moderado ${abuse.abuseConfidenceScore}%`);
    }
    if (abuse.isTor) { score += 15; factors.push('AbuseIPDB: nodo TOR activo detectado'); }
    if (abuse.totalReports > 100) { score += 5; factors.push(`AbuseIPDB: ${abuse.totalReports} reportes acumulados`); }
  }

  // ── Factor 2: GreyNoise noise=true (max 25 pts) ───────────────────────
  const gn = osintData?.greynoise;
  if (gn && !gn.error) {
    if (gn.noise === true) {
      score += 25;
      factors.push('GreyNoise: noise=true — IP escaneando internet activamente (+25pts)');
    }
    if (gn.riot === false) {
      score += 10;
      factors.push('GreyNoise: riot=false — no es infraestructura legítima conocida (+10pts)');
    }
    if (gn.classification === 'malicious') {
      score += 20;
      factors.push('GreyNoise: clasificación MALICIOSA explícita');
    }
  }

  // ── Factor 3: VirusTotal reputation < -5 (max 20 pts) ────────────────
  const vt = osintData?.virustotal?.data?.attributes;
  if (vt) {
    if (vt.reputation < -5) {
      score += 20;
      factors.push(`VirusTotal: reputación ${vt.reputation} (<-5 → +20pts)`);
    }
    const stats = vt.last_analysis_stats;
    if (stats?.malicious > 0) {
      score += Math.min(15, stats.malicious * 3);
      factors.push(`VirusTotal: ${stats.malicious} motores AV detectan actividad maliciosa`);
    }
  }

  // ── Factor 4: País de alta amenaza (15 pts) ───────────────────────────
  const country = osintData?.abuseipdb?.data?.countryCode
    || osintData?.ipinfo?.country
    || osintData?.shodan?.country_code;
  if (country && HIGH_RISK_COUNTRIES.includes(country)) {
    score += 15;
    factors.push(`Origen de alto riesgo geopolítico: ${country} (+15pts)`);
  }

  // ── Factor 5: GreyNoise riot=false (ya contado arriba como +10) ───────
  // ── Shodan: infraestructura expuesta ──────────────────────────────────
  const shodan = osintData?.shodan;
  if (shodan && !shodan.error) {
    if (shodan.vulns && Object.keys(shodan.vulns).length > 0) {
      score += 25;
      factors.push(`Shodan: ${Object.keys(shodan.vulns).length} CVEs conocidos en puertos expuestos`);
    }
    if (shodan.ports?.length > 10) {
      score += 10;
      factors.push(`Shodan: superficie de ataque amplia — ${shodan.ports.length} puertos abiertos`);
    }
    // Botnet inference: puertos C2 comunes
    const C2_PORTS = [4444, 1337, 8080, 8443, 6667, 6666, 31337, 12345];
    const c2Hits = (shodan.ports || []).filter((p: number) => C2_PORTS.includes(p));
    if (c2Hits.length > 0) {
      score += 20;
      factors.push(`Botnet/C2 inference: puertos ${c2Hits.join(', ')} asociados a C2/RAT`);
    }
  }

  score = Math.min(100, score);
  let level: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO' = 'BAJO';
  if (score >= 75) level = 'CRITICO';
  else if (score >= 50) level = 'ALTO';
  else if (score >= 25) level = 'MEDIO';

  // ── Comandos de mitigación según nivel ───────────────────────────────
  const ip = osintData?.ip || '<IP>';
  const mitigationCommands: { label: string; cmd: string }[] = [
    {
      label: 'iptables — DROP entrada',
      cmd: `iptables -I INPUT -s ${ip} -j DROP`
    },
    {
      label: 'iptables — DROP salida',
      cmd: `iptables -I OUTPUT -d ${ip} -j DROP`
    },
    {
      label: 'fail2ban — ban manual',
      cmd: `fail2ban-client set sshd banip ${ip}`
    },
    {
      label: 'fail2ban — verificar estado',
      cmd: `fail2ban-client status sshd | grep ${ip}`
    },
    {
      label: 'Guardar reglas iptables',
      cmd: `iptables-save > /etc/iptables/rules.v4`
    },
  ];

  if (level === 'CRITICO' || level === 'ALTO') {
    mitigationCommands.push(
      {
        label: 'SIEM Splunk — query IOC',
        cmd: `index=* src_ip="${ip}" OR dest_ip="${ip}" | stats count by sourcetype, src_ip, dest_ip | sort -count`
      },
      {
        label: 'ELK — query Kibana',
        cmd: `{"query":{"bool":{"should":[{"term":{"source.ip":"${ip}"}},{"term":{"destination.ip":"${ip}"}}]}}}`
      }
    );
  }

  // Why engine — conclusión automática sin IA
  const conclusion = (() => {
    const signals = [];
    if (osintData?.greynoise?.noise) signals.push('escaneo activo detectado por GreyNoise');
    if (osintData?.greynoise?.classification === 'malicious') signals.push('clasificada como maliciosa');
    if (osintData?.abuseipdb?.data?.abuseConfidenceScore > 50) signals.push(`AbuseIPDB ${osintData.abuseipdb.data.abuseConfidenceScore}% abuso`);
    if (osintData?.abuseipdb?.data?.isTor) signals.push('nodo TOR activo');
    if (osintData?.otx?.pulse_count > 10) signals.push(`${osintData.otx.pulse_count} pulses OTX`);
    if (osintData?.threatfox?.iocs?.length > 0) signals.push(`${osintData.threatfox.iocs.length} IOCs en ThreatFox`);
    if (osintData?.shodan?.ports?.length > 5) signals.push(`${osintData.shodan.ports.length} puertos expuestos`);

    let type = 'IP sin indicadores de amenaza';
    if (score >= 80) type = 'infraestructura maliciosa activa';
    else if (score >= 50) type = 'actividad sospechosa moderada';
    else if (score >= 20) type = 'bajo riesgo con indicadores menores';

    const confidence = score >= 70 ? 'alta' : score >= 40 ? 'media' : 'baja';
    const evidence = signals.length > 0 ? signals.slice(0, 3).join(' + ') : 'sin evidencias de amenaza';

    return {
      summary: `Esta IP presenta ${type}.`,
      evidence,
      risk: level,
      confidence
    };
  })();

  return { score, level, factors, mitigationCommands, conclusion };
}


app.post('/api/alerts/telegram', async (req, res) => {
  const { message, ip, score, level } = req.body;
  if (!message) return res.status(400).json({ error: "message requerido" });
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return res.status(500).json({ error: "Telegram no configurado" });
  const emoji = level === "CRITICAL" ? "🔴" : level === "HIGH" ? "🟠" : level === "MEDIUM" ? "🟡" : "🟢";
  const text = ip && score
    ? emoji + " *ThreatRadar Alert*\n\nIP: `" + ip + "`\nScore: " + score + " — " + level + "\n\n" + message
    : "🛡️ *ThreatRadar*\n\n" + message;
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" })
    });
    const data = await r.json();
    if (!data.ok) return res.status(500).json({ error: data.description });
    res.json({ ok: true, message_id: data.result.message_id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/osint/analyze', authMiddleware, async (req: any, res) => {
  const { osintData } = req.body;
  if (!osintData || !osintData.ip) return res.status(400).json({ error: 'osintData requerido' });

  // Calcular ThreatScore antes del análisis IA
  const threatScore = computeThreatScore(osintData);
  // Telegram alert si HIGH o CRITICAL
  if (threatScore.level === 'HIGH' || threatScore.level === 'CRITICAL') {
    const alertMsg = `Análisis OSINT completado\nFactores: ${threatScore.factors.join(', ')}\nConclusión: ${threatScore.conclusion}`;
    fetch(`http://localhost:${process.env.PORT || 3013}/api/alerts/telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: alertMsg, ip: osintData.ip, score: threatScore.score, level: threatScore.level })
    }).catch(() => {});
  }

  // Construir resumen de fuentes disponibles para el prompt
  // Datos estructurados para el prompt — selectivos para no truncar lo importante
  const shodanData   = osintData.shodan && !osintData.shodan.error ? osintData.shodan : null;
  const abuseData    = osintData.abuseipdb?.data || null;
  const gnData       = osintData.greynoise && !osintData.greynoise.message ? osintData.greynoise : null;
  const vtData       = osintData.virustotal?.data?.attributes || null;
  const ipinfoData   = osintData.ipinfo || null;
  const otxData      = osintData.otx || null;
  const tfData       = osintData.threatfox || null;
  const crtData      = osintData.crtsh || null;

  const structuredData = {
    ip: osintData.ip,
    threat_score: { score: threatScore.score, level: threatScore.level, factors: threatScore.factors, conclusion: threatScore.conclusion },
    network: {
      org: shodanData?.org || ipinfoData?.org || 'N/A',
      asn: ipinfoData?.org?.split(' ')[0] || 'N/A',
      country: ipinfoData?.country || shodanData?.country_code || 'N/A',
      city: ipinfoData?.city || 'N/A',
      isp: ipinfoData?.org || 'N/A',
      hostnames: shodanData?.hostnames || [],
    },
    ports: shodanData?.ports || [],
    vulns: Object.keys(shodanData?.vulns || {}),
    banners: shodanData?.tags || [],
    is_tor: abuseData?.isTor || false,
    is_vpn: shodanData?.tags?.includes('vpn') || false,
    reputation: {
      abuseipdb_score: abuseData?.abuseConfidenceScore ?? 'N/A',
      abuseipdb_reports: abuseData?.totalReports ?? 0,
      abuseipdb_categories: Array.isArray(abuseData?.reports) ? abuseData.reports.slice(0,5).map((r:any) => r.categories).flat().slice(0,10) : [],
      virustotal_malicious: vtData?.last_analysis_stats?.malicious ?? 0,
      virustotal_reputation: vtData?.reputation ?? 'N/A',
      greynoise_classification: gnData?.classification || 'unknown',
      greynoise_name: gnData?.name || '',
      greynoise_noise: gnData?.noise || false,
      greynoise_riot: gnData?.riot || false,
    },
    threat_intel: {
      otx_pulse_count: otxData?.pulse_count ?? 0,
      otx_reputation: otxData?.reputation ?? 0,
      threatfox_status: tfData?.status || 'N/A',
      threatfox_iocs: Array.isArray(tfData?.iocs) ? tfData.iocs.slice(0,5).map((i:any) => ({ malware: i.malware_printable, type: i.ioc_type, confidence: i.confidence_level, tags: i.tags })) : [],
      crtsh_domains: crtData?.domains || [],
    }
  };

  const prompt = `Eres un analista CTI senior. Analiza la IP ${osintData.ip} y genera un informe técnico en español con los datos OSINT reales proporcionados. NO uses frases genéricas. Cada afirmación debe basarse en los datos.

=== DATOS OSINT VERIFICADOS ===
${JSON.stringify(structuredData, null, 2)}

=== INSTRUCCIONES DE FORMATO ===
Genera EXACTAMENTE 6 secciones markdown. Se directo, tecnico y accionable.

## 0. EXECUTIVE SUMMARY
2-3 frases maximo. Nivel de riesgo, naturaleza de la amenaza, accion recomendada inmediata. Para un CISO que tiene 10 segundos.

## 1. BOTNET / C2 FINGERPRINT
Usa los puertos [${structuredData.ports.join(',')}], tags [${structuredData.banners.join(',')}], is_tor=${structuredData.is_tor}, OTX pulses=${structuredData.threat_intel.otx_pulse_count}, ThreatFox IOCs=${structuredData.threat_intel.threatfox_iocs.length} para determinar:
- Pertenece a infraestructura C2 conocida? (Mirai: 23/2323, Cobalt Strike: 443/80 con beacon, Emotet: 8080/8443)
- Familia de malware probable o descartada con justificacion
- Si es nodo Tor: implicaciones especificas para correlacion de ataques

## 2. THREAT ACTOR ATTRIBUTION
ASN: ${structuredData.network.asn} | Org: ${structuredData.network.org} | Pais: ${structuredData.network.country}
OTX pulses: ${structuredData.threat_intel.otx_pulse_count} | GreyNoise: ${structuredData.reputation.greynoise_classification} (${structuredData.reputation.greynoise_name})
- Cruza con APTs conocidos por pais/infraestructura
- Si es nodo Tor/VPN: explica por que la atribucion directa es imposible y que tecnicas permitirian atribucion indirecta
- Conclusion: atribuible o no, con razonamiento

## 3. INDICADORES DE COMPROMISO (IOCs)
Basado en datos reales:
- IP y CIDR: ${osintData.ip}/32
- Puertos confirmados: ${structuredData.ports.join(', ')}
- CVEs activos: ${structuredData.vulns.join(', ') || 'ninguno detectado'}
- ThreatFox IOCs: ${JSON.stringify(structuredData.threat_intel.threatfox_iocs)}
- OTX pulse count: ${structuredData.threat_intel.otx_pulse_count} campanas documentadas
- Dominios asociados (crt.sh): ${structuredData.threat_intel.crtsh_domains.slice(0,5).join(', ') || 'ninguno'}
- Categorias de abuso: ${structuredData.reputation.abuseipdb_categories.join(', ') || 'N/A'}

## 4. PERFIL DE SERVICIOS (inferencia pasiva)
Puertos detectados: ${structuredData.ports.join(', ')}
Tags Shodan: ${structuredData.banners.join(', ') || 'ninguno'}
- SO probable y stack de red
- Servicios activos y versiones si hay banner
- Vectores de ataque desde servicios expuestos

## 5. MITIGACION — COMANDOS EJECUTABLES
IP objetivo: ${osintData.ip}
Bloqueo inmediato:
  iptables -I INPUT -s ${osintData.ip} -j DROP
  iptables -I OUTPUT -d ${osintData.ip} -j DROP
  fail2ban-client set sshd banip ${osintData.ip}
Verificar conexiones activas:
  ss -tnp | grep ${osintData.ip}
Query ELK: GET /logs-*/_search { "query": { "bool": { "should": [{"term":{"source.ip":"${osintData.ip}"}},{"term":{"destination.ip":"${osintData.ip}"}}] } } }
Threat hunting: que mas buscar en red interna basado en los IOCs anteriores.`;


  // Intentar Gemini primero, fallback a Groq
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: { systemInstruction: 'Eres un analista CTI senior. Responde siempre en español con precisión técnica. No añadas disclaimers. Sé directo y accionable.' }
      });
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || response.text || '';
      return res.json({ analysis: text, threatScore, ip: osintData.ip, timestamp: new Date().toISOString(), engine: 'gemini' });
    } catch (geminiErr: any) {
      console.warn('Gemini failed, falling back to Groq:', geminiErr.message?.slice(0, 100));
    }
  }

  // Fallback Groq
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Eres un analista CTI senior especializado en threat intelligence. Responde SIEMPRE en español. Sé técnico, preciso y accionable. No añadas disclaimers legales ni advertencias genéricas.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.2
      });
      const text = completion.choices?.[0]?.message?.content || '';
      return res.json({ analysis: text, threatScore, ip: osintData.ip, timestamp: new Date().toISOString(), engine: 'groq' });
    } catch (groqErr: any) {
      return res.status(500).json({ error: 'Error en Groq', detail: groqErr.message });
    }
  }

  res.status(503).json({ error: 'No hay motor IA disponible. Configura GEMINI_API_KEY o GROQ_API_KEY.' });
});

app.get('/api/osint/ip-full/:ip', authMiddleware, planMiddleware, async (req: any, res) => {
  const ip = sanitizeTarget(req.params.ip);
  if (!isValidIP(ip)) return res.status(400).json({ error: 'Invalid IP address' });
  const results: any = { ip, timestamp: new Date().toISOString(), shodan: null, abuseipdb: null, virustotal: null, greynoise: null, ipinfo: null };
  await Promise.all([
    true
      ? fetch(`https://internetdb.shodan.io/${ip}`)
          .then(r => r.json()).then(d => { results.shodan = d; }).catch(e => { results.shodan = { error: e.message }; })
      : Promise.resolve(),
    process.env.ABUSEIPDB_API_KEY
      ? fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90`, { headers: { 'Key': process.env.ABUSEIPDB_API_KEY, 'Accept': 'application/json' } })
          .then(r => r.json()).then(d => { results.abuseipdb = d; }).catch(e => { results.abuseipdb = { error: e.message }; })
      : Promise.resolve(),
    process.env.VIRUSTOTAL_API_KEY
      ? fetch(`https://www.virustotal.com/api/v3/ip_addresses/${ip}`, { headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY } })
          .then(r => r.json()).then(d => { results.virustotal = d; }).catch(e => { results.virustotal = { error: e.message }; })
      : Promise.resolve(),
    // GreyNoise Community — siempre activo, key opcional
    fetch(`https://api.greynoise.io/v3/community/${ip}`, { 
        headers: process.env.GREYNOISE_API_KEY ? { key: process.env.GREYNOISE_API_KEY } : {} 
      })
      .then(r => r.json()).then(d => { results.greynoise = d; }).catch(e => { results.greynoise = { error: e.message }; }),
    process.env.IPINFO_API_KEY
      ? fetch(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_API_KEY}`)
          .then(r => r.json()).then(d => { results.ipinfo = d; }).catch(e => { results.ipinfo = { error: e.message }; })
      : Promise.resolve(),
    // AlienVault OTX — sin key
    fetch(`https://otx.alienvault.com/api/v1/indicators/IPv4/${ip}/general`)
      .then(r => r.json()).then(d => { results.otx = { pulse_count: d?.pulse_info?.count, reputation: d?.reputation, country: d?.country_name }; }).catch(() => {}),
    // ThreatFox — IOCs malware
    process.env.THREATFOX_API_KEY
      ? fetch('https://threatfox-api.abuse.ch/api/v1/', {
          method: 'POST',
          headers: { 'Auth-Key': process.env.THREATFOX_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'search_ioc', search_term: ip })
        }).then(r => r.json()).then(d => { results.threatfox = { status: d.query_status, iocs: d.data || [] }; }).catch(() => {})
      : Promise.resolve(),
    // crt.sh — subdominios via certificados
    fetch(`https://crt.sh/?q=${ip}&output=json`, { signal: AbortSignal.timeout(5000) })
      .then(r => r.json()).then(d => { results.crtsh = { count: d.length, domains: [...new Set(d.map((c: any) => c.name_value))].slice(0, 10) }; }).catch(() => {}),
  ]);
  saveScanHistory(req.user?.id, req.user?.plan || "free", ip, results, null);
  res.json(results);
});


// ═══════════════════════════════════════════════════════════
// MÓDULO AUDITORÍA / BENCHMARK — Sprint 19
// ═══════════════════════════════════════════════════════════

app.get('/api/audit/stats', async (_req, res) => {
  try {
    const sdb = (await import('./src/sqlite.js')).default;

    const c2Count    = (() => { try { return (sdb.prepare('SELECT COUNT(*) as n FROM threat_map').get() as any)?.n ?? 0; } catch { return 0; } })();
    const ufCount    = (() => { try { return (sdb.prepare('SELECT COUNT(*) as n FROM urlhaus_feed').get() as any)?.n ?? 0; } catch { return 0; } })();
    const usersCount = (() => { try { return (sdb.prepare('SELECT COUNT(*) as n FROM users').get() as any)?.n ?? 0; } catch { return 0; } })();
    const scansCount = (() => { try { return (sdb.prepare('SELECT COUNT(*) as n FROM scan_history').get() as any)?.n ?? 0; } catch { return 0; } })();

    const scoreDistrib = { critical: 0, high: 0, medium: 0, low: 0 };
    try {
      const rows = sdb.prepare('SELECT threat_score FROM scan_history').all() as any[];
      rows.forEach((r: any) => {
        const sc = r.threat_score || 0;
        if      (sc >= 80) scoreDistrib.critical++;
        else if (sc >= 60) scoreDistrib.high++;
        else if (sc >= 30) scoreDistrib.medium++;
        else               scoreDistrib.low++;
      });
    } catch {}

    const topCountries = (() => {
      try {
        return sdb.prepare(
          'SELECT country, COUNT(*) as count FROM threat_map WHERE country IS NOT NULL GROUP BY country ORDER BY count DESC LIMIT 5'
        ).all();
      } catch { return []; }
    })() as { country: string; count: number }[];

    const topAsns = (() => {
      try {
        return sdb.prepare(
          'SELECT org, COUNT(*) as count FROM threat_map WHERE org IS NOT NULL GROUP BY org ORDER BY count DESC LIMIT 5'
        ).all();
      } catch { return []; }
    })() as { org: string; count: number }[];

    const tools = ['nmap', 'dnsrecon', 'whois', 'nikto', 'traceroute', 'masscan'];
    const toolStatus: Record<string, boolean> = {};
    await Promise.all(tools.map(async (t) => {
      try {
        await new Promise<void>((ok, ko) =>
          require('child_process').exec(`which ${t}`, (err: any) => err ? ko(err) : ok())
        );
        toolStatus[t] = true;
      } catch { toolStatus[t] = false; }
    }));

    res.json({
      totals: {
        c2_tracked:       c2Count,
        urlhaus_urls:     ufCount,
        users_registered: usersCount,
        scans_total:      scansCount,
      },
      score_distribution: scoreDistrib,
      top_countries:      topCountries,
      top_asns:           topAsns,
      tool_status:        toolStatus,
      apis_configured: {
        abuseipdb:  !!process.env.ABUSEIPDB_API_KEY,
        virustotal: !!process.env.VIRUSTOTAL_API_KEY,
        ipinfo:     !!process.env.IPINFO_API_KEY,
        threatfox:  !!process.env.THREATFOX_API_KEY,
        groq:       !!process.env.GROQ_API_KEY,
        gemini:     !!process.env.GEMINI_API_KEY,
        telegram:   !!process.env.TELEGRAM_BOT_TOKEN,
      },
      generated_at: new Date().toISOString(),
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/audit/benchmark', authMiddleware, async (req: any, res) => {
  const { ip } = req.body;
  if (!ip || !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip))
    return res.status(400).json({ error: 'IP inválida' });

  const results: any = { ip, timestamp: new Date().toISOString(), sources: {} };

  const time = async (label: string, fn: () => Promise<any>) => {
    const t0 = Date.now();
    try   { results.sources[label] = { ok: true,  ms: Date.now() - t0, data: await fn() }; }
    catch (e: any) { results.sources[label] = { ok: false, ms: Date.now() - t0, error: e.message }; }
  };

  await Promise.all([
    time('InternetDB', async () => {
      const r = await fetch(`https://internetdb.shodan.io/${ip}`); return r.json();
    }),
    time('AbuseIPDB', async () => {
      if (!process.env.ABUSEIPDB_API_KEY) throw new Error('Sin API key');
      const r = await fetch(
        `https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90`,
        { headers: { 'Key': process.env.ABUSEIPDB_API_KEY!, 'Accept': 'application/json' } }
      );
      const d = await r.json();
      return { score: d?.data?.abuseConfidenceScore, reports: d?.data?.totalReports, isp: d?.data?.isp };
    }),
    time('VirusTotal', async () => {
      if (!process.env.VIRUSTOTAL_API_KEY) throw new Error('Sin API key');
      const r = await fetch(`https://www.virustotal.com/api/v3/ip_addresses/${ip}`,
        { headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY! } });
      const d = await r.json();
      const s = d?.data?.attributes?.last_analysis_stats;
      return { malicious: s?.malicious || 0, suspicious: s?.suspicious || 0, harmless: s?.harmless || 0 };
    }),
    time('GreyNoise', async () => {
      const r = await fetch(`https://api.greynoise.io/v3/community/${ip}`);
      const d = await r.json();
      return { classification: d?.classification, noise: d?.noise, riot: d?.riot };
    }),
    time('OTX', async () => {
      const r = await fetch(`https://otx.alienvault.com/api/v1/indicators/IPv4/${ip}/general`);
      const d = await r.json();
      return { pulses: d?.pulse_info?.count || 0, reputation: d?.reputation };
    }),
    time('ThreatFox', async () => {
      if (!process.env.THREATFOX_API_KEY) throw new Error('Sin API key');
      const r = await fetch('https://threatfox-api.abuse.ch/api/v1/', {
        method: 'POST',
        headers: { 'Auth-Key': process.env.THREATFOX_API_KEY!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'search_ioc', search_term: ip }),
      });
      const d = await r.json();
      return { status: d.query_status, ioc_count: (d.data || []).length };
    }),
  ]);

  let trScore = 0;
  const s = results.sources;
  if (s.AbuseIPDB?.ok)  trScore += Math.min(40, (s.AbuseIPDB.data.score  || 0) * 0.4);
  if (s.VirusTotal?.ok) trScore += Math.min(30, (s.VirusTotal.data.malicious || 0) * 5);
  if (s.OTX?.ok && s.OTX.data.pulses > 0) trScore += Math.min(20, s.OTX.data.pulses * 2);
  if (s.ThreatFox?.ok && s.ThreatFox.data.ioc_count > 0) trScore += 10;

  const keys      = Object.keys(results.sources);
  const sourcesOk = Object.values(results.sources).filter((v: any) => v.ok).length;
  const avgMs     = Math.round(
    Object.values(results.sources).reduce((acc: number, v: any) => acc + (v.ms || 0), 0) / keys.length
  );

  results.summary = {
    threatradar_score: Math.round(trScore),
    sources_queried:   keys.length,
    sources_ok:        sourcesOk,
    avg_response_ms:   avgMs,
    coverage_pct:      Math.round((sourcesOk / keys.length) * 100),
  };
  res.json(results);
});


// ═══════════════════════════════════════════════════════════
// HISTORIAL ROTACIONAL PREMIUM — Sprint 24
// ═══════════════════════════════════════════════════════════

// Crear tabla scan_history si no existe
(async () => {
  try {
    const sdb = (await import('./src/sqlite.js')).default;
    sdb.exec(`
      CREATE TABLE IF NOT EXISTS scan_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        ip TEXT NOT NULL,
        threat_score INTEGER,
        threat_level TEXT,
        country TEXT,
        isp TEXT,
        summary TEXT,
        sources_ok INTEGER,
        created_at TEXT NOT NULL
      )
    `);
    console.log('[scan_history] Tabla lista');
  } catch (e: any) { console.error('[scan_history] Error creando tabla:', e.message); }
})();

// Retención por plan en días
const RETENTION_DAYS: Record<string, number> = { free: 7, pro: 90, enterprise: 365 };

// Guardar scan en historial (llamado internamente tras /api/osint/ip-full)
async function saveScanHistory(userId: string, plan: string, ip: string, result: any, threatScore: any) {
  try {
    const sdb = (await import('./src/sqlite.js')).default;
    const id  = `sh-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    sdb.prepare(`
      INSERT INTO scan_history (id, user_id, ip, threat_score, threat_level, country, isp, summary, sources_ok, created_at, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, userId, ip,
      threatScore?.score ?? null,
      threatScore?.level ?? null,
      result?.ipinfo?.country ?? null,
      (result?.ipinfo?.org ?? '').slice(0, 80),
      threatScore?.conclusion?.summary?.slice(0, 300) ?? null,
      Object.values(result || {}).filter((v: any) => v && !v.error && typeof v === 'object').length,
      new Date().toISOString(),
      result?.ipinfo?.loc ? parseFloat(result.ipinfo.loc.split(',')[0]) : null,
      result?.ipinfo?.loc ? parseFloat(result.ipinfo.loc.split(',')[1]) : null
    );
    // Purgar entradas antiguas según plan
    const cutoff = new Date(Date.now() - (RETENTION_DAYS[plan] || 7) * 86400000).toISOString();
    sdb.prepare('DELETE FROM scan_history WHERE user_id = ? AND created_at < ?').run(userId, cutoff);
  } catch (e: any) { console.error('[scan_history] Error guardando:', e.message); }
}

// GET /api/history — historial del usuario autenticado
app.get('/api/history', authMiddleware, async (req: any, res) => {
  try {
    const sdb  = (await import('./src/sqlite.js')).default;
    const user = req.user;
    const plan = user.plan || 'free';
    const limit = plan === 'enterprise' ? 500 : plan === 'pro' ? 200 : 20;
    const rows = sdb.prepare(
      'SELECT * FROM scan_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
    ).all(user.id, limit);
    res.json({
      history: rows,
      plan,
      retention_days: RETENTION_DAYS[plan] || 7,
      total: rows.length,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/history/:id — eliminar entrada del historial
app.delete('/api/history/:id', authMiddleware, async (req: any, res) => {
  try {
    const sdb = (await import('./src/sqlite.js')).default;
    sdb.prepare('DELETE FROM scan_history WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});


// ═══════════════════════════════════════════════════════════
// WAF RECOMMENDATIONS ENGINE — Sprint 25
// ═══════════════════════════════════════════════════════════

app.post('/api/waf/recommend', authMiddleware, async (req: any, res) => {
  try {
    const { ip, osint_data } = req.body;
    if (!ip) return res.status(400).json({ error: 'IP requerida' });

    let data = osint_data || {};
    if (!osint_data) {
      const [internetdb, greynoise, abuseipdb] = await Promise.all([
        fetch(`https://internetdb.shodan.io/${ip}`).then(r => r.json()).catch(() => ({})),
        fetch(`https://api.greynoise.io/v3/community/${ip}`).then(r => r.json()).catch(() => ({})),
        process.env.ABUSEIPDB_API_KEY
          ? fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90`, {
              headers: { 'Key': process.env.ABUSEIPDB_API_KEY!, 'Accept': 'application/json' }
            }).then(r => r.json()).catch(() => ({}))
          : Promise.resolve({})
      ]);
      data = { shodan: internetdb, greynoise, abuseipdb };
    }

    const recommendations: { priority: string; category: string; rule: string; reason: string; command?: string }[] = [];
    const ports: number[] = data.shodan?.ports || [];
    const vulns: string[] = data.shodan?.vulns  || [];
    const tags: string[]  = data.shodan?.tags   || [];

    if (ports.includes(22))
      recommendations.push({ priority: 'HIGH', category: 'Access Control', rule: 'Bloquear SSH público', reason: 'Puerto 22 expuesto — vector de fuerza bruta', command: `ufw deny from ${ip} to any port 22` });
    if (ports.includes(3389))
      recommendations.push({ priority: 'CRITICAL', category: 'Access Control', rule: 'Bloquear RDP', reason: 'Puerto 3389 (RDP) expuesto — alto riesgo ransomware', command: `ufw deny from ${ip} to any port 3389` });
    if (ports.includes(445))
      recommendations.push({ priority: 'CRITICAL', category: 'Access Control', rule: 'Bloquear SMB', reason: 'Puerto 445 (SMB) expuesto — vector EternalBlue/ransomware', command: `ufw deny from ${ip} to any port 445` });
    if (ports.includes(23))
      recommendations.push({ priority: 'CRITICAL', category: 'Access Control', rule: 'Bloquear Telnet', reason: 'Puerto 23 (Telnet) sin cifrado — credenciales en claro', command: `ufw deny from ${ip} to any port 23` });
    if (ports.includes(1433) || ports.includes(3306) || ports.includes(5432))
      recommendations.push({ priority: 'HIGH', category: 'Database Exposure', rule: 'Bloquear puertos DB', reason: `BD expuesta públicamente (${ports.filter((p: number) => [1433,3306,5432].includes(p)).join(',')})`, command: `ufw deny from ${ip} to any port 1433,3306,5432` });
    if (vulns.length > 0)
      recommendations.push({ priority: 'CRITICAL', category: 'CVE', rule: 'CVEs detectados — parchear inmediatamente', reason: `CVEs activos: ${vulns.slice(0,5).join(', ')}` });
    if (tags.includes('tor'))
      recommendations.push({ priority: 'HIGH', category: 'Anonymizer', rule: 'Bloquear nodo Tor', reason: 'IP identificada como nodo Tor de salida', command: `ufw deny from ${ip}` });
    if (tags.includes('vpn'))
      recommendations.push({ priority: 'MEDIUM', category: 'Anonymizer', rule: 'Monitorizar VPN', reason: 'IP asociada a servicio VPN — posible evasión' });
    if (tags.includes('scanner'))
      recommendations.push({ priority: 'HIGH', category: 'Scanner', rule: 'Bloquear scanner conocido', reason: 'IP clasificada como scanner activo por Shodan', command: `ufw deny from ${ip}` });

    const gn = data.greynoise || {};
    if (gn.classification === 'malicious')
      recommendations.push({ priority: 'CRITICAL', category: 'Threat Intel', rule: 'IP maliciosa confirmada GreyNoise', reason: `GreyNoise: ${gn.name || 'actor malicioso'} — bloqueo inmediato`, command: `ufw deny from ${ip}` });
    if (gn.classification === 'benign' && gn.noise)
      recommendations.push({ priority: 'LOW', category: 'Scanner', rule: 'IP scanner benigno (GreyNoise)', reason: `${gn.name || 'scanner'} — considerar allowlist si es legítimo` });
    if (gn.riot === true)
      recommendations.push({ priority: 'INFO', category: 'Allowlist', rule: 'IP en RIOT — servicio legítimo conocido', reason: `GreyNoise RIOT: ${gn.name || 'servicio conocido'} — probablemente no bloquear` });

    const abuse = data.abuseipdb?.data || {};
    if ((abuse.abuseConfidenceScore || 0) >= 80)
      recommendations.push({ priority: 'CRITICAL', category: 'Threat Intel', rule: 'IP con alto abuse score', reason: `AbuseIPDB: ${abuse.abuseConfidenceScore}% confianza, ${abuse.totalReports} reportes`, command: `ufw deny from ${ip}` });
    else if ((abuse.abuseConfidenceScore || 0) >= 40)
      recommendations.push({ priority: 'HIGH', category: 'Threat Intel', rule: 'IP sospechosa AbuseIPDB', reason: `AbuseIPDB: ${abuse.abuseConfidenceScore}% confianza — monitorizar` });

    const cfRules: string[] = [];
    if (gn.classification === 'malicious' || (abuse.abuseConfidenceScore || 0) >= 80)
      cfRules.push(`Crear regla WAF Cloudflare: (ip.src eq ${ip}) → Block`);
    if (ports.includes(80) || ports.includes(443))
      cfRules.push('Activar Cloudflare Bot Fight Mode para tráfico web desde esta IP');
    if (vulns.length > 0)
      cfRules.push('Activar Cloudflare Managed Rules (OWASP) — CVEs detectados en host');

    if (cfRules.length === 0 && recommendations.length === 0)
      recommendations.push({ priority: 'INFO', category: 'General', rule: 'Sin amenazas detectadas', reason: 'No se identificaron indicadores de riesgo en esta IP' });

    const order: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
    recommendations.sort((a, b) => (order[a.priority] ?? 9) - (order[b.priority] ?? 9));

    res.json({
      ip,
      recommendations,
      cloudflare_rules: cfRules,
      summary: {
        total: recommendations.length,
        critical: recommendations.filter(r => r.priority === 'CRITICAL').length,
        high: recommendations.filter(r => r.priority === 'HIGH').length,
        ports_analyzed: ports.length,
        vulns_found: vulns.length,
      },
      generated_at: new Date().toISOString()
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Vite Middleware
async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(distPath);
  const isProduction = process.env.NODE_ENV === 'production' && hasDist;

  if (!isProduction) {
    console.log("Starting ThreatRadar OSINT in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use((req, res, next) => { if (req.path.startsWith("/api")) { return next(); } vite.middlewares(req, res, next); });
  } else {
    console.log("Starting ThreatRadar OSINT in production mode...");
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ThreatRadar OSINT running on http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
    console.log(`Gemini AI: ${GEMINI_API_KEY ? 'configured' : 'not configured'}`);
    console.log(`Stripe: ${process.env.STRIPE_SECRET_KEY ? 'configured' : 'not configured'}`);
  });
}

startServer();
