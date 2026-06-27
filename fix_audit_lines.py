#!/usr/bin/env python3
import os, sys

SERVER = os.path.expanduser('~/threatradar-osint/server.ts')
with open(SERVER, 'r') as f:
    lines = f.readlines()

start_idx = None
end_idx   = None
for i, line in enumerate(lines):
    if "app.get('/api/audit/stats', async (_req, res) => {" in line:
        start_idx = i
    if start_idx and i > start_idx and "app.post('/api/audit/benchmark'" in line:
        end_idx = i
        break

if start_idx is None or end_idx is None:
    print(f"ERROR: start={start_idx} end={end_idx}"); sys.exit(1)

print(f"Reemplazando líneas {start_idx+1}–{end_idx}")

NEW_BLOCK = """app.get('/api/audit/stats', async (_req, res) => {
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

"""

new_lines = lines[:start_idx] + [NEW_BLOCK] + lines[end_idx:]
with open(SERVER, 'w') as f:
    f.writelines(new_lines)
print("OK — audit/stats reescrito por número de línea, benchmark intacto")
