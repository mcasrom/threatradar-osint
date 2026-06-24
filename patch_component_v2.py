#!/usr/bin/env python3
"""Patch completo IPTesterAndManual.tsx - Sprint 11 - sin unicode problemático"""
import sys

PATH = '/home/miguelc/threatradar-osint/src/components/IPTesterAndManual.tsx'

with open(PATH, 'r', encoding='utf-8') as f:
    c = f.read()

original_len = len(c)

# 1. imports
c = c.replace(
    "import { Globe, MapPin, Terminal, HelpCircle, ArrowRight, CheckCircle2, ShieldAlert, BookOpen, AlertCircle, RefreshCw, Zap } from 'lucide-react';",
    "import { Globe, MapPin, Terminal, HelpCircle, ArrowRight, CheckCircle2, ShieldAlert, BookOpen, AlertCircle, RefreshCw, Zap, Copy, FileDown, Shield, Activity } from 'lucide-react';",
    1
)

# 2. estados
c = c.replace(
    "  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);\n  const [aiLoading, setAiLoading] = useState(false);\n  const [aiError, setAiError] = useState<string | null>(null);",
    "  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);\n  const [aiLoading, setAiLoading] = useState(false);\n  const [aiError, setAiError] = useState<string | null>(null);\n  const [threatScore, setThreatScore] = useState<{\n    score: number;\n    level: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO';\n    factors: string[];\n    mitigationCommands: { label: string; cmd: string }[];\n  } | null>(null);\n  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);",
    1
)

# 3. capturar threatScore en handleAiAnalysis
c = c.replace(
    "      setAiAnalysis(data.analysis);\n      addLog(`Análisis IA completado para ${osintResult.ip}`);",
    "      setAiAnalysis(data.analysis);\n      if (data.threatScore) setThreatScore(data.threatScore);\n      addLog(`Análisis IA completado para ${osintResult.ip} — Score: ${data.threatScore?.score ?? '?'}/100 [${data.threatScore?.level ?? '?'}]`);",
    1
)

# 4. helpers copyCmd + exportPdf antes de renderOsintSource
c = c.replace(
    "  const renderOsintSource = (label: string, data: any, color: string) => {",
    """  const copyCmd = async (cmd: string) => {
    try {
      await navigator.clipboard.writeText(cmd);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = cmd;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const exportPdf = () => {
    const ip = osintResult?.ip || 'unknown';
    const ts = threatScore;
    const analysis = aiAnalysis || '';
    const levelColor = ts ? ({ CRITICO: '#ef4444', ALTO: '#f97316', MEDIO: '#eab308', BAJO: '#22c55e' }[ts.level] || '#888') : '#888';
    const html = [
      '<!DOCTYPE html><html><head><meta charset="utf-8">',
      '<title>ThreatRadar Report ' + ip + '</title>',
      '<style>body{font-family:monospace;background:#0a0e1a;color:#c9d1d9;padding:2rem}',
      'h1{color:#00e5ff}h2{color:#00e5ff;border-bottom:1px solid #1e2d3d;padding-bottom:4px}',
      '.badge{display:inline-block;padding:4px 12px;border-radius:4px;font-weight:bold;background:' + levelColor + '22;color:' + levelColor + ';border:1px solid ' + levelColor + '}',
      '.score{font-size:2rem;font-weight:bold;color:' + levelColor + '}',
      '.factor{font-size:.8rem;color:#8b949e;margin:2px 0}',
      '.cmd{background:#0d1117;border:1px solid #30363d;padding:6px 10px;border-radius:4px;font-size:.75rem;margin:4px 0;white-space:pre-wrap}',
      'pre{white-space:pre-wrap;word-break:break-all;font-size:.8rem}</style></head><body>',
      '<h1>ThreatRadar OSINT Report</h1>',
      '<p style="color:#8b949e;font-size:.75rem">IP: <strong style="color:#fff">' + ip + '</strong> | ' + new Date().toISOString() + '</p>',
    ].join('');
    const scoreHtml = ts ? [
      '<h2>Risk Score</h2>',
      '<div><span class="score">' + ts.score + '</span>/100 <span class="badge">' + ts.level + '</span></div>',
      '<h2>Factores</h2>',
      ts.factors.map((f: string) => '<div class="factor">- ' + f + '</div>').join(''),
      '<h2>Comandos de Mitigacion</h2>',
      ts.mitigationCommands.map((m: {label:string;cmd:string}) => '<div><div style="color:#8b949e;font-size:.7rem">' + m.label + '</div><div class="cmd">' + m.cmd + '</div></div>').join(''),
    ].join('') : '';
    const analysisHtml = '<h2>Informe IA</h2><pre>' + analysis.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</pre></body></html>';
    const w = window.open('', '_blank');
    if (w) { w.document.write(html + scoreHtml + analysisHtml); w.document.close(); w.print(); }
  };

  const renderOsintSource = (label: string, data: any, color: string) => {""",
    1
)

# 5. badge antes de AI Analysis Panel
c = c.replace(
    "      {/* AI Analysis Panel */}",
    """      {/* ThreatRadar Risk Score Badge */}
      {threatScore && (
        <div className="bg-brand-panel border border-brand-border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-brand-border/60">
            <h4 className="text-sm font-bold font-sans text-brand-cyan tracking-wider flex items-center gap-2">
              <Shield size={16} />
              THREATRADAR RISK SCORE
            </h4>
            <button onClick={exportPdf} className="flex items-center gap-1.5 text-[10px] font-mono px-3 py-1.5 rounded border border-brand-border hover:border-brand-cyan/50 text-zinc-400 hover:text-brand-cyan transition">
              <FileDown size={12} />
              Exportar PDF
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className={`text-5xl font-bold font-mono ${threatScore.level === 'CRITICO' ? 'text-red-400' : threatScore.level === 'ALTO' ? 'text-orange-400' : threatScore.level === 'MEDIO' ? 'text-yellow-400' : 'text-green-400'}`}>
              {threatScore.score}<span className="text-lg text-zinc-500">/100</span>
            </div>
            <div className={`px-4 py-2 rounded border font-bold text-sm font-mono tracking-widest ${threatScore.level === 'CRITICO' ? 'bg-red-950/40 border-red-500 text-red-400' : threatScore.level === 'ALTO' ? 'bg-orange-950/40 border-orange-500 text-orange-400' : threatScore.level === 'MEDIO' ? 'bg-yellow-950/40 border-yellow-500 text-yellow-400' : 'bg-green-950/40 border-green-500 text-green-400'}`}>
              {threatScore.level}
            </div>
          </div>
          {threatScore.factors.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-zinc-500 font-bold">FACTORES DETECTADOS</div>
              {threatScore.factors.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] font-mono text-zinc-300">
                  <Activity size={10} className="mt-0.5 text-brand-cyan shrink-0" />{f}
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-zinc-500 font-bold border-t border-brand-border/40 pt-3">COMANDOS DE MITIGACION</div>
            <div className="grid grid-cols-1 gap-2">
              {threatScore.mitigationCommands.map((item, i) => (
                <div key={i} className="bg-[#05070a] border border-brand-border/60 rounded p-2.5">
                  <div className="text-[9px] font-mono text-zinc-500 mb-1">{item.label}</div>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-[10px] font-mono text-green-300 flex-1 break-all">{item.cmd}</code>
                    <button onClick={() => copyCmd(item.cmd)} className={`shrink-0 p-1.5 rounded border transition text-[9px] font-mono flex items-center gap-1 ${copiedCmd === item.cmd ? 'border-green-500 text-green-400 bg-green-950/30' : 'border-brand-border text-zinc-500 hover:border-brand-cyan hover:text-brand-cyan'}`}>
                      <Copy size={10} />{copiedCmd === item.cmd ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Panel */}""",
    1
)

if len(c) == original_len:
    print("ADVERTENCIA: ningún reemplazo tuvo efecto — revisa los anchors")
    sys.exit(1)

# Escribir con encoding explícito, errores estrictos
with open(PATH, 'w', encoding='utf-8', errors='strict') as f:
    f.write(c)

print("OK: IPTesterAndManual.tsx parcheado correctamente")
print(f"   Tamaño original: {original_len} chars -> nuevo: {len(c)} chars")
