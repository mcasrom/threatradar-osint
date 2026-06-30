#!/usr/bin/env python3
"""
Corrige el marcador que quedo como texto visible (comentario JS en vez de JSX).
Uso: python3 fix_marker_jsx_comment.py
"""
import sys

FILE = "src/components/IPTesterAndManual.tsx"
OLD = "// __TEST_PRIVATE_BUTTON_REMOVED__"
NEW = "{/* __TEST_PRIVATE_BUTTON_REMOVED__ */}"

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

count = content.count(OLD)
if count == 0:
    print("INFO: No se encontro el marcador roto (puede que ya este corregido). No se ha modificado nada.")
    sys.exit(0)
if count > 1:
    print(f"ERROR: el marcador aparece {count} veces. No se ha modificado nada por seguridad.")
    sys.exit(1)

new_content = content.replace(OLD, NEW, 1)
with open(FILE, "w", encoding="utf-8") as f:
    f.write(new_content)

print("OK: Marcador corregido a comentario JSX valido, ya no se vera como texto en la pagina")
