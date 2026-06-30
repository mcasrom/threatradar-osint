#!/usr/bin/env python3
"""
Anade deteccion de IP privada con mensaje educativo en /api/osint/ip-full/:ip.
Si el usuario mete una IP privada (router, wifi local, etc.), en vez de gastar
las 5 llamadas a APIs externas en vano, le explica que es una IP local y le
ofrece su IP publica real para analizar de verdad.
Uso: python3 add_private_ip_guard.py
"""
import sys

FILE = "server.ts"
MARKER = "// __PRIVATE_IP_GUARD_INSTALLED__"

ANCHOR = """app.get('/api/osint/ip-full/:ip', authMiddleware, planMiddleware, async (req: any, res) => {
  const ip = sanitizeTarget(req.params.ip);
  if (!isValidIP(ip)) return res.status(400).json({ error: 'Invalid IP address' });
  const results: any = { ip, timestamp: new Date().toISOString(), shodan: null, abuseipdb: null, virustotal: null, greynoise: null, ipinfo: null };"""

BLOCK = f"""app.get('/api/osint/ip-full/:ip', authMiddleware, planMiddleware, async (req: any, res) => {{
  const ip = sanitizeTarget(req.params.ip);
  if (!isValidIP(ip)) return res.status(400).json({{ error: 'Invalid IP address' }});

  {MARKER}
  // Deteccion de IP privada/local — evita gastar llamadas a APIs externas en vano
  // y guia al usuario hacia su IP publica real
  const isPrivateIP = (addr: string): boolean => {{
    if (addr.startsWith('127.') || addr === 'localhost') return true;
    if (addr.startsWith('10.')) return true;
    if (addr.startsWith('192.168.')) return true;
    if (addr.startsWith('169.254.')) return true; // link-local
    const parts = addr.split('.').map(Number);
    if (addr.startsWith('172.') && parts.length === 4 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (addr === '::1' || addr.startsWith('fe80:') || addr.startsWith('fc') || addr.startsWith('fd')) return true;
    return false;
  }};

  if (isPrivateIP(ip)) {{
    let myPublicIp = null;
    let myCity = null;
    let myCountry = null;
    try {{
      const xff = (req.headers['x-forwarded-for'] as string || '').split(',')[0].trim();
      const realIp = (xff || req.socket.remoteAddress || '').replace('::ffff:', '');
      if (realIp && !isPrivateIP(realIp)) {{
        const geo = await fetch(`https://ipinfo.io/${{realIp}}?token=${{process.env.IPINFO_API_KEY || ''}}`).then((r: any) => r.json());
        myPublicIp = realIp;
        myCity = geo.city || null;
        myCountry = geo.country || null;
      }}
    }} catch {{}}
    return res.json({{
      private_ip_detected: true,
      ip,
      message: 'Esta es una IP privada de una red local (router WiFi, smartphone, dispositivo domestico). No es visible ni analizable desde internet — por eso las fuentes OSINT no devuelven datos utiles para esta direccion.',
      guidance: 'Si quieres analizar tu exposicion real en internet, usa tu IP publica (la que ven los servidores externos, no la de tu router).',
      your_public_ip: myPublicIp,
      your_location: myPublicIp ? {{ city: myCity, country: myCountry }} : null,
      suggestion: myPublicIp
        ? `Prueba a analizar tu IP publica: ${{myPublicIp}}`
        : 'No se pudo detectar tu IP publica automaticamente. Busca "cual es mi ip" en internet para encontrarla.',
    }});
  }}

  const results: any = {{ ip, timestamp: new Date().toISOString(), shodan: null, abuseipdb: null, virustotal: null, greynoise: null, ipinfo: null }};"""

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

if MARKER in content:
    print("INFO: Ya estaba instalado. No se ha modificado nada.")
    sys.exit(0)

count = content.count(ANCHOR)
if count == 0:
    print("ERROR: No se encontro el bloque exacto a modificar. No se ha modificado nada.")
    sys.exit(1)
if count > 1:
    print(f"ERROR: El bloque aparece {count} veces. No se ha modificado nada por seguridad.")
    sys.exit(1)

new_content = content.replace(ANCHOR, BLOCK, 1)
with open(FILE, "w", encoding="utf-8") as f:
    f.write(new_content)

print("OK: Guard de IP privada instalado correctamente en /api/osint/ip-full/:ip")
