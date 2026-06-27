import React, { useState, useEffect } from 'react';
import { ThreatAlert } from '../types';
import ReactMarkdown from 'react-markdown';
import {
  Shield, Activity, RefreshCw, AlertCircle, ChevronDown, ChevronUp,
  Copy, FileDown, Zap, Lock, LogIn, CheckCircle2, ShieldAlert, Terminal
} from 'lucide-react';

interface IPTesterProps {
  onTriggerAlert: (alert: ThreatAlert) => void;
}

const SCORE_COLOR = (s: number) =>
  s >= 80 ? 'text-red-400' : s >= 60 ? 'text-orange-400' : s >= 30 ? 'text-yellow-400' : 'text-green-400';
const SCORE_BG = (s: number) =>
  s >= 80 ? 'bg-red-950/40 border-red-500' : s >= 60 ? 'bg-orange-950/40 border-orange-500' :
  s >= 30 ? 'bg-yellow-950/40 border-yellow-500' : 'bg-green-950/40 border-green-500';
const SCORE_LABEL = (s: number) =>
  s >= 80 ? 'CRÍTICO' : s >= 60 ? 'ALTO' : s >= 30 ? 'MEDIO' : 'BAJO';

export const IPTesterAndManual: React.FC<IPTesterProps> = ({ onTriggerAlert }) => {
  const [ip, setIp] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [threatScore, setThreatScore] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [copiedCmd, setCopiedCmd] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [userPlan, setUserPlan] = useState<string | null>(null);

  const token = () => localStorage.getItem('tr_token');

  useEffect(() => {
    // Auto-detect IP silently
    fetch('/api/geoip/')
      .then(r => r.json())
      .then(d => { if (d?.ip) setIp(d.ip); })
      .catch(() => {});
    // Check user plan
    const t = token();
    if (t) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${t}` } })
        .then(r => r.json())
        .then(d => setUserPlan(d?.user?.plan || 'free'))
        .catch(() => {});
    }
  }, []);

  const detectIp = async () => {
    setDetecting(true);
    try {
      const r = await fetch('/api/geoip/');
      const d = await r.json();
      if (d?.ip) setIp(d.ip);
    } catch {}
    finally { setDetecting(false); }
  };

  const analyze = async () => {
    if (!ip.trim()) { setError('Introduce una dirección IP.'); return; }
    const t = token();
    if (!t) { setShowLoginPrompt(true); return; }
    setLoading(true); setError(''); setResult(null);
    setThreatScore(null); setAiAnalysis(null);
    try {
      const r = await fetch(`/api/osint/ip-full/${ip.trim()}`, {
        headers: { Authorization: `Bearer ${t}` }
      });
      if (r.status === 401) { setShowLoginPrompt(true); setLoading(false); return; }
      if (r.status === 429) {
        const d = await r.json();
        throw new Error(d.error || 'Límite de scans alcanzado. Actualiza tu plan.');
      }
      if (!r.ok) throw new Error(`Error ${r.status}`);
      const data = await r.json();
      setResult(data);

      // Inject to map
      if (data.ipinfo?.loc) {
        const [lat, lon] = data.ipinfo.loc.split(',').map(Number);
        onTriggerAlert({
          id: `scan-${Date.now()}`,
          timestamp: new Date().toISOString(),
          sourceIp: ip.trim(),
          latitude: lat, longitude: lon,
          country: data.ipinfo?.country || 'Unknown',
          attackType: 'OSINT Scan',
          severity: 'critical' as const,
          malware: '', port: 0, source: 'manual'
        } as any);
      }

      // Auto-trigger AI analysis
      await runAiAnalysis(data, t);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const runAiAnalysis = async (osintData: any, t: string) => {
    setAiLoading(true); setAiError('');
    try {
      const trimmed = {
        ip: osintData.ip, timestamp: osintData.timestamp,
        shodan: osintData.shodan, abuseipdb: osintData.abuseipdb,
        greynoise: osintData.greynoise, ipinfo: osintData.ipinfo,
        virustotal: osintData.virustotal ? {
          data: { attributes: { last_analysis_stats: osintData.virustotal?.data?.attributes?.last_analysis_stats } }
        } : null
      };
      const r = await fetch('/api/osint/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ osintData: trimmed })
      });
      if (!r.ok) throw new Error(`Error ${r.status}`);
      const d = await r.json();
      setAiAnalysis(d.analysis);
      if (d.threatScore) setThreatScore(d.threatScore);
    } catch (e: any) {
      setAiError(e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const copyCmd = async (cmd: string) => {
    try { await navigator.clipboard.writeText(cmd); } catch {}
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(''), 2000);
  };

  const exportPdf = () => {
    const ts = threatScore;
    const lc = ts ? ({ CRÍTICO: '#ef4444', ALTO: '#f97316', MEDIO: '#eab308', BAJO: '#22c55e' }[ts.level] || '#888') : '#888';
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>ThreatRadar — ${ip}</title>
    <style>body{font-family:monospace;background:#0a0e1a;color:#c9d1d9;padding:2rem}
    h1{color:#00e5ff}h2{color:#00e5ff;border-bottom:1px solid #1e2d3d;padding-bottom:4px}
    .score{font-size:2rem;font-weight:bold;color:${lc}}
    .badge{display:inline-block;padding:4px 12px;border-radius:4px;background:${lc}22;color:${lc};border:1px solid ${lc}}
    .cmd{background:#0d1117;border:1px solid #30363d;padding:6px 10px;border-radius:4px;font-size:.75rem;margin:4px 0}
    pre{white-space:pre-wrap;word-break:break-all;font-size:.8rem}</style></head><body>
    <h1>ThreatRadar OSINT Report</h1>
    <p style="color:#8b949e;font-size:.75rem">IP: <strong style="color:#fff">${ip}</strong> | ${new Date().toISOString()}</p>
    ${ts ? `<h2>Risk Score</h2><div><span class="score">${ts.score}</span>/100 <span class="badge">${ts.level}</span></div>
    <h2>Factores</h2>${ts.factors.map((f: string) => `<div>- ${f}</div>`).join('')}
    <h2>Comandos de mitigación</h2>${ts.mitigationCommands.map((m: any) => `<div class="cmd">${m.label}: ${m.cmd}</div>`).join('')}` : ''}
    ${aiAnalysis ? `<h2>Informe IA</h2><pre>${aiAnalysis.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>` : ''}
    </body></html>`);
    w.document.close(); w.print();
  };

  const toggleSection = (key: string) =>
    setExpanded(p => ({ ...p, [key]: !p[key] }));

  const SourceAccordion = ({ label, data, color }: { label: string; data: any; color: string }) => {
    const open = expanded[label];
    const hasData = data && !data.error;
    return (
      <div className={`border rounded overflow-hidden ${color}`}>
        <button
          onClick={() => toggleSection(label)}
          className="w-full flex justify-between items-center px-3 py-2 bg-brand-bg/60 hover:bg-brand-bg text-left transition"
        >
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${hasData ? 'bg-green-400' : 'bg-zinc-600'}`} />
            <span className="text-[11px] font-mono font-bold text-zinc-300">{label}</span>
            {!hasData && <span className="text-[9px] font-mono text-zinc-600">{data?.error ? 'error' : 'sin key'}</span>}
          </div>
          {open ? <ChevronUp size={12} className="text-zinc-500" /> : <ChevronDown size={12} className="text-zinc-500" />}
        </button>
        {open && (
          <pre className="text-[9px] font-mono text-zinc-400 p-3 bg-brand-bg/40 whitespace-pre-wrap break-all max-h-40 overflow-y-auto border-t border-zinc-800">
            {JSON.stringify(data, null, 2).slice(0, 800)}{JSON.stringify(data || {}).length > 800 ? '\n...' : ''}
          </pre>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">

      {/* ── HERO IP INPUT ── */}
      <div className="bg-brand-panel border border-brand-border rounded-lg p-6 space-y-4">
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Shield size={20} className="text-brand-cyan" />
            <h2 className="text-sm font-bold text-white font-mono tracking-widest">ANÁLISIS DE AMENAZA</h2>
          </div>
          <p className="text-[11px] text-zinc-500 font-mono">Introduce una IP para obtener su score de amenaza, reputación y análisis IA</p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={ip}
            onChange={e => { setIp(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && analyze()}
            placeholder="Ej: 185.220.101.50"
            className="flex-1 bg-brand-bg border border-brand-border rounded-lg px-4 py-3 text-sm font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-brand-cyan transition"
          />
          <button
            onClick={detectIp}
            disabled={detecting}
            title="Detectar mi IP"
            className="px-3 py-3 bg-brand-header border border-brand-border rounded-lg text-zinc-400 hover:text-brand-cyan hover:border-brand-cyan transition"
          >
            <RefreshCw size={14} className={detecting ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={analyze}
            disabled={loading || !ip.trim()}
            className="px-6 py-3 bg-brand-cyan text-brand-bg text-sm font-bold font-mono rounded-lg hover:opacity-90 disabled:opacity-40 transition flex items-center gap-2"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
            {loading ? 'Analizando...' : 'Analizar'}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-[11px] font-mono bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
            <AlertCircle size={12} /> {error}
          </div>
        )}

        {/* Login prompt */}
        {showLoginPrompt && (
          <div className="flex items-center justify-between bg-brand-cyan/10 border border-brand-cyan/30 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 text-[11px] font-mono text-brand-cyan">
              <Lock size={13} />
              <span>Necesitas una cuenta para analizar IPs. El registro es gratuito.</span>
            </div>
            <button
              onClick={() => setShowLoginPrompt(false)}
              className="flex items-center gap-1 text-[10px] font-mono text-brand-cyan border border-brand-cyan/40 rounded px-3 py-1.5 hover:bg-brand-cyan/20 transition"
            >
              <LogIn size={11} /> Ir a Mi Cuenta
            </button>
          </div>
        )}
      </div>

      {/* ── RESULTADO ── */}
      {(threatScore || aiLoading) && (
        <div className="space-y-3">

          {/* Score card */}
          {threatScore && (
            <div className={`bg-brand-panel border rounded-lg p-5 ${SCORE_BG(threatScore.score)}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`text-5xl font-bold font-mono ${SCORE_COLOR(threatScore.score)}`}>
                    {threatScore.score}<span className="text-lg text-zinc-500">/100</span>
                  </div>
                  <div className={`px-3 py-1.5 rounded border font-bold text-sm font-mono tracking-widest ${SCORE_BG(threatScore.score)} ${SCORE_COLOR(threatScore.score)}`}>
                    {SCORE_LABEL(threatScore.score)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={exportPdf} className="flex items-center gap-1.5 text-[10px] font-mono px-3 py-1.5 rounded border border-brand-border hover:border-brand-cyan text-zinc-400 hover:text-brand-cyan transition">
                    <FileDown size={11} /> PDF
                  </button>
                </div>
              </div>

              {/* Why Engine conclusion */}
              {threatScore.conclusion && (
                <div className="bg-brand-bg/60 border border-brand-border rounded p-3 space-y-1 mb-3">
                  <div className="text-[10px] font-mono text-brand-cyan font-bold">CONCLUSIÓN</div>
                  <div className="text-[12px] font-mono text-white leading-relaxed">{threatScore.conclusion.summary}</div>
                  <div className="flex gap-4 mt-1">
                    <span className="text-[9px] font-mono text-zinc-500">RIESGO: <span className="text-red-400">{threatScore.conclusion.risk}</span></span>
                    <span className="text-[9px] font-mono text-zinc-500">CONFIANZA: <span className="text-brand-cyan">{threatScore.conclusion.confidence}</span></span>
                  </div>
                </div>
              )}

              {/* Geo + ISP summary */}
              {result?.ipinfo && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: 'PAÍS', value: result.ipinfo.country },
                    { label: 'ISP', value: (result.ipinfo.org || '').slice(0, 30) },
                    { label: 'CIUDAD', value: result.ipinfo.city || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-brand-bg border border-brand-border rounded p-2 text-center">
                      <div className="text-[9px] font-mono text-zinc-500">{label}</div>
                      <div className="text-[11px] font-mono text-zinc-200 mt-0.5 truncate">{value || '—'}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Factors */}
              {threatScore.factors?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[9px] font-mono text-zinc-500 font-bold">FACTORES</div>
                  {threatScore.factors.map((f: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-[10px] font-mono text-zinc-300">
                      <Activity size={9} className="mt-0.5 text-brand-cyan shrink-0" />{f}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI Analysis */}
          {(aiLoading || aiAnalysis || aiError) && (
            <div className="bg-brand-panel border border-brand-cyan/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-brand-border pb-2">
                <Zap size={13} className="text-brand-cyan" />
                <span className="text-[11px] font-bold font-mono text-zinc-300 tracking-wider">INFORME IA</span>
                {aiLoading && <RefreshCw size={11} className="animate-spin text-brand-cyan ml-auto" />}
              </div>
              {aiError && <div className="text-red-400 text-[10px] font-mono">{aiError}</div>}
              {aiLoading && !aiAnalysis && (
                <div className="text-zinc-500 text-[10px] font-mono animate-pulse">Generando análisis con IA...</div>
              )}
              {aiAnalysis && (
                <div className="text-xs text-zinc-300 font-sans leading-relaxed max-h-72 overflow-y-auto">
                  <ReactMarkdown
                    components={{
                      h2: ({children}) => <h2 className="text-white font-bold text-xs mt-3 mb-1 border-b border-zinc-700 pb-1">{children}</h2>,
                      h3: ({children}) => <h3 className="text-brand-cyan font-bold text-[11px] mt-2 mb-1">{children}</h3>,
                      p:  ({children}) => <p className="text-zinc-400 mb-2 leading-relaxed">{children}</p>,
                      li: ({children}) => <li className="flex gap-1.5 text-zinc-300"><span className="text-brand-cyan shrink-0">•</span><span>{children}</span></li>,
                      code: ({inline, children}: any) => inline
                        ? <code className="bg-brand-bg text-green-300 px-1 py-0.5 rounded text-[10px] font-mono">{children}</code>
                        : <pre className="bg-brand-bg border border-brand-border rounded p-2 text-[10px] font-mono text-green-300 overflow-x-auto my-2 whitespace-pre-wrap"><code>{children}</code></pre>,
                      strong: ({children}) => <strong className="text-white font-bold">{children}</strong>,
                    }}
                  >{aiAnalysis}</ReactMarkdown>
                </div>
              )}
            </div>
          )}

          {/* Mitigation commands — Pro only */}
          {threatScore?.mitigationCommands?.length > 0 && (userPlan === 'pro' || userPlan === 'enterprise') && (
            <div className="bg-brand-panel border border-brand-border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 border-b border-brand-border pb-2">
                <Terminal size={13} className="text-brand-cyan" />
                <span className="text-[11px] font-bold font-mono text-zinc-300 tracking-wider">COMANDOS DE MITIGACIÓN</span>
                <span className="text-[9px] bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 rounded px-1.5 py-0.5 font-mono ml-auto">PRO</span>
              </div>
              {threatScore.mitigationCommands.map((item: any, i: number) => (
                <div key={i} className="bg-brand-bg border border-brand-border rounded p-2.5">
                  <div className="text-[9px] font-mono text-zinc-500 mb-1">{item.label}</div>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-[10px] font-mono text-green-300 flex-1 break-all">{item.cmd}</code>
                    <button onClick={() => copyCmd(item.cmd)} className={`shrink-0 p-1.5 rounded border transition text-[9px] font-mono flex items-center gap-1 ${copiedCmd === item.cmd ? 'border-green-500 text-green-400' : 'border-brand-border text-zinc-500 hover:border-brand-cyan hover:text-brand-cyan'}`}>
                      <Copy size={9} />{copiedCmd === item.cmd ? 'OK' : 'Copiar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sources accordion — Pro only */}
          {result && (userPlan === 'pro' || userPlan === 'enterprise') && (
            <div className="bg-brand-panel border border-brand-border rounded-lg p-4 space-y-2">
              <button
                onClick={() => toggleSection('__sources')}
                className="w-full flex items-center justify-between text-[11px] font-mono font-bold text-zinc-400 hover:text-zinc-200 transition"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-brand-cyan" />
                  DATOS RAW POR FUENTE
                </div>
                {expanded['__sources'] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {expanded['__sources'] && (
                <div className="space-y-2 pt-2">
                  <SourceAccordion label="SHODAN / InternetDB" data={result.shodan}    color="border-orange-700/30" />
                  <SourceAccordion label="ABUSEIPDB"           data={result.abuseipdb} color="border-red-700/30"    />
                  <SourceAccordion label="VIRUSTOTAL"          data={result.virustotal} color="border-yellow-700/30" />
                  <SourceAccordion label="GREYNOISE"           data={result.greynoise}  color="border-blue-700/30"   />
                  <SourceAccordion label="IPINFO"              data={result.ipinfo}     color="border-green-700/30"  />
                  <SourceAccordion label="OTX"                 data={result.otx}        color="border-purple-700/30" />
                  <SourceAccordion label="THREATFOX"           data={result.threatfox}  color="border-red-900/30"    />
                  <SourceAccordion label="CRT.SH"              data={result.crtsh}      color="border-zinc-700/30"   />
                </div>
              )}
            </div>
          )}

          {/* Free user upsell */}
          {result && userPlan === 'free' && (
            <div className="flex items-center justify-between bg-brand-cyan/5 border border-brand-cyan/20 rounded-lg px-4 py-3">
              <div className="text-[11px] font-mono text-zinc-400">
                <span className="text-brand-cyan font-bold">Pro</span> — datos raw por fuente, comandos de mitigación, historial de análisis
              </div>
              <button className="text-[10px] font-mono font-bold text-brand-cyan border border-brand-cyan/40 rounded px-3 py-1.5 hover:bg-brand-cyan/20 transition">
                Ver planes →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !threatScore && !showLoginPrompt && (
        <div className="text-center py-8 text-zinc-600 text-xs font-mono space-y-1">
          <Shield size={28} className="mx-auto mb-3 opacity-20" />
          <div>Introduce una IP y pulsa Analizar</div>
          <div className="text-[10px]">Score de amenaza · Reputación · Análisis IA · Geolocalización</div>
        </div>
      )}
    </div>
  );
};
