#!/usr/bin/env python3
"""Fix badge sin emojis unicode problemáticos"""

COMPONENT_PATH = '/home/miguelc/threatradar-osint/src/components/IPTesterAndManual.tsx'

OLD = "      {/* AI Analysis Panel */}"

NEW = (
    "      {/* ThreatRadar Risk Score Badge */}\n"
    "      {threatScore && (\n"
    "        <div className=\"bg-brand-panel border border-brand-border rounded-lg p-5 space-y-4\">\n"
    "          <div className=\"flex items-center justify-between pb-2 border-b border-brand-border/60\">\n"
    "            <h4 className=\"text-sm font-bold font-sans text-brand-cyan tracking-wider flex items-center gap-2\">\n"
    "              <Shield size={16} />\n"
    "              THREATRADAR RISK SCORE\n"
    "            </h4>\n"
    "            <button\n"
    "              onClick={exportPdf}\n"
    "              className=\"flex items-center gap-1.5 text-[10px] font-mono px-3 py-1.5 rounded border border-brand-border hover:border-brand-cyan/50 text-zinc-400 hover:text-brand-cyan transition\"\n"
    "            >\n"
    "              <FileDown size={12} />\n"
    "              Exportar PDF\n"
    "            </button>\n"
    "          </div>\n"
    "\n"
    "          <div className=\"flex items-center gap-4\">\n"
    "            <div className={`text-5xl font-bold font-mono ${\n"
    "              threatScore.level === 'CRITICO' ? 'text-red-400' :\n"
    "              threatScore.level === 'ALTO'    ? 'text-orange-400' :\n"
    "              threatScore.level === 'MEDIO'   ? 'text-yellow-400' :\n"
    "                                                'text-green-400'\n"
    "            }`}>\n"
    "              {threatScore.score}\n"
    "              <span className=\"text-lg text-zinc-500\">/100</span>\n"
    "            </div>\n"
    "            <div className={`px-4 py-2 rounded border font-bold text-sm font-mono tracking-widest ${\n"
    "              threatScore.level === 'CRITICO' ? 'bg-red-950/40 border-red-500 text-red-400' :\n"
    "              threatScore.level === 'ALTO'    ? 'bg-orange-950/40 border-orange-500 text-orange-400' :\n"
    "              threatScore.level === 'MEDIO'   ? 'bg-yellow-950/40 border-yellow-500 text-yellow-400' :\n"
    "                                                'bg-green-950/40 border-green-500 text-green-400'\n"
    "            }`}>\n"
    "              {threatScore.level}\n"
    "            </div>\n"
    "          </div>\n"
    "\n"
    "          {threatScore.factors.length > 0 && (\n"
    "            <div className=\"space-y-1\">\n"
    "              <div className=\"text-[10px] font-mono text-zinc-500 font-bold\">FACTORES DETECTADOS</div>\n"
    "              {threatScore.factors.map((f, i) => (\n"
    "                <div key={i} className=\"flex items-start gap-2 text-[11px] font-mono text-zinc-300\">\n"
    "                  <Activity size={10} className=\"mt-0.5 text-brand-cyan shrink-0\" />\n"
    "                  {f}\n"
    "                </div>\n"
    "              ))}\n"
    "            </div>\n"
    "          )}\n"
    "\n"
    "          <div className=\"space-y-2\">\n"
    "            <div className=\"text-[10px] font-mono text-zinc-500 font-bold border-t border-brand-border/40 pt-3\">\n"
    "              COMANDOS DE MITIGACION\n"
    "            </div>\n"
    "            <div className=\"grid grid-cols-1 gap-2\">\n"
    "              {threatScore.mitigationCommands.map((item, i) => (\n"
    "                <div key={i} className=\"bg-[#05070a] border border-brand-border/60 rounded p-2.5\">\n"
    "                  <div className=\"text-[9px] font-mono text-zinc-500 mb-1\">{item.label}</div>\n"
    "                  <div className=\"flex items-center justify-between gap-2\">\n"
    "                    <code className=\"text-[10px] font-mono text-green-300 flex-1 break-all\">{item.cmd}</code>\n"
    "                    <button\n"
    "                      onClick={() => copyCmd(item.cmd)}\n"
    "                      className={`shrink-0 p-1.5 rounded border transition text-[9px] font-mono flex items-center gap-1 ${\n"
    "                        copiedCmd === item.cmd\n"
    "                          ? 'border-green-500 text-green-400 bg-green-950/30'\n"
    "                          : 'border-brand-border text-zinc-500 hover:border-brand-cyan hover:text-brand-cyan'\n"
    "                      }`}\n"
    "                    >\n"
    "                      <Copy size={10} />\n"
    "                      {copiedCmd === item.cmd ? 'Copiado' : 'Copiar'}\n"
    "                    </button>\n"
    "                  </div>\n"
    "                </div>\n"
    "              ))}\n"
    "            </div>\n"
    "          </div>\n"
    "        </div>\n"
    "      )}\n"
    "\n"
    "      {/* AI Analysis Panel */}"
)

with open(COMPONENT_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

if OLD not in content:
    print("ERROR: anchor '{/* AI Analysis Panel */}' no encontrado")
    exit(1)

content = content.replace(OLD, NEW, 1)

with open(COMPONENT_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("OK: badge ThreatScore insertado")
