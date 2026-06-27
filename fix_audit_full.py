#!/usr/bin/env python3
"""Fix completo /api/audit/stats — reemplaza todo el bloque hasta res.json()"""
import os, sys

SERVER = os.path.expanduser('~/threatradar-osint/server.ts')
with open(SERVER, 'r') as f:
    s = f.read()

# Localizar el bloque completo del endpoint audit/stats
START = "app.get('/api/audit/stats', async (_req, res) => {"
END   = "});\n\n// POST /api/audit/benchmark"

if START not in s or END not in s:
    print("ERROR: marcadores no encontrados")
    print("START found:", START in s)
    print("END found:", END in s)
    sys.exit(1)

idx_start = s.index(START)
idx_end   = s.index(END)

NEW_BLOCK = """app.get('/api/audit/stats', async (_req, res) => {
  try {
    // SQLite directo — export default db desde sqlite.ts
    const sdb = (await import('./src/sqlite.js')).default;

    const c2Count    = (() => { try { return (sdb.prepare('SELECT COUNT(*) as n FROM threat_map').get() as any)?.n ?? 0; } catch { return 0; } })();
    const ufCount    = (() => { try { return (sdb.prepare('SELECT COUNT(*) as n FROM urlhaus_feed').get() as any)?.n ?? 0; } catch { return 0; } })();
    const usersCount = (() => { try { return (sdb.prepare('SELECT COUNT(*) as n FROM users').get() as any)?.n ?? 0; } catch { return 0; } })();
    const scansCount = (() => { try { return (sdb.prepare("SELECT COUNT(*) as n FROM scan_history").get() as any)?.n ?? 0; } catch { return 0; } })();

    // Distribución de scores desde scan_history
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

    // Top países desde threat_map
    const topCountries = (() => {
      try {
        return sdb.prepare(
          'SELECT country, COUNT(*) as count FROM threat_map WHERE country IS NOT NULL GROUP BY country ORDER BY count DESC LIMIT 5'
        ).all();
      } catch { return []; }
    })() as { country: string; count: number }[];

    // Top ASNs desde threat_map
    const topAsns = (() => {
      try {
        return sdb.prepare(
          'SELECT org, COUNT(*) as count FROM threat_map WHERE org IS NOT NULL GROUP BY org ORDER BY count DESC LIMIT 5'
        ).all();
      } catch { return []; }
    })() as { org: string; count: number }[];

    // Estado herramientas CLI
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

"""

s = s[:idx_start] + NEW_BLOCK + s[idx_end:]
with open(SERVER, 'w') as f:
    f.write(s)
print("OK — bloque audit/stats reescrito completamente")
