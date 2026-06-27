#!/usr/bin/env python3
"""Sprint 19 — Módulo Auditoría/Benchmark"""
import sys, os

BASE   = os.path.expanduser('~/threatradar-osint')
SERVER = f'{BASE}/server.ts'
APP    = f'{BASE}/src/App.tsx'
AUDIT  = f'{BASE}/src/components/AuditPanel.tsx'

for p in [SERVER, APP]:
    if not os.path.exists(p):
        print(f"ERROR: no encontrado → {p}"); sys.exit(1)

# ── 1. ENDPOINTS backend ──────────────────────────────────────
AUDIT_ENDPOINTS = '''
// ═══════════════════════════════════════════════════════════
// MÓDULO AUDITORÍA / BENCHMARK — Sprint 19
// ═══════════════════════════════════════════════════════════

app.get('/api/audit/stats', async (_req, res) => {
  try {
    const db    = readDB();
    const tm    = (db.threat_map    || []) as any[];
    const uf    = (db.urlhaus_feed  || []) as any[];
    const users = (db.users         || []) as any[];
    const scans = (db.scan_history  || []) as any[];

    const scoreDistrib = { critical: 0, high: 0, medium: 0, low: 0 };
    scans.forEach((s: any) => {
      const score = s.threat_score || 0;
      if      (score >= 80) scoreDistrib.critical++;
      else if (score >= 60) scoreDistrib.high++;
      else if (score >= 30) scoreDistrib.medium++;
      else                  scoreDistrib.low++;
    });

    const countryCounts: Record<string, number> = {};
    tm.forEach((p: any) => {
      if (p.country) countryCounts[p.country] = (countryCounts[p.country] || 0) + 1;
    });
    const topCountries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([country, count]) => ({ country, count }));

    const asnCounts: Record<string, number> = {};
    tm.forEach((p: any) => {
      if (p.org) asnCounts[p.org] = (asnCounts[p.org] || 0) + 1;
    });
    const topAsns = Object.entries(asnCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([org, count]) => ({ org, count }));

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
        c2_tracked: tm.length, urlhaus_urls: uf.length,
        users_registered: users.length, scans_total: scans.length,
      },
      score_distribution: scoreDistrib,
      top_countries: topCountries,
      top_asns: topAsns,
      tool_status: toolStatus,
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
  if (!ip || !/^(\\d{1,3}\\.){3}\\d{1,3}$/.test(ip))
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

'''

with open(SERVER, 'r') as f: server = f.read()
ANCHOR = '// Vite Middleware'
if ANCHOR not in server:
    print(f"ERROR: ancla no encontrada: '{ANCHOR}'"); sys.exit(1)
if '/api/audit/stats' not in server:
    server = server.replace(ANCHOR, AUDIT_ENDPOINTS + ANCHOR)
    with open(SERVER, 'w') as f: f.write(server)
    print("OK server.ts endpoints añadidos")
else:
    print("INFO server.ts ya tiene endpoints de auditoría")

# ── 2. AuditPanel.tsx ─────────────────────────────────────────
AUDIT_TSX = r"""import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, XCircle, Zap, Globe, Database, Cpu, AlertTriangle } from 'lucide-react';

interface AuditStats {
  totals: { c2_tracked: number; urlhaus_urls: number; users_registered: number; scans_total: number };
  score_distribution: { critical: number; high: number; medium: number; low: number };
  top_countries: { country: string; count: number }[];
  top_asns: { org: string; count: number }[];
  tool_status: Record<string, boolean>;
  apis_configured: Record<string, boolean>;
  generated_at: string;
}
interface BenchmarkResult {
  ip: string;
  sources: Record<string, { ok: boolean; ms: number; data?: any; error?: string }>;
  summary: { threatradar_score: number; sources_queried: number; sources_ok: number; avg_response_ms: number; coverage_pct: number };
}

export function AuditPanel() {
  const [stats, setStats]               = useState<AuditStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [benchIp, setBenchIp]           = useState('');
  const [benchResult, setBenchResult]   = useState<BenchmarkResult | null>(null);
  const [benchLoading, setBenchLoading] = useState(false);
  const [benchError, setBenchError]     = useState('');

  useEffect(() => {
    fetch('/api/audit/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoadingStats(false); })
      .catch(() => setLoadingStats(false));
  }, []);

  const runBenchmark = async () => {
    if (!benchIp.trim()) return;
    setBenchLoading(true); setBenchError(''); setBenchResult(null);
    const token = localStorage.getItem('threatradar_token');
    try {
      const r = await fetch('/api/audit/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ip: benchIp.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Error');
      setBenchResult(d);
    } catch (e: any) { setBenchError(e.message); }
    finally { setBenchLoading(false); }
  };

  const scoreColor = (s: number) => s >= 80 ? 'text-red-400' : s >= 60 ? 'text-yellow-400' : s >= 30 ? 'text-cyan-400' : 'text-green-400';
  const scoreBar   = (s: number) => s >= 80 ? 'bg-red-500'   : s >= 60 ? 'bg-yellow-500'   : s >= 30 ? 'bg-cyan-500'   : 'bg-green-500';

  return (
    <div className="space-y-6">

      <div className="bg-brand-panel border border-brand-border rounded-lg p-4">
        <div className="flex items-center gap-3 mb-1">
          <Cpu size={18} className="text-brand-cyan" />
          <h2 className="text-sm font-bold text-white font-mono tracking-wider">MÓDULO AUDITORÍA &amp; BENCHMARK</h2>
          <span className="text-[9px] bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 rounded font-mono px-2 py-0.5">SPRINT 19</span>
        </div>
        <p className="text-[11px] text-zinc-400 font-mono">Métricas internas del sistema + benchmark comparativo contra fuentes OSINT externas.</p>
      </div>

      {loadingStats ? (
        <div className="text-center py-8 text-zinc-500 font-mono text-xs animate-pulse">Cargando métricas...</div>
      ) : stats ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <div className="bg-brand-panel border border-brand-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-brand-border pb-2">
              <Database size={14} className="text-brand-cyan" />
              <span className="text-[11px] font-bold text-zinc-300 font-mono tracking-wider">TOTALES DEL SISTEMA</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'C2s rastreados',    value: stats.totals.c2_tracked,       color: 'text-red-400'    },
                { label: 'URLs URLHaus',       value: stats.totals.urlhaus_urls,     color: 'text-yellow-400' },
                { label: 'Usuarios reg.',      value: stats.totals.users_registered, color: 'text-cyan-400'   },
                { label: 'Scans totales',      value: stats.totals.scans_total,      color: 'text-green-400'  },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-brand-bg border border-brand-border rounded p-3">
                  <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-brand-panel border border-brand-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-brand-border pb-2">
              <Activity size={14} className="text-brand-cyan" />
              <span className="text-[11px] font-bold text-zinc-300 font-mono tracking-wider">DISTRIBUCIÓN DE SCORES</span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'CRITICAL (≥80)', count: stats.score_distribution.critical, bar: 'bg-red-500',    text: 'text-red-400'    },
                { label: 'HIGH (60-79)',   count: stats.score_distribution.high,     bar: 'bg-yellow-500', text: 'text-yellow-400' },
                { label: 'MEDIUM (30-59)',count: stats.score_distribution.medium,   bar: 'bg-cyan-500',   text: 'text-cyan-400'   },
                { label: 'LOW (<30)',      count: stats.score_distribution.low,      bar: 'bg-green-500',  text: 'text-green-400'  },
              ].map(({ label, count, bar, text }) => {
                const total = Object.values(stats.score_distribution).reduce((a, b) => a + b, 0) || 1;
                const pct   = Math.round((count / total) * 100);
                return (
                  <div key={label}>
                    <div className="flex justify-between text-[10px] font-mono mb-1">
                      <span className={text}>{label}</span>
                      <span className="text-zinc-400">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-brand-bg rounded-full overflow-hidden">
                      <div className={`h-full ${bar} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-brand-panel border border-brand-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-brand-border pb-2">
              <Globe size={14} className="text-brand-cyan" />
              <span className="text-[11px] font-bold text-zinc-300 font-mono tracking-wider">APIs CONFIGURADAS</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(stats.apis_configured).map(([api, ok]) => (
                <div key={api} className="flex items-center gap-2 text-[10px] font-mono">
                  {ok ? <CheckCircle size={11} className="text-green-400 shrink-0" /> : <XCircle size={11} className="text-red-400 shrink-0" />}
                  <span className={ok ? 'text-zinc-300' : 'text-zinc-600'}>{api.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-brand-panel border border-brand-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-brand-border pb-2">
              <Zap size={14} className="text-brand-cyan" />
              <span className="text-[11px] font-bold text-zinc-300 font-mono tracking-wider">HERRAMIENTAS CLI</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(stats.tool_status).map(([tool, ok]) => (
                <div key={tool} className="flex items-center gap-2 text-[10px] font-mono">
                  {ok ? <CheckCircle size={11} className="text-green-400 shrink-0" /> : <XCircle size={11} className="text-zinc-600 shrink-0" />}
                  <span className={ok ? 'text-zinc-300' : 'text-zinc-600'}>{tool}</span>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-zinc-600 font-mono pt-1">
              Generado: {stats.generated_at ? new Date(stats.generated_at).toLocaleString('es-ES') : '-'}
            </p>
          </div>

          {stats.top_countries.length > 0 && (
            <div className="bg-brand-panel border border-brand-border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-brand-border pb-2">
                <Globe size={14} className="text-yellow-400" />
                <span className="text-[11px] font-bold text-zinc-300 font-mono tracking-wider">TOP PAÍSES — C2 HOSTING</span>
              </div>
              <div className="space-y-2">
                {stats.top_countries.map(({ country, count }, i) => (
                  <div key={country} className="flex justify-between text-[11px] font-mono">
                    <span className="text-zinc-300"><span className="text-zinc-600 mr-2">#{i + 1}</span>{country}</span>
                    <span className="text-yellow-400 font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.top_asns.length > 0 && (
            <div className="bg-brand-panel border border-brand-border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-brand-border pb-2">
                <Activity size={14} className="text-red-400" />
                <span className="text-[11px] font-bold text-zinc-300 font-mono tracking-wider">TOP ASNs — C2 HOSTING</span>
              </div>
              <div className="space-y-2">
                {stats.top_asns.map(({ org, count }, i) => (
                  <div key={org} className="flex justify-between text-[11px] font-mono">
                    <span className="text-zinc-300 truncate max-w-[70%]"><span className="text-zinc-600 mr-2">#{i + 1}</span>{org}</span>
                    <span className="text-red-400 font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-zinc-500 font-mono text-xs">Error cargando métricas.</div>
      )}

      <div className="bg-brand-panel border border-brand-border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 border-b border-brand-border pb-3">
          <AlertTriangle size={14} className="text-yellow-400" />
          <span className="text-[11px] font-bold text-zinc-300 font-mono tracking-wider">BENCHMARK COMPARATIVO — IP vs FUENTES OSINT</span>
        </div>
        <p className="text-[11px] text-zinc-400 font-mono">
          Consulta una IP en paralelo contra todas las fuentes configuradas. Mide cobertura, latencia y genera un score compuesto ThreatRadar.
        </p>
        <div className="flex gap-2">
          <input
            type="text" value={benchIp} onChange={e => setBenchIp(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runBenchmark()}
            placeholder="Ej: 185.220.101.50"
            className="flex-1 bg-brand-bg border border-brand-border rounded px-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-brand-cyan"
          />
          <button onClick={runBenchmark} disabled={benchLoading || !benchIp.trim()}
            className="px-4 py-2 bg-brand-cyan text-brand-bg text-xs font-bold font-mono rounded hover:opacity-90 disabled:opacity-40 transition">
            {benchLoading ? 'ANALIZANDO...' : 'EJECUTAR'}
          </button>
        </div>

        {benchError && (
          <div className="text-red-400 text-xs font-mono bg-red-400/10 border border-red-400/20 rounded p-2">{benchError}</div>
        )}

        {benchResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'TR SCORE',     value: `${benchResult.summary.threatradar_score}/100`, color: scoreColor(benchResult.summary.threatradar_score) },
                { label: 'COBERTURA',    value: `${benchResult.summary.coverage_pct}%`,          color: 'text-cyan-400'  },
                { label: 'FUENTES OK',   value: `${benchResult.summary.sources_ok}/${benchResult.summary.sources_queried}`, color: 'text-green-400' },
                { label: 'AVG LATENCIA', value: `${benchResult.summary.avg_response_ms}ms`,      color: 'text-zinc-300'  },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-brand-bg border border-brand-border rounded p-3 text-center">
                  <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
                  <div className="text-[9px] text-zinc-500 font-mono mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                <span>ThreatRadar Score — {benchResult.ip}</span>
                <span className={scoreColor(benchResult.summary.threatradar_score)}>{benchResult.summary.threatradar_score}/100</span>
              </div>
              <div className="h-2 bg-brand-bg border border-brand-border rounded-full overflow-hidden">
                <div className={`h-full ${scoreBar(benchResult.summary.threatradar_score)} rounded-full transition-all`}
                     style={{ width: `${benchResult.summary.threatradar_score}%` }} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] font-mono">
                <thead>
                  <tr className="border-b border-brand-border text-zinc-500">
                    <th className="text-left py-2 pr-4">FUENTE</th>
                    <th className="text-left py-2 pr-4">ESTADO</th>
                    <th className="text-left py-2 pr-4">LATENCIA</th>
                    <th className="text-left py-2">RESULTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(benchResult.sources).map(([src, r]) => (
                    <tr key={src} className="border-b border-brand-border/40 hover:bg-brand-bg/40">
                      <td className="py-2 pr-4 text-white font-bold">{src}</td>
                      <td className="py-2 pr-4">
                        {r.ok
                          ? <span className="text-green-400 flex items-center gap-1"><CheckCircle size={10}/> OK</span>
                          : <span className="text-red-400 flex items-center gap-1"><XCircle size={10}/> FAIL</span>}
                      </td>
                      <td className="py-2 pr-4 text-zinc-400">{r.ms}ms</td>
                      <td className="py-2 text-zinc-300 max-w-xs truncate">
                        {r.ok
                          ? (() => { const s = JSON.stringify(r.data); return s.length > 90 ? s.slice(0,90)+'…' : s; })()
                          : <span className="text-red-400">{r.error}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
"""

with open(AUDIT, 'w') as f: f.write(AUDIT_TSX)
print("OK AuditPanel.tsx creado")

# ── 3. App.tsx ────────────────────────────────────────────────
with open(APP, 'r') as f: app_src = f.read()
changed = False

OLD_IMPORT = "import { AuthPanel } from './components/AuthPanel';"
NEW_IMPORT  = OLD_IMPORT + "\nimport { AuditPanel } from './components/AuditPanel';"
if 'AuditPanel' not in app_src:
    app_src = app_src.replace(OLD_IMPORT, NEW_IMPORT); changed = True

OLD_TYPE = "useState<'monitor' | 'osint' | 'ai-report' | 'dispatch' | 'billing' | 'pricing' | 'docs' | 'dashboard'>('monitor')"
NEW_TYPE = "useState<'monitor' | 'osint' | 'ai-report' | 'dispatch' | 'billing' | 'pricing' | 'docs' | 'dashboard' | 'audit'>('monitor')"
if OLD_TYPE in app_src:
    app_src = app_src.replace(OLD_TYPE, NEW_TYPE); changed = True

DOCS_BTN_END = "            <BookOpen size={14} /> FAQs & Metodología\n          </button>"
AUDIT_BTN = """\n          <button
            onClick={() => setActiveTab('audit')}
            className={`flex-1 py-2 px-3 text-xs font-sans font-semibold rounded-md transition flex justify-center items-center gap-2 ${
              activeTab === 'audit' ? 'bg-brand-cyan text-brand-bg shadow font-bold' : 'text-zinc-400 hover:bg-brand-panel hover:text-white'
            }`}
          >
            <Activity size={14} /> Auditoría
          </button>"""
if "Auditoría" not in app_src and DOCS_BTN_END in app_src:
    app_src = app_src.replace(DOCS_BTN_END, DOCS_BTN_END + AUDIT_BTN); changed = True

if "activeTab === 'audit'" not in app_src:
    CLOSE = "        </div>\n      </main>"
    if CLOSE in app_src:
        app_src = app_src.replace(CLOSE, "          {activeTab === 'audit' && <AuditPanel />}\n" + CLOSE)
        changed = True

with open(APP, 'w') as f: f.write(app_src)
print(f"OK App.tsx {'parcheado' if changed else 'ya estaba actualizado'}")
print("\nDONE — Sprint 19 módulo auditoría listo")
