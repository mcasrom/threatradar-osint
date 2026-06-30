#!/usr/bin/env python3
"""
Corrige el onClick del boton principal de analisis OSINT para que no pase
el evento del DOM como overrideIp (bug [object Object] en la URL).
Uso: python3 fix_onclick_handler.py
"""
import sys

FILE = "src/components/IPTesterAndManual.tsx"

OLD = "            onClick={handleOsintFull}"
NEW = "            onClick={() => handleOsintFull()}"

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

count = content.count(OLD)
if count == 0:
    print("ERROR: No se encontro el onClick exacto. No se ha modificado nada.")
    sys.exit(1)
if count > 1:
    print(f"ERROR: aparece {count} veces. No se ha modificado nada.")
    sys.exit(1)

new_content = content.replace(OLD, NEW, 1)
with open(FILE, "w", encoding="utf-8") as f:
    f.write(new_content)

print("OK: onClick corregido. Ya no se pasa el evento DOM como overrideIp.")
