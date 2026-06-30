#!/usr/bin/env python3
"""
Anade una tarjeta visual clara cuando el backend detecta IP privada (private_ip_detected),
con boton para analizar automaticamente la IP publica real del usuario.
Uso: python3 add_private_ip_card.py
"""
import sys

FILE = "src/components/IPTesterAndManual.tsx"
MARKER = "{/* __PRIVATE_IP_CARD_INSTALLED__ */}"

ANCHOR = """        {osintResult && (
          <div className="space-y-2">
            <div className="text-[9px] font-mono text-zinc-500 border-b border-zinc-800 pb-1">
              Scan completado: {new Date(osintResult.timestamp).toLocaleString()} — IP: {osintResult.ip}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {renderOsintSource('SHODAN', osintResult.shodan, 'border-orange-700/40')}
              {renderOsintSource('ABUSEIPDB', osintResult.abuseipdb, 'border-red-700/40')}
              {renderOsintSource('VIRUSTOTAL', osintResult.virustotal, 'border-yellow-700/40')}
              {renderOsintSource('GREYNOISE', osintResult.greynoise, 'border-blue-700/40')}
              {renderOsintSource('IPINFO', osintResult.ipinfo, 'border-green-700/40')}
            </div>
          </div>
        )}"""

BLOCK = f"""        {MARKER}
        {{osintResult && osintResult.private_ip_detected && (
          <div className="bg-blue-950/20 border border-blue-700/40 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-blue-400">
              <AlertCircle size={{16}} />
              <span className="text-xs font-mono font-bold">IP PRIVADA DETECTADA</span>
            </div>
            <p className="text-[11px] text-zinc-300 font-mono leading-relaxed">
              {{osintResult.message}}
            </p>
            <p className="text-[10px] text-zinc-500 font-mono">
              {{osintResult.guidance}}
            </p>
            {{osintResult.your_public_ip && (
              <div className="bg-[#04080f] border border-blue-700/30 rounded p-3 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-[9px] text-zinc-500 font-mono">TU IP PÚBLICA REAL</div>
                  <div className="text-sm text-blue-400 font-mono font-bold">{{osintResult.your_public_ip}}</div>
                  {{osintResult.your_location && (
                    <div className="text-[10px] text-zinc-500 font-mono">
                      {{[osintResult.your_location.city, osintResult.your_location.country].filter(Boolean).join(', ')}}
                    </div>
                  )}}
                </div>
                <button
                  onClick={{() => {{
                    setCustomIp(osintResult.your_public_ip);
                    setTimeout(() => handleOsintFull(), 100);
                  }}}}
                  className="px-3 py-2 rounded bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600/30 transition text-[10px] font-mono font-bold whitespace-nowrap"
                >
                  Analizar mi IP pública →
                </button>
              </div>
            )}}
            {{!osintResult.your_public_ip && (
              <p className="text-[10px] text-yellow-600 font-mono">
                {{osintResult.suggestion}}
              </p>
            )}}
          </div>
        )}}
""" + ANCHOR

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

if MARKER in content:
    print("INFO: Ya estaba instalado. No se ha modificado nada.")
    sys.exit(0)

count = content.count(ANCHOR)
if count == 0:
    print("ERROR: No se encontro el bloque exacto. No se ha modificado nada.")
    sys.exit(1)
if count > 1:
    print(f"ERROR: El bloque aparece {count} veces. No se ha modificado nada por seguridad.")
    sys.exit(1)

new_content = content.replace(ANCHOR, BLOCK, 1)
with open(FILE, "w", encoding="utf-8") as f:
    f.write(new_content)

print("OK: Tarjeta de IP privada con boton 'Analizar mi IP publica' instalada correctamente")
