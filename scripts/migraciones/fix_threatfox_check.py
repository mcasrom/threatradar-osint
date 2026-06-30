#!/usr/bin/env python3
"""
Corrige el check de threatfox en /api/sources/status para usar Auth-Key (igual que el cron real).
Uso: python3 fix_threatfox_check.py
"""
import sys

FILE = "server.ts"
MARKER = "// __THREATFOX_CHECK_FIXED__"

OLD = """    check('threatfox', true, async () => {
      const r = await fetch('https://threatfox-api.abuse.ch/api/v1/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'get_iocs', days: 1 }),
      });
      return r.ok;
    }),"""

NEW = f"""    {MARKER}
    check('threatfox', !!process.env.THREATFOX_API_KEY, async () => {{
      const r = await fetch('https://threatfox-api.abuse.ch/api/v1/', {{
        method: 'POST', headers: {{ 'Auth-Key': process.env.THREATFOX_API_KEY!, 'Content-Type': 'application/json' }},
        body: JSON.stringify({{ query: 'get_iocs', days: 1 }}),
      }});
      return r.ok;
    }}),"""

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

if MARKER in content:
    print("INFO: Ya estaba corregido. No se ha modificado nada.")
    sys.exit(0)

count = content.count(OLD)
if count == 0:
    print("ERROR: No se encontro el bloque exacto a corregir. No se ha modificado nada.")
    sys.exit(1)
if count > 1:
    print(f"ERROR: El bloque aparece {count} veces. No se ha modificado nada por seguridad.")
    sys.exit(1)

new_content = content.replace(OLD, NEW, 1)
with open(FILE, "w", encoding="utf-8") as f:
    f.write(new_content)

print("OK: Check de threatfox corregido (ahora usa Auth-Key, igual que el cron real)")
