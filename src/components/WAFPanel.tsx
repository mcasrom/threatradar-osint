import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Info, Terminal, Cloud, ChevronDown, ChevronRight } from 'lucide-react';

interface WAFRec {
  priority: string;
  category: string;
  rule: string;
  reason: string;
  command?: string;
}

interface WAFResult {
  ip: string;
  recommendations: WAFRec[];
  cloudflare_rules: string[];
  summary: { total: number; critical: number; high: number; ports_analyzed: number; vulns_found: number };
  generated_at: string;
}

const PRIORITY_STYLE: Record<string, string> = {
  CRITICAL: 'text-red-400 border-red-500/40 bg-red-500/10',
  HIGH:     'text-orange-400 border-orange-500/40 bg-orange-500/10',
  MEDIUM:   'text-yellow-400 border-yellow-500/40 bg-yellow-500/10',
  LOW:      'text-blue-400 border-blue-500/40 bg-blue-500/10',
  INFO:     'text-zinc-400 border-zinc-600/40 bg-zinc-800/40',
};

const PRIORITY_ICON: Record<string, React.ReactNode> = {
  CRITICAL: <AlertTriangle size={13} className="text-red-400" />,
  HIGH:     <AlertTriangle size={13} className="text-orange-400" />,
  MEDIUM:   <AlertTriangle size={13} className="text-yellow-400" />,
  LOW:      <Info size={13} className="text-blue-400" />,
  INFO:     <CheckCircle size={13} className="text-zinc-400" />,
};

export function WAFPanel({ initialIp }: { initialIp?: string } = {}) {
  const [ip, setIp]           = useState(initialIp || '');
  const [result, setResult]   = useState<WAFResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [copied, setCopied]   = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const analyze = async () => {
    if (!ip.trim()) return;
    setLoading(true); setError(''); setResult(null);
    const token = localStorage.getItem('tr_token');
    try {
      const r = await fetch('/api/waf/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ip: ip.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Error');
      setResult(d);
      setExpanded({});
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const copyCmd = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopied(cmd);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-brand-panel border border-brand-border rounded-lg p-5">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={20} className="text-brand-cyan" />
          <div>
            <h2 className="text-sm font-bold font-mono text-white tracking-wider">WAF RECOMMENDATIONS ENGINE</h2>
            <p className="text-[11px] text-zinc-500 font-sans mt-0.5">Análisis de puertos, reputación y generación de reglas de firewall basadas en inteligencia OSINT</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            value={ip}
            onChange={e => setIp(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && analyze()}
            placeholder="Introduce una IP (ej: 185.220.101.1)"
            className="flex-1 bg-brand-bg border border-brand-border rounded px-3 py-2 text-sm font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-brand-cyan"
          />
          <button
            onClick={analyze}
            disabled={loading || !ip.trim()}
            className="px-4 py-2 bg-brand-cyan text-brand-bg text-xs font-bold font-mono rounded hover:bg-brand-cyan/80 disabled:opacity-40 transition"
          >
            {loading ? 'ANALIZANDO...' : 'ANALIZAR'}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs font-mono mt-2">⚠ {error}</p>}
      </div>

      {/* Resultado */}
      {result && (
        <>
          {/* Summary bar */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total reglas', val: result.summary.total, color: 'text-white' },
              { label: 'CRITICAL', val: result.summary.critical, color: 'text-red-400' },
              { label: 'HIGH', val: result.summary.high, color: 'text-orange-400' },
              { label: 'Puertos analizados', val: result.summary.ports_analyzed, color: 'text-brand-cyan' },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-brand-panel border border-brand-border rounded-lg p-3 text-center">
                <div className={`text-xl font-bold font-mono ${color}`}>{val}</div>
                <div className="text-[10px] text-zinc-500 font-sans mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Recomendaciones */}
          <div className="bg-brand-panel border border-brand-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-brand-border flex items-center gap-2">
              <Terminal size={14} className="text-brand-cyan" />
              <span className="text-xs font-bold font-mono text-zinc-300 tracking-wider">REGLAS RECOMENDADAS — {result.ip}</span>
            </div>
            <div className="divide-y divide-brand-border/40">
              {result.recommendations.map((rec, i) => (
                <div key={i} className="p-4">
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => setExpanded(e => ({ ...e, [i]: !e[i] }))}
                  >
                    {PRIORITY_ICON[rec.priority]}
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${PRIORITY_STYLE[rec.priority]}`}>
                      {rec.priority}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">{rec.category}</span>
                    <span className="text-xs font-sans text-white flex-1">{rec.rule}</span>
                    {expanded[i] ? <ChevronDown size={13} className="text-zinc-500" /> : <ChevronRight size={13} className="text-zinc-500" />}
                  </div>
                  {expanded[i] && (
                    <div className="mt-3 ml-6 space-y-2">
                      <p className="text-[11px] text-zinc-400 font-sans">{rec.reason}</p>
                      {rec.command && (
                        <div className="flex items-center gap-2 mt-2">
                          <code className="flex-1 text-[11px] font-mono bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-green-400">
                            {rec.command}
                          </code>
                          <button
                            onClick={() => copyCmd(rec.command!)}
                            className="text-[10px] font-mono px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded hover:bg-zinc-700 text-zinc-300 transition whitespace-nowrap"
                          >
                            {copied === rec.command ? '✓ COPIADO' : 'COPIAR'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cloudflare rules */}
          {result.cloudflare_rules.length > 0 && (
            <div className="bg-brand-panel border border-orange-500/20 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-orange-500/20 flex items-center gap-2">
                <Cloud size={14} className="text-orange-400" />
                <span className="text-xs font-bold font-mono text-orange-400 tracking-wider">CLOUDFLARE WAF — ACCIONES SUGERIDAS</span>
              </div>
              <div className="p-4 space-y-2">
                {result.cloudflare_rules.map((rule, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] font-sans text-zinc-300">
                    <span className="text-orange-400 mt-0.5">→</span>
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-zinc-600 font-mono text-right">
            Generado: {new Date(result.generated_at).toLocaleString('es-ES')}
          </p>
        </>
      )}
    </div>
  );
}
