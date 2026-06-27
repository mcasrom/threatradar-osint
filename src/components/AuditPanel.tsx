import React, { useState, useEffect } from 'react';
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
