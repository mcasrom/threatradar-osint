#!/usr/bin/env python3
"""
Elimina el boton de prueba temporal (testing only) que confundia el campo
customIp compartido entre el panel de mapa y el panel OSINT.
Uso: python3 remove_test_private_button.py
"""
import sys

FILE = "src/components/IPTesterAndManual.tsx"
MARKER = "// __TEST_PRIVATE_BUTTON_REMOVED__"

BLOCK = """            {/* __TEST_PRIVATE_BUTTON_INSTALLED__ */}
            <button
              onClick={() => {
                setCustomIp('192.168.1.1');
                handleOsintFull('192.168.1.1');
              }}
              className="w-full mt-2 py-1.5 rounded border border-dashed border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition text-[9px] font-mono"
            >
              🧪 Probar deteccion IP privada (192.168.1.1)
            </button>"""

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

if MARKER in content:
    print("INFO: Ya estaba eliminado. No se ha modificado nada.")
    sys.exit(0)

count = content.count(BLOCK)
if count == 0:
    print("ERROR: No se encontro el bloque exacto a eliminar. No se ha modificado nada.")
    sys.exit(1)
if count > 1:
    print(f"ERROR: El bloque aparece {count} veces. No se ha modificado nada por seguridad.")
    sys.exit(1)

new_content = content.replace(BLOCK, MARKER, 1)
with open(FILE, "w", encoding="utf-8") as f:
    f.write(new_content)

print("OK: Boton de prueba temporal eliminado. El campo customIp vuelve a su comportamiento normal.")
