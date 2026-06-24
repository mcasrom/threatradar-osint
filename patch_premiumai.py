#!/usr/bin/env python3
"""Reescribir copy de PremiumAIChat.tsx"""

PATH = '/home/miguelc/threatradar-osint/src/components/PremiumAIChat.tsx'

with open(PATH, 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Valores por defecto
c = c.replace(
    "const [organization, setOrganization] = useState<string>('Globex Security Corp');",
    "const [organization, setOrganization] = useState<string>('');",
    1
)
c = c.replace(
    "const [infrastructure, setInfrastructure] = useState<string>('Nginx Frontend, SSH Gateway Port 22, Postgres DB on Hetzner Server');",
    "const [infrastructure, setInfrastructure] = useState<string>('');",
    1
)

# 2. Mensaje chat inicial
c = c.replace(
    "{ sender: 'assistant', text: `Informe táctico premium generado para ${organization}. He evaluado las vulnerabilidades teóricas de su arquitectura declared. ¿En qué vector de ataque o remediación desea profundizar hoy?` }",
    "{ sender: 'assistant', text: `Informe de riesgos generado para ${organization}. He analizado los vectores de ataque potenciales de tu infraestructura. ¿En qué area quieres profundizar? Puedes preguntarme sobre hardening, CVEs especificos, configuracion segura o plan de mitigacion.` }",
    1
)

# 3. Titulo y descripcion del panel
c = c.replace(
    "<Cpu size={16} /> MOTOR PREMIUM INTELIGENTE (IA BESPOKE REPORTS & CHAT CONSOLE)",
    "<Cpu size={16} /> ANALISIS DE RIESGO — TU INFRAESTRUCTURA",
    1
)
c = c.replace(
    "Evaluación dinámica mediante inteligencia artificial Gemini con chat interactivo en tiempo real.",
    "Describe tu infraestructura y obtén un análisis de riesgos con vectores de ataque, recomendaciones de hardening y chat IA para profundizar.",
    1
)

# 4. Labels de campos
c = c.replace(
    '<label className="text-[9px] text-zinc-500 font-mono block">ORGANIZACIÓN DEL CLIENTE (TARGET)</label>',
    '<label className="text-[9px] text-zinc-500 font-mono block">TU ORGANIZACIÓN O PROYECTO</label>',
    1
)
c = c.replace(
    '<label className="text-[9px] text-zinc-500 font-mono block">PERFIL DE INFRAESTRUCTURA DECLARADO</label>',
    '<label className="text-[9px] text-zinc-500 font-mono block">DESCRIBE TU INFRAESTRUCTURA</label>',
    1
)

# 5. Placeholders de inputs
c = c.replace(
    'className="w-full bg-[#05070a]/80 border border-brand-border rounded p-2 text-xs text-white font-sans focus:outline-none focus:border-brand-cyan"\n          />\n        </div>\n        <div className="space-y-1">\n          <label className="text-[9px] text-zinc-500 font-mono block">DESCRIBE TU INFRAESTRUCTURA</label>\n          <input\n            type="text"\n            value={infrastructure}',
    'placeholder="Mi empresa / Mi servidor / Mi proyecto"\n            className="w-full bg-[#05070a]/80 border border-brand-border rounded p-2 text-xs text-white font-sans focus:outline-none focus:border-brand-cyan"\n          />\n        </div>\n        <div className="space-y-1">\n          <label className="text-[9px] text-zinc-500 font-mono block">DESCRIBE TU INFRAESTRUCTURA</label>\n          <input\n            type="text"\n            value={infrastructure}',
    1
)
c = c.replace(
    'onChange={(e) => setInfrastructure(e.target.value)}\n            className="w-full bg-[#05070a]/80 border border-brand-border rounded p-2 text-xs text-white font-sans focus:outline-none focus:border-brand-cyan"',
    'onChange={(e) => setInfrastructure(e.target.value)}\n            placeholder="Nginx en 443, SSH en 22, PostgreSQL, Ubuntu 22.04, Hetzner..."\n            className="w-full bg-[#05070a]/80 border border-brand-border rounded p-2 text-xs text-white font-sans focus:outline-none focus:border-brand-cyan"',
    1
)

# 6. Botón generar
c = c.replace(
    "{isGenerating ? 'Analizando Superficie de Ataque...' : 'Generar Evaluación Táctica Inicial'}",
    "{isGenerating ? 'Analizando riesgos...' : 'Analizar riesgos y vectores de ataque'}",
    1
)

# 7. Título del resultado
c = c.replace(
    "<CheckCircle size={14} className=\"text-brand-green\" /> REPORTE TÁCTICO DE SEGURIDAD",
    "<CheckCircle size={14} className=\"text-brand-green\" /> INFORME DE RIESGOS",
    1
)

# 8. Score label
c = c.replace(
    "POSTURA POST COMPLIANCE: {assessmentScore}%",
    "NIVEL DE EXPOSICION: {assessmentScore}%",
    1
)

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(c)

print("OK: PremiumAIChat.tsx copy reescrito")
print("   - Titulo: ANALISIS DE RIESGO — TU INFRAESTRUCTURA")
print("   - Campos: Tu organizacion / Describe tu infraestructura")
print("   - Placeholders claros para usuario final")
print("   - Score: NIVEL DE EXPOSICION")
print("   - Valores por defecto vacios")
