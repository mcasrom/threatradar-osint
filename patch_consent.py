#!/usr/bin/env python3
"""
Sprint 11 extra:
1. Cláusula de consentimiento en OSINTModulesManager antes de ejecutar módulos
2. Reescribir texto del panel a copy profesional/legal
"""
PATH = '/home/miguelc/threatradar-osint/src/components/OSINTModulesManager.tsx'

with open(PATH, 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Añadir estado consentimiento después de los estados existentes
OLD_STATES = "  const [showAddForm, setShowAddForm] = useState(false);"
NEW_STATES = (
    "  const [showAddForm, setShowAddForm] = useState(false);\n"
    "  const [consentAccepted, setConsentAccepted] = useState(false);\n"
    "  const [showConsentModal, setShowConsentModal] = useState(false);"
)
c = c.replace(OLD_STATES, NEW_STATES, 1)

# 2. Interceptar handleRunCommand para mostrar modal si no hay consentimiento
OLD_RUN = "  const handleRunCommand = async () => {\n    if (!targetQuery) return;"
NEW_RUN = (
    "  const handleRunCommand = async () => {\n"
    "    if (!targetQuery) return;\n"
    "    if (!consentAccepted) { setShowConsentModal(true); return; }"
)
c = c.replace(OLD_RUN, NEW_RUN, 1)

# 3. Reescribir título y descripción del panel
OLD_HEADER = (
    "          <h3 className=\"text-sm font-bold text-brand-green tracking-wider flex items-center gap-2\">\n"
    "            <Cpu size={16} /> SISTEMA EXTENSIBLE DE PLUGINS OSINT (CARPETA /MODULES/OSINT)\n"
    "          </h3>\n"
    "          <p className=\"text-[10px] text-zinc-500 mt-0.5\">\n"
    "            Agregue plugins nativos que orquesten nmap, eyewitness o DNS Recon en su sistema corporativo.\n"
    "          </p>"
)
NEW_HEADER = (
    "          <h3 className=\"text-sm font-bold text-brand-green tracking-wider flex items-center gap-2\">\n"
    "            <Cpu size={16} /> MOTOR DE ANALISIS OSINT — MODULOS ACTIVOS\n"
    "          </h3>\n"
    "          <p className=\"text-[10px] text-zinc-500 mt-0.5\">\n"
    "            Ejecute herramientas de reconocimiento sobre objetivos <strong className=\"text-zinc-400\">que usted controla o tiene autorización expresa</strong> para analizar.\n"
    "          </p>"
)
c = c.replace(OLD_HEADER, NEW_HEADER, 1)

# 4. Insertar modal de consentimiento justo antes del return final del JSX
# Lo insertamos como primer hijo del div raíz
OLD_ROOT = '    <div id="osint-analyzer-panel" className="bg-brand-panel border border-brand-border p-5 rounded-lg space-y-4 font-sans">'
NEW_ROOT = (
    '    <div id="osint-analyzer-panel" className="bg-brand-panel border border-brand-border p-5 rounded-lg space-y-4 font-sans">\n'
    '\n'
    '      {/* Modal consentimiento legal */}\n'
    '      {showConsentModal && (\n'
    '        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">\n'
    '          <div className="bg-[#0c1322] border border-yellow-500/40 rounded-lg p-6 max-w-lg w-full mx-4 space-y-4 shadow-2xl">\n'
    '            <div className="flex items-start gap-3">\n'
    '              <ShieldAlert size={20} className="text-yellow-400 shrink-0 mt-0.5" />\n'
    '              <div>\n'
    '                <h4 className="text-sm font-bold text-yellow-400 font-mono tracking-wider">AVISO LEGAL — USO RESPONSABLE</h4>\n'
    '                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Debe leer y aceptar antes de ejecutar cualquier modulo</p>\n'
    '              </div>\n'
    '            </div>\n'
    '            <div className="bg-[#070b13] border border-brand-border rounded p-4 text-[11px] text-zinc-300 font-sans space-y-2 leading-relaxed">\n'
    '              <p>Las herramientas de este modulo realizan <strong className="text-white">reconocimiento activo y pasivo de red</strong>. Su uso esta sujeto a las siguientes condiciones:</p>\n'
    '              <ul className="space-y-1 list-none">\n'
    '                <li className="flex items-start gap-2"><span className="text-yellow-400 shrink-0">1.</span> Solo puede analizar sistemas, IPs o dominios sobre los que tenga <strong className="text-white">autorizacion expresa por escrito</strong> del propietario o que sean de su propiedad directa.</li>\n'
    '                <li className="flex items-start gap-2"><span className="text-yellow-400 shrink-0">2.</span> El uso no autorizado contra terceros puede constituir un <strong className="text-white">delito penal</strong> bajo el Codigo Penal Espanol (Art. 197 bis), la Directiva NIS2 y legislacion equivalente en su jurisdiccion.</li>\n'
    '                <li className="flex items-start gap-2"><span className="text-yellow-400 shrink-0">3.</span> ThreatRadar OSINT no se responsabiliza del uso indebido de estas herramientas. El usuario asume <strong className="text-white">responsabilidad exclusiva</strong> sobre los analisis realizados.</li>\n'
    '                <li className="flex items-start gap-2"><span className="text-yellow-400 shrink-0">4.</span> Todos los escaneos quedan registrados con timestamp, IP de origen y objetivo en los logs del sistema.</li>\n'
    '              </ul>\n'
    '            </div>\n'
    '            <div className="flex gap-3 pt-1">\n'
    '              <button\n'
    '                onClick={() => { setConsentAccepted(true); setShowConsentModal(false); handleRunCommand(); }}\n'
    '                className="flex-1 py-2.5 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/60 text-yellow-400 font-bold text-xs rounded transition font-mono"\n'
    '              >\n'
    '                ENTIENDO Y ACEPTO — SOY EL PROPIETARIO O TENGO AUTORIZACION\n'
    '              </button>\n'
    '              <button\n'
    '                onClick={() => setShowConsentModal(false)}\n'
    '                className="px-4 py-2.5 bg-brand-panel border border-brand-border text-zinc-400 hover:text-white text-xs rounded transition font-mono"\n'
    '              >\n'
    '                Cancelar\n'
    '              </button>\n'
    '            </div>\n'
    '          </div>\n'
    '        </div>\n'
    '      )}\n'
)
c = c.replace(OLD_ROOT, NEW_ROOT, 1)

if 'consentAccepted' not in c:
    print("ERROR: patch estados fallido")
    exit(1)
if 'showConsentModal' not in c:
    print("ERROR: patch modal fallido")
    exit(1)

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(c)

print("OK: OSINTModulesManager.tsx parcheado")
print("   - Modal consentimiento legal antes de ejecutar cualquier modulo")
print("   - Una vez aceptado, no vuelve a aparecer en la sesion")
print("   - Titulo y descripcion del panel reescritos")
