#!/usr/bin/env python3
"""
Crea un middleware reutilizable blockPrivateTarget y lo aplica a los 5 endpoints
OSINT que aceptan :ip sin proteccion (shodan, abuseipdb, virustotal, greynoise, ipinfo).
Cierra el agujero de seguridad de raiz: nadie podra escanear localhost ni la IP
propia del servidor (178.105.80.193) a traves de ninguno de estos endpoints.
Uso: python3 add_block_private_middleware.py
"""
import sys

FILE = "server.ts"
MARKER = "// __BLOCK_PRIVATE_MIDDLEWARE_INSTALLED__"

# ── 1. Definicion del middleware, justo despues de sanitizeTarget ──
ANCHOR_DEF = """const sanitizeTarget = (target: string): string => {
  return target.replace(/[;&|`$(){}[\\]<>\\\\]/g, '').trim();
};"""

BLOCK_DEF = ANCHOR_DEF + f"""

{MARKER}
// Middleware reutilizable: bloquea analisis de IPs privadas/locales/servidor propio
// en CUALQUIER endpoint que reciba :ip como parametro de ruta.
const blockPrivateTarget = (req: any, res: any, next: any) => {{
  const raw = req.params.ip || req.params.target || '';
  const ip = sanitizeTarget(raw);
  if (ip === '127.0.0.1' || ip === 'localhost' || ip.startsWith('169.254.') || isPrivateIP(ip)) {{
    return res.status(403).json({{
      error: 'forbidden_target',
      message: 'No esta permitido analizar IPs privadas, localhost ni la infraestructura propia de ThreatRadar.',
    }});
  }}
  next();
}};"""

# ── 2. Aplicar el middleware a los 5 endpoints ──
ROUTES = [
    "app.get('/api/osint/shodan/:ip', authMiddleware, async (req, res) => {",
    "app.get('/api/osint/abuseipdb/:ip', authMiddleware, async (req, res) => {",
    "app.get('/api/osint/virustotal/:ip', authMiddleware, async (req, res) => {",
    "app.get('/api/osint/greynoise/:ip', authMiddleware, async (req, res) => {",
    "app.get('/api/osint/ipinfo/:ip', authMiddleware, async (req, res) => {",
]

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

if MARKER in content:
    print("INFO: Ya estaba instalado. No se ha modificado nada.")
    sys.exit(0)

# Verificar TODAS las anclas antes de tocar nada (todo o nada)
count_def = content.count(ANCHOR_DEF)
if count_def != 1:
    print(f"ERROR: ancla de definicion aparece {count_def} veces (esperado 1). No se ha modificado nada.")
    sys.exit(1)

for r in ROUTES:
    c = content.count(r)
    if c != 1:
        print(f"ERROR: la ruta no aparece exactamente 1 vez ({c}): {r[:60]}... No se ha modificado nada.")
        sys.exit(1)

# Aplicar
new_content = content.replace(ANCHOR_DEF, BLOCK_DEF, 1)
for r in ROUTES:
    patched = r.replace("authMiddleware, async (req, res)", "authMiddleware, blockPrivateTarget, async (req, res)")
    new_content = new_content.replace(r, patched, 1)

with open(FILE, "w", encoding="utf-8") as f:
    f.write(new_content)

print(f"OK: Middleware blockPrivateTarget creado e instalado en {len(ROUTES)} endpoints (shodan, abuseipdb, virustotal, greynoise, ipinfo)")
