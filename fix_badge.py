#!/usr/bin/env python3
COMPONENT_PATH = '/home/miguelc/threatradar-osint/src/components/IPTesterAndManual.tsx'

OLD = "      {/* AI Analysis Panel */}"

NEW = """      {/* ThreatRadar Risk Score Badge */}
      {threatScore && (
        <div className="bg-brand-panel border border-brand-border rounded-lg p-5 space-y-4">
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
              {threatScore.level === 'CRITICO' ? '\u26a0 CRITICO' :
               threatScore.level === 'ALTO'    ? '\ud83d\udd34 ALTO' :
               threatScore.level === 'MEDIO'   ? '\ud83d\udfe1 MEDIO' :
                                                 '\ud83d\udfe2 BAJO'}
            </div>
          </div>

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

          <div className="space-y-2">
            <div className="text-[10px] font-mono text-zinc-500 font-bold border-t border-brand-border/40 pt-3">
              COMANDOS DE MITIGACION
            </div>
            <div className="grid grid-cols-1 gap-2">
              {threatScore.mitigationCommands.map((item, i) => (
                <div key={i} className="bg-[#05070a] border border-brand-border/60 rounded p-2.5">
                  <div className="text-[9px] font-mono text-zinc-500 mb-1">{item.label}</div>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-[10px] font-mono text-green-300 flex-1 break-all">{item.cmd}</code>
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

      {/* AI Analysis Panel */}"""

with open(COMPONENT_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

if OLD not in content:
    print("ERROR: anchor no encontrado")
    exit(1)

content = content.replace(OLD, NEW, 1)

with open(COMPONENT_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("OK badge ThreatScore + comandos insertados antes de AI Analysis Panel")
