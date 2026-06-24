#!/usr/bin/env python3
"""
Sprint 11 - Patch IPTesterAndManual.tsx
1. Estado threatScore desde la respuesta de /api/osint/analyze
2. Badge CRÍTICO/ALTO/MEDIO/BAJO prominente
3. Sección comandos de mitigación copiables
4. Botón Exportar Informe PDF
"""

import sys

COMPONENT_PATH = '/home/miguelc/threatradar-osint/src/components/IPTesterAndManual.tsx'

# ── 1. Añadir imports de iconos que necesitamos ──────────────────────────────
OLD_IMPORT = "import { Globe, MapPin, Terminal, HelpCircle, ArrowRight, CheckCircle2, ShieldAlert, BookOpen, AlertCircle, RefreshCw, Zap } from 'lucide-react';"

NEW_IMPORT = "import { Globe, MapPin, Terminal, HelpCircle, ArrowRight, CheckCircle2, ShieldAlert, BookOpen, AlertCircle, RefreshCw, Zap, Copy, FileDown, Shield, Activity } from 'lucide-react';"

# ── 2. Añadir estado threatScore junto a los estados existentes ───────────────
OLD_STATE = "  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);\n  const [aiLoading, setAiLoading] = useState(false);\n  const [aiError, setAiError] = useState<string | null>(null);"

NEW_STATE = """  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [threatScore, setThreatScore] = useState<{
    score: number;
    level: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO';
    factors: string[];
    mitigationCommands: { label: string; cmd: string }[];
  } | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);"""

# ── 3. Actualizar handleAiAnalysis para capturar threatScore ─────────────────
OLD_HANDLE_AI = """      const data = await res.json();
      setAiAnalysis(data.analysis);
      addLog(`Análisis IA completado para ${osintResult.ip}`);"""

NEW_HANDLE_AI = """      const data = await res.json();
      setAiAnalysis(data.analysis);
      if (data.threatScore) setThreatScore(data.threatScore);
      addLog(`Análisis IA completado para ${osintResult.ip} — Score: ${data.threatScore?.score ?? '?'}/100 [${data.threatScore?.level ?? '?'}]`);"""

# ── 4. Helpers para copiar y PDF ─────────────────────────────────────────────
OLD_RENDER_OSINT = "  const renderOsintSource = (label: string, data: any, color: string) => {"

NEW_RENDER_OSINT = """  // ── Copiar comando al portapapeles ─────────────────────────────────────
  const copyCmd = async (cmd: string) => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedCmd(cmd);
      setTimeout(() => setCopiedCmd(null), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = cmd;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedCmd(cmd);
      setTimeout(() => setCopiedCmd(null), 2000);
    }
  };

  // ── Export PDF básico via print ──────────────────────────────────────────
  const exportPdf = () => {
    const ip = osintResult?.ip || 'unknown';
    const ts = threatScore;
    const analysis = aiAnalysis || '';
    const levelColors: Record<string, string> = {
      CRITICO: '#ef4444', ALTO: '#f97316', MEDIO: '#eab308', BAJO: '#22c55e'
    };
    const color = ts ? (levelColors[ts.level] || '#888') : '#888';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>ThreatRadar Report — ${ip}</title>
<style>
  body { font-family: monospace; background: #0a0e1a; color: #c9d1d9; padding: 2rem; }
  h1 { color: #00e5ff; } h2 { color: #00e5ff; border-bottom: 1px solid #1e2d3d; padding-bottom: 4px; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: bold;
           background: ${color}22; color: ${color}; border: 1px solid ${color}; font-size: 1.1rem; }
  .score { font-size: 2rem; font-weight: bold; color: ${color}; }
  .factor { font-size: 0.8rem; color: #8b949e; margin: 2px 0; }
  .cmd { background: #0d1117; border: 1px solid #30363d; padding: 6px 10px;
         border-radius: 4px; font-size: 0.75rem; margin: 4px 0; white-space: pre-wrap; }
  pre { white-space: pre-wrap; word-break: break-all; font-size: 0.8rem; }
  .meta { color: #8b949e; font-size: 0.75rem; }
</style></head><body>
<h1>🛡 ThreatRadar OSINT Report</h1>
<p class="meta">IP: <strong style="color:#fff">${ip}</strong> &nbsp;|&nbsp; ${new Date().toISOString()} &nbsp;|&nbsp; Engine: ${ts ? 'ThreatRadar v2' : 'N/A'}</p>
${ts ? `<h2>Risk Score</h2>
<div><span class="score">${ts.score}</span>/100 &nbsp; <span class="badge">${ts.level}</span></div>
<h2>Factores Detectados</h2>
${ts.factors.map(f => `<div class="factor">• ${f}</div>`).join('')}
<h2>Comandos de Mitigación</h2>
${ts.mitigationCommands.map(c => `<div><div style="color:#8b949e;font-size:0.7rem">${c.label}</div><div class="cmd">${c.cmd}</div></div>`).join('')}` : ''}
<h2>Informe IA</h2>
<pre>${analysis.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body></html>`;
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.print();
    }
  };

  const renderOsintSource = (label: string, data: any, color: string) => {"""

# ── 5. Badge ThreatScore + comandos: insertar ANTES del bloque de análisis IA
# Buscamos el botón "Analizar con IA" o donde se muestra aiAnalysis
# Insertamos el bloque ThreatScore justo antes de donde se renderiza aiAnalysis

OLD_AI_RENDER = """      {/* AI Analysis Section */}"""

NEW_AI_RENDER = """      {/* ── ThreatRadar Risk Score Badge ──────────────────────────────────── */}
      {threatScore && (
        <div className="bg-brand-panel border border-brand-border rounded-lg p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-brand-border/60">
            <h4 className="text-sm font-bold font-sans text-brand-cyan tracking-wider flex items-center gap-2">
              <Shield size={16} />
              THREATRADAR RISK SCORE
            </h4>
            <button
              onClick={exportPdf}
              className="flex items-center gap-1.5 text-[10px] font-mono px-3 py-1.5 rounded border border-brand-border hover:border-brand-cyan/50 text-zinc-400 hover:text-brand-cyan transition"
            >
              <FileDown size={12} />
              Exportar PDF
            </button>
          </div>

          {/* Score + Badge */}
          <div className="flex items-center gap-4">
            <div className={`text-5xl font-bold font-mono ${
              threatScore.level === 'CRITICO' ? 'text-red-400' :
              threatScore.level === 'ALTO'    ? 'text-orange-400' :
              threatScore.level === 'MEDIO'   ? 'text-yellow-400' :
                                                'text-green-400'
            }`}>
              {threatScore.score}
              <span className="text-lg text-zinc-500">/100</span>
            </div>
            <div className={`px-4 py-2 rounded border font-bold text-sm font-mono tracking-widest ${
              threatScore.level === 'CRITICO' ? 'bg-red-950/40 border-red-500 text-red-400' :
              threatScore.level === 'ALTO'    ? 'bg-orange-950/40 border-orange-500 text-orange-400' :
              threatScore.level === 'MEDIO'   ? 'bg-yellow-950/40 border-yellow-500 text-yellow-400' :
                                                'bg-green-950/40 border-green-500 text-green-400'
            }`}>
              {threatScore.level === 'CRITICO' ? '⚠ CRÍTICO' :
               threatScore.level === 'ALTO'    ? '🔴 ALTO' :
               threatScore.level === 'MEDIO'   ? '🟡 MEDIO' :
                                                 '🟢 BAJO'}
            </div>
          </div>

          {/* Factores */}
          {threatScore.factors.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-zinc-500 font-bold">FACTORES DETECTADOS</div>
              {threatScore.factors.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] font-mono text-zinc-300">
                  <Activity size={10} className="mt-0.5 text-brand-cyan shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          )}

          {/* Comandos de mitigación */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-zinc-500 font-bold border-t border-brand-border/40 pt-3">
              COMANDOS DE MITIGACIÓN
            </div>
            <div className="grid grid-cols-1 gap-2">
              {threatScore.mitigationCommands.map((item, i) => (
                <div key={i} className="bg-[#05070a] border border-brand-border/60 rounded p-2.5 group relative">
                  <div className="text-[9px] font-mono text-zinc-500 mb-1">{item.label}</div>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-[10px] font-mono text-green-300 flex-1 break-all">
                      {item.cmd}
                    </code>
                    <button
                      onClick={() => copyCmd(item.cmd)}
                      className={`shrink-0 p-1.5 rounded border transition text-[9px] font-mono flex items-center gap-1 ${
                        copiedCmd === item.cmd
                          ? 'border-green-500 text-green-400 bg-green-950/30'
                          : 'border-brand-border text-zinc-500 hover:border-brand-cyan hover:text-brand-cyan'
                      }`}
                    >
                      <Copy size={10} />
                      {copiedCmd === item.cmd ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Section */}"""

# ── Aplicar patches ──────────────────────────────────────────────────────────
try:
    with open(COMPONENT_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
except FileNotFoundError:
    print(f"ERROR: No se encuentra {COMPONENT_PATH}")
    sys.exit(1)

patches = [
    (OLD_IMPORT,      NEW_IMPORT,      "imports lucide-react"),
    (OLD_STATE,       NEW_STATE,       "estados threatScore + copiedCmd"),
    (OLD_HANDLE_AI,   NEW_HANDLE_AI,   "handleAiAnalysis captura threatScore"),
    (OLD_RENDER_OSINT,NEW_RENDER_OSINT,"helpers copyCmd + exportPdf"),
    (OLD_AI_RENDER,   NEW_AI_RENDER,   "badge ThreatScore + comandos mitigación"),
]

for old, new, label in patches:
    if old not in content:
        print(f"ERROR: No se encontró el bloque '{label}'")
        print(f"Busca manualmente: {old[:80]}...")
        sys.exit(1)
    content = content.replace(old, new, 1)
    print(f"✓ {label}")

with open(COMPONENT_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\n✅ IPTesterAndManual.tsx actualizado en {COMPONENT_PATH}")
print("   - Badge CRÍTICO/ALTO/MEDIO/BAJO con score prominente")
print("   - Factores detectados listados")
print("   - Comandos de mitigación copiables (iptables + fail2ban + SIEM)")
print("   - Botón Exportar PDF via window.print()")
