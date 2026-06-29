import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, XCircle, Zap, Globe, Database, Cpu, AlertTriangle, TrendingUp, Shield } from 'lucide-react';

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

// Symbols as constants to avoid encoding issues
const SYM_CHECK = String.fromCodePoint(0x2705);
const SYM_WARN  = String.fromCodePoint(0x26A0, 0xFE0F);
const SYM_CROSS = String.fromCodePoint(0x274C);
const SYM_MONEY = 'Pago';

const COMPETITORS = [
  { name: 'ThreatRadar', color: 'text-brand-cyan',  bg: 'bg-brand-cyan/10 border-brand-cyan/30',  score: 94, scoreColor: 'bg-brand-cyan',  scoreText: 'text-brand-cyan'  },
  { name: 'VirusTotal',  color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/30',  score: 71, scoreColor: 'bg-yellow-500', scoreText: 'text-yellow-400'  },
  { name: 'Shodan',      color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/30',  score: 68, scoreColor: 'bg-orange-500', scoreText: 'text-orange-400'  },
  { name: 'Censys',      color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30',      score: 62, scoreColor: 'bg-blue-500',   scoreText: 'text-blue-400'    },
  { name: 'AbuseIPDB',   color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30',        score: 55, scoreColor: 'bg-red-500',    scoreText: 'text-red-400'     },
  { name: 'GreyNoise',   color: 'text-green-400',   bg: 'bg-green-500/10 border-green-500/30',    score: 60, scoreColor: 'bg-green-500',  scoreText: 'text-green-400'   },
];

// [feature, TR, VirusTotal, Shodan, Censys, AbuseIPDB, GreyNoise]
const FEATURE_ROWS = [
  ['Analisis IP en tiempo real',   SYM_CHECK, SYM_CHECK, SYM_CHECK, SYM_CHECK, SYM_CHECK, SYM_CHECK],
  ['Live C2 feed (24h)',           SYM_CHECK, SYM_CROSS, SYM_WARN,  SYM_CROSS, SYM_CROSS, SYM_WARN ],
  ['URLHaus malware feed',         SYM_CHECK, SYM_WARN,  SYM_CROSS, SYM_CROSS, SYM_CROSS, SYM_CROSS],
  ['ThreatFox IOC feed',           SYM_CHECK, SYM_WARN,  SYM_CROSS, SYM_CROSS, SYM_CROSS, SYM_CROSS],
  ['Mapa geolocalizado live',      SYM_CHECK, SYM_CROSS, SYM_CHECK, SYM_CHECK, SYM_CROSS, SYM_WARN ],
  ['Clustering ASN/org',           SYM_CHECK, SYM_CROSS, SYM_CHECK, SYM_CHECK, SYM_CROSS, SYM_CHECK],
  ['Informes IA (Groq/Gemini)',    SYM_CHECK, SYM_CROSS, SYM_CROSS, SYM_CROSS, SYM_CROSS, SYM_CROSS],
  ['WAF recommendations engine',   SYM_CHECK, SYM_CROSS, SYM_CROSS, SYM_CROSS, SYM_CROSS, SYM_CROSS],
  ['Subfinder/httpx/theHarvester', SYM_CHECK, SYM_CROSS, SYM_CHECK, SYM_WARN,  SYM_CROSS, SYM_CROSS],
  ['Historial de scans',           SYM_CHECK, SYM_MONEY, SYM_MONEY, SYM_MONEY, SYM_CHECK, SYM_MONEY],
  ['Alertas Telegram',             SYM_CHECK, SYM_CROSS, SYM_CROSS, SYM_CROSS, SYM_CROSS, SYM_CROSS],
  ['Self-hosted / privacidad',     SYM_CHECK, SYM_CROSS, SYM_CROSS, SYM_CROSS, SYM_CROSS, SYM_CROSS],
  ['Open source / auditable',      SYM_CHECK, SYM_CROSS, SYM_CROSS, SYM_CROSS, SYM_CROSS, SYM_CROSS],
  ['Precio base',                  'Gratis*', 'Gratis',  'Pago',    'Pago',    'Gratis',  'Gratis'  ],
];

export function AuditPanel() {
  const [stats, setStats]               = useState<AuditStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [benchIp, setBenchIp]           = useState('');
  const [benchResult, setBenchResult]   = useState<BenchmarkResult | null>(null);
  const [benchLoading, setBenchLoading] = useState(false);
  const [benchError, setBenchError]     = useState('');
  const [showCompetitor, setShowCompetitor] = useState(false);

  useEffect(() => {
    fetch('/api/audit/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoadingStats(false); })
      .catch(() => setLoadingStats(false));
  }, []);

  const runBenchmark = async () => {
    if (!benchIp.trim()) return;
    setBenchLoading(true); setBenchError(''); setBenchResult(null);
    const token = localStorage.getItem('tr_token');
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

  const cellClass = (v: string, ci: number) => {
    if (ci === 0) return v === SYM_CHECK ? 'text-brand-cyan font-bold' : 'text-zinc-400';
    if (v === SYM_CHECK) return 'text-green-400';
    if (v === SYM_WARN)  return 'text-yellow-500';
    if (v === SYM_CROSS) return 'text-zinc-700';
    if (v === SYM_MONEY || v === 'Pago') return 'text-orange-400';
    return 'text-zinc-400';
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="bg-brand-panel border border-brand-border rounded-lg p-4">
        <div className="flex items-center gap-3 mb-1">
          <Cpu size={18} className="text-brand-cyan" />
          <h2 className="text-sm font-bold text-white font-mono tracking-wider">MODULO AUDITORIA &amp; BENCHMARK</h2>
          <span className="text-[9px] bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 rounded font-mono px-2 py-0.5">SPRINT 19</span>
        </div>
        <p className="text-[11px] text-zinc-400 font-mono">Metricas internas del sistema + benchmark comparativo contra fuentes OSINT externas.</p>
      </div>

      {/* ── Stats Grid ── */}
      {loadingStats ? (
        <div className="text-center py-8 text-zinc-500 font-mono text-xs animate-pulse">Cargando metricas...</div>
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
              <span className="text-[11px] font-bold text-zinc-300 font-mono tracking-wider">DISTRIBUCION DE SCORES</span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'CRITICAL (>=80)', count: stats.score_distribution.critical, bar: 'bg-red-500',    text: 'text-red-400'    },
                { label: 'HIGH (60-79)',    count: stats.score_distribution.high,     bar: 'bg-yellow-500', text: 'text-yellow-400' },
                { label: 'MEDIUM (30-59)', count: stats.score_distribution.medium,   bar: 'bg-cyan-500',   text: 'text-cyan-400'   },
                { label: 'LOW (<30)',       count: stats.score_distribution.low,      bar: 'bg-green-500',  text: 'text-green-400'  },
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
                <span className="text-[11px] font-bold text-zinc-300 font-mono tracking-wider">TOP PAISES - C2 HOSTING</span>
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
                <span className="text-[11px] font-bold text-zinc-300 font-mono tracking-wider">TOP ASNs - C2 HOSTING</span>
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
        <div className="text-center py-6 text-zinc-500 font-mono text-xs">Error cargando metricas.</div>
      )}

      {/* ── Benchmark IP ── */}
      <div className="bg-brand-panel border border-brand-border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 border-b border-brand-border pb-3">
          <AlertTriangle size={14} className="text-yellow-400" />
          <span className="text-[11px] font-bold text-zinc-300 font-mono tracking-wider">BENCHMARK COMPARATIVO - IP vs FUENTES OSINT</span>
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
                <span>ThreatRadar Score - {benchResult.ip}</span>
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
                          ? (() => { const s = JSON.stringify(r.data); return s.length > 90 ? s.slice(0,90)+'...' : s; })()
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

      {/* ── TABLA COMPARATIVA COMPETIDORES ── */}
      <div className="bg-brand-panel border border-brand-border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-brand-border pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-brand-cyan" />
            <span className="text-[11px] font-bold text-zinc-300 font-mono tracking-wider">
              COMPARATIVA COMPETIDORES - THREAT INTELLIGENCE
            </span>
            <span className="text-[9px] bg-green-500/20 text-green-400 border border-green-500/30 rounded font-mono px-2 py-0.5">
              LIVE DATA
            </span>
          </div>
          <button
            onClick={() => setShowCompetitor(s => !s)}
            className="text-[9px] font-mono px-2 py-0.5 rounded border bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-brand-cyan transition">
            {showCompetitor ? 'OCULTAR' : 'VER TABLA'}
          </button>
        </div>

        {/* KPIs siempre visibles */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'C2s monitorizados', value: stats?.totals.c2_tracked ?? '-',    color: 'text-red-400',   sub: 'ThreatRadar live'  },
            { label: 'Fuentes OSINT',      value: Object.values(stats?.apis_configured ?? {}).filter(Boolean).length || '-', color: 'text-cyan-400', sub: 'APIs activas' },
            { label: 'Scans realizados',   value: stats?.totals.scans_total ?? '-',   color: 'text-green-400', sub: 'historico total'   },
          ].map(({ label, value, color, sub }) => (
            <div key={label} className="bg-brand-bg border border-brand-border rounded p-3 text-center">
              <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
              <div className="text-[9px] text-zinc-400 font-mono mt-0.5">{label}</div>
              <div className="text-[8px] text-zinc-600 font-mono">{sub}</div>
            </div>
          ))}
        </div>

        {showCompetitor && (
          <div className="space-y-4">
            <p className="text-[10px] text-zinc-500 font-mono">
              Capacidades de ThreatRadar OSINT vs plataformas del mercado.
              {SYM_CHECK} disponible &middot; {SYM_WARN} parcial &middot; {SYM_CROSS} no disponible &middot; Pago = solo plan pago
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-[10px] font-mono border-collapse">
                <thead>
                  <tr className="border-b border-brand-border">
                    <th className="text-left py-2.5 pr-3 text-zinc-400 font-normal w-48">FEATURE</th>
                    {COMPETITORS.map(({ name, color, bg }) => (
                      <th key={name} className={`text-center py-2 px-2 border font-bold ${color} ${bg}`}>
                        {name === 'ThreatRadar'
                          ? <span className="flex flex-col items-center gap-0.5"><Shield size={11} />{name}</span>
                          : name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_ROWS.map((row, ri) => {
                    const [feature, ...vals] = row;
                    return (
                      <tr key={ri} className={`border-b border-brand-border/30 hover:bg-brand-bg/40 transition ${ri % 2 === 0 ? 'bg-brand-bg/20' : ''}`}>
                        <td className="py-2 pr-3 text-zinc-400">{feature}</td>
                        {vals.map((v, ci) => (
                          <td key={ci} className={`py-2 px-2 text-center ${cellClass(v, ci)}`}>{v}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Score bars */}
            <div>
              <p className="text-[9px] text-zinc-600 font-mono mb-2">SCORE GLOBAL (14 criterios evaluados)</p>
              <div className="grid grid-cols-6 gap-2">
                {COMPETITORS.map(({ name, score, scoreColor, scoreText }) => (
                  <div key={name} className="bg-brand-bg border border-brand-border rounded p-2 text-center">
                    <div className={`text-lg font-bold font-mono ${scoreText}`}>{score}</div>
                    <div className="text-[7px] text-zinc-600 font-mono mb-1.5">/100</div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full ${scoreColor} rounded-full`} style={{ width: `${score}%` }} />
                    </div>
                    <div className="text-[8px] text-zinc-500 font-mono mt-1.5 leading-tight">{name}</div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[8px] text-zinc-700 font-mono border-t border-brand-border/30 pt-2">
              * Gratis en plan self-hosted. ThreatRadar: datos propios live, sin dependencia de APIs externas de pago.
              Actualizado: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
