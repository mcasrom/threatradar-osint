import express from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';
import { readDB, writeDB, GEMINI_API_KEY, APP_URL } from './src/db';
import { GoogleGenAI } from '@google/genai';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { registerUser, loginUser, generateToken, authMiddleware, planMiddleware } from './src/auth';

const execAsync = promisify(exec);

// Initialize Gemini client
let ai: GoogleGenAI | null = null;
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
const PORT = process.env.PORT || 3000;

// --- Security Middleware ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://ipapi.co", "https://api.ipify.org"],
    },
  },
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
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Report generation limit reached. Try again later.' },
});

const scanLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: { error: 'Scan limit reached. Try again later.' },
});

app.use('/api/', apiLimiter);
app.use('/api/premium-report', reportLimiter);
app.use('/api/reports/auto-generate', reportLimiter);
app.use('/api/modules/run', scanLimiter);

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
    const { stdout } = execSync(`which ${tool}`, { encoding: 'utf-8' });
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

const sanitizeTarget = (target: string): string => {
  return target.replace(/[;&|`$(){}[\]<>\\]/g, '').trim();
};

// --- API Endpoints ---

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
    hasSmtpConfig: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
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
    let command = mod.commandTemplate.replace('{target}', sanitizedTarget);
    
    // Security validation
    if (command.includes(';') || command.includes('|') || command.includes('&&') || 
        command.includes('`') || command.includes('$(') || command.includes('\n')) {
      return res.status(400).json({ error: 'Command contains invalid characters' });
    }

    const { stdout, stderr } = await execAsync(command, { 
      timeout: 120000,
      maxBuffer: 20 * 1024 * 1024 
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Act as a military-grade security analyst. Provide high-fidelity technical advice in Spanish/English.',
      }
    });

    const reportText = response.text || 'No response generated.';
    const scoreMatch = reportText.match(/(score|puntuación|postura|health)[:\s]+(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[2]) : 68;

    res.json({ report: reportText, score });
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

  if (ai) {
    try {
      const gRes = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Generate a ${period} security summary report. Active modules: ${modules.length}. Focus on OSINT findings and mitigation. Markdown format.`,
      });
      if (gRes.text) analysisText = gRes.text;
    } catch {
      // Fallback
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
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const fromAddress = process.env.SMTP_FROM || '"ThreatRadar SOC" <no-reply@threatradar-osint.com>';

    if (!host || !user || !pass) {
      emailStatus = 'SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env';
    } else {
      try {
        const transporter = nodemailer.createTransport({
          host,
          port: Number(port) || 587,
          secure: Number(port) === 465,
          auth: { user, pass }
        });

        await transporter.sendMail({
          from: fromAddress,
          to: emailTo,
          subject: `[ThreatRadar] ${period.toUpperCase()} Security Report - ${newReport.id}`,
          text: analysisText,
          html: `<div style="font-family: sans-serif; padding: 20px; background: #0c1322; color: #f4f4f5;">
            <h2 style="color: #00f2ff;">ThreatRadar Report [${period.toUpperCase()}]</h2>
            <p>ID: ${newReport.id} | Date: ${new Date().toUTCString()}</p>
            <pre style="background: #090e17; padding: 15px; border-radius: 4px;">${analysisText}</pre>
          </div>`
        });
        emailStatus = `Email sent to ${emailTo} via SMTP`;
      } catch (err: any) {
        emailStatus = `SMTP error: ${err?.message}`;
      }
    }
  }

  db.logReports.unshift(newReport);
  writeDB(db);

  res.json({
    success: true,
    report: newReport,
    notificationMessage: `Report compiled. ${emailTo ? `Email: ${emailStatus}` : 'No email configured.'}`
  });
});

app.get('/api/reports/auto-generate', (req, res) => {
  const db = readDB();
  res.json(db.logReports || []);
});

// 8. Stripe Billing
app.post('/api/billing/setup', async (req, res) => {
  const { planName, email } = req.body;
  if (!planName) {
    return res.status(400).json({ error: 'planName required' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(503).json({ 
      error: 'Stripe not configured. Set STRIPE_SECRET_KEY in .env',
      setup: 'https://dashboard.stripe.com/apikeys'
    });
  }

  try {
    const stripe = require('stripe')(stripeKey);
    
    const priceMap: Record<string, string> = {
      'BASIC': process.env.STRIPE_PRICE_BASIC || '',
      'PREMIUM': process.env.STRIPE_PRICE_PREMIUM || '',
      'ENTERPRISE': process.env.STRIPE_PRICE_ENTERPRISE || ''
    };

    const priceId = priceMap[planName.toUpperCase()];
    if (!priceId) {
      return res.status(400).json({ error: `Invalid plan: ${planName}` });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${APP_URL}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}?payment=cancelled`,
      metadata: { plan: planName }
    });

    const db = readDB();
    db.activeSubscriptions = db.activeSubscriptions || [];
    db.activeSubscriptions.push({
      id: `SUB-${Date.now()}`,
      plan: planName,
      email: email || 'anonymous@domain.com',
      status: 'pending',
      stripeSessionId: session.id,
      date: new Date().toISOString()
    });
    writeDB(db);

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
      const db = readDB();
      const sub = db.activeSubscriptions?.find((s: any) => s.stripeSessionId === session.id);
      if (sub) {
        sub.status = 'completed';
        writeDB(db);
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// 9. External API integrations (proxied through server for security)

app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const user = await registerUser(email, password);
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
  const db = readDB();
  const user = db.users.find((u: any) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
  const used = user.scanCount?.[monthKey] || 0;
  const limits = { free: 10, pro: -1, enterprise: -1 };
  const limit = limits[user.plan as keyof typeof limits] ?? 10;
  res.json({ email: user.email, plan: user.plan, scansUsed: used, scansLimit: limit, month: monthKey });
});
app.get('/api/osint/shodan/:ip', async (req, res) => {
  const apiKey = process.env.SHODAN_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'Shodan API key not configured' });
  
  const ip = sanitizeTarget(req.params.ip);
  if (!isValidIP(ip)) return res.status(400).json({ error: 'Invalid IP' });

  try {
    const response = await fetch(`https://api.shodan.io/shodan/host/${ip}?key=${apiKey}`);
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/osint/abuseipdb/:ip', async (req, res) => {
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

app.get('/api/osint/virustotal/:ip', async (req, res) => {
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

app.get('/api/osint/hibp/:email', async (req, res) => {
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

app.get('/api/osint/hunter/:domain', async (req, res) => {
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
});

app.get('/api/osint/ip-full/:ip', authMiddleware, planMiddleware, async (req: any, res) => {
  const ip = sanitizeTarget(req.params.ip);
  if (!isValidIP(ip)) return res.status(400).json({ error: 'Invalid IP address' });
  const results: any = { ip, timestamp: new Date().toISOString(), shodan: null, abuseipdb: null, virustotal: null };
  await Promise.all([
    process.env.SHODAN_API_KEY
      ? fetch(`https://api.shodan.io/shodan/host/${ip}?key=${process.env.SHODAN_API_KEY}`)
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
  ]);
  res.json(results);
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
