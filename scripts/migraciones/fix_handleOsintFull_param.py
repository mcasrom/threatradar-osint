#!/usr/bin/env python3
"""
Modifica handleOsintFull para aceptar un parametro opcional overrideIp,
arreglando el bug de closure obsoleto (stale state) al llamarlo justo
despues de setCustomIp(). Tambien actualiza los 2 botones que dependen
de este patron (Analizar mi IP publica + boton de prueba IP privada)
para pasar la IP directamente en vez de depender del setTimeout.
Uso: python3 fix_handleOsintFull_param.py
"""
import sys

FILE = "src/components/IPTesterAndManual.tsx"
MARKER = "// __HANDLEOSINTFULL_PARAM_FIXED__"

OLD_FN = """  const handleOsintFull = async () => {
    if (!customIp) {
      setOsintError('Introduce una IP primero (usa Detectar o escribe una).');
      return;
    }
    const token = localStorage.getItem('tr_token');
    if (!token) {
      setOsintError('Debes iniciar sesión para usar el análisis OSINT completo.');
      return;
    }
    setOsintLoading(true);
    setOsintResult(null);
    setOsintError(null);
    try {
      const res = await fetch(`/api/osint/ip-full/${customIp}`, {
        headers: { Authorization: `Bearer ${token}` }
      });"""

NEW_FN = f"""  {MARKER}
  const handleOsintFull = async (overrideIp?: string) => {{
    const targetIp = overrideIp || customIp;
    if (!targetIp) {{
      setOsintError('Introduce una IP primero (usa Detectar o escribe una).');
      return;
    }}
    const token = localStorage.getItem('tr_token');
    if (!token) {{
      setOsintError('Debes iniciar sesión para usar el análisis OSINT completo.');
      return;
    }}
    setOsintLoading(true);
    setOsintResult(null);
    setOsintError(null);
    try {{
      const res = await fetch(`/api/osint/ip-full/${{targetIp}}`, {{
        headers: {{ Authorization: `Bearer ${{token}}` }}
      }});"""

OLD_LOG = "addLog(`Análisis OSINT completo para ${customIp} — ${Object.keys(data).filter(k => data[k] && !data[k].error && k !== 'ip' && k !== 'timestamp').length} fuentes con datos.`);"
NEW_LOG = "addLog(`Análisis OSINT completo para ${targetIp} — ${Object.keys(data).filter(k => data[k] && !data[k].error && k !== 'ip' && k !== 'timestamp').length} fuentes con datos.`);"

OLD_BTN1 = """                  onClick={() => {
                    setCustomIp(osintResult.your_public_ip);
                    setTimeout(() => handleOsintFull(), 100);
                  }}"""
NEW_BTN1 = """                  onClick={() => {
                    setCustomIp(osintResult.your_public_ip);
                    handleOsintFull(osintResult.your_public_ip);
                  }}"""

OLD_BTN2 = """              onClick={() => {
                setCustomIp('192.168.1.1');
                setTimeout(() => handleOsintFull(), 100);
              }}"""
NEW_BTN2 = """              onClick={() => {
                setCustomIp('192.168.1.1');
                handleOsintFull('192.168.1.1');
              }}"""

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

if MARKER in content:
    print("INFO: Ya estaba corregido. No se ha modificado nada.")
    sys.exit(0)

checks = [
    ("funcion handleOsintFull", OLD_FN),
    ("log linea", OLD_LOG),
    ("boton 1 (analizar mi ip publica)", OLD_BTN1),
    ("boton 2 (test ip privada)", OLD_BTN2),
]

for name, anchor in checks:
    c = content.count(anchor)
    if c != 1:
        print(f"ERROR: '{name}' aparece {c} veces (esperado 1). No se ha modificado nada.")
        sys.exit(1)

new_content = content.replace(OLD_FN, NEW_FN, 1)
new_content = new_content.replace(OLD_LOG, NEW_LOG, 1)
new_content = new_content.replace(OLD_BTN1, NEW_BTN1, 1)
new_content = new_content.replace(OLD_BTN2, NEW_BTN2, 1)

with open(FILE, "w", encoding="utf-8") as f:
    f.write(new_content)

print("OK: handleOsintFull ahora acepta overrideIp, bug de closure obsoleto corregido")
