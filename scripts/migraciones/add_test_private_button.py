#!/usr/bin/env python3
"""
Anade un boton de prueba rapida: rellena 192.168.1.1 y lanza el analisis OSINT
directamente, para verificar visualmente la tarjeta de IP privada sin tener
que editar el campo manualmente.
Uso: python3 add_test_private_button.py
"""
import sys

FILE = "src/components/IPTesterAndManual.tsx"
MARKER = "{/* __TEST_PRIVATE_BUTTON_INSTALLED__ */}"

ANCHOR = """            <button
              onClick={() => {
                setCustomIp(osintResult.your_public_ip);
                setTimeout(() => handleOsintFull(), 100);
              }}
              className="px-3 py-2 rounded bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600/30 transition text-[10px] font-mono font-bold whitespace-nowrap"
            >
              Analizar mi IP pública →
            </button>"""

# Insertamos un boton de test justo antes del bloque de "Lanzar Análisis OSINT" (linea ~433)
ANCHOR2 = """            disabled={osintLoading || !customIp}"""

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

if MARKER in content:
    print("INFO: Ya estaba instalado. No se ha modificado nada.")
    sys.exit(0)

count2 = content.count(ANCHOR2)
if count2 != 1:
    print(f"ERROR: el ancla del boton aparece {count2} veces (esperado 1). No se ha modificado nada.")
    sys.exit(1)

# Buscamos la linea completa del boton "Lanzar Análisis OSINT" para insertar el boton de test justo despues de su cierre
ANCHOR3 = "onClick={handleOsintFull}"
count3 = content.count(ANCHOR3)
if count3 != 1:
    print(f"ERROR: el ancla handleOsintFull aparece {count3} veces (esperado 1). No se ha modificado nada.")
    sys.exit(1)

# Insertamos justo despues de la apertura del button con handleOsintFull, añadiendo un boton hermano debajo.
# Estrategia: localizamos el cierre de ese boton buscando el primer "</button>" tras ANCHOR3.
idx = content.find(ANCHOR3)
close_idx = content.find("</button>", idx)
if close_idx == -1:
    print("ERROR: no se encontro el cierre del boton de Lanzar Analisis OSINT. No se ha modificado nada.")
    sys.exit(1)
insert_pos = close_idx + len("</button>")

TEST_BUTTON = f"""
            {MARKER}
            <button
              onClick={{() => {{
                setCustomIp('192.168.1.1');
                setTimeout(() => handleOsintFull(), 100);
              }}}}
              className="w-full mt-2 py-1.5 rounded border border-dashed border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition text-[9px] font-mono"
            >
              🧪 Probar deteccion IP privada (192.168.1.1)
            </button>"""

new_content = content[:insert_pos] + TEST_BUTTON + content[insert_pos:]

with open(FILE, "w", encoding="utf-8") as f:
    f.write(new_content)

print("OK: Boton de prueba de IP privada instalado correctamente")
