#!/usr/bin/env python3
"""
Inserta el endpoint /api/threatmap/me en server.ts justo antes de '// ASN Clustering endpoint'.
Usa una ancla corta y unica (confirmada con grep) para evitar fallos por espacios/lineas en blanco.
Uso: python3 add_geo_endpoint.py
"""
import sys

FILE = "server.ts"

ANCHOR = "// ASN Clustering endpoint"

BLOCK = '''// 0c. Visitor self-location (mapa "tu estas aqui")
app.get('/api/threatmap/me', async (req, res) => {
  try {
    const xff = (req.headers['x-forwarded-for'] as string || '').split(',')[0].trim();
    const ip = xff || req.socket.remoteAddress || req.ip || '';
    const clean = ip.replace('::ffff:', '');
    if (!clean || clean === '127.0.0.1' || clean.startsWith('192.168.') || clean.startsWith('10.')) {
      return res.json({ located: false, reason: 'private_ip' });
    }
    const apiKey = process.env.IPINFO_API_KEY || '';
    const geo = await fetch(`https://ipinfo.io/${clean}?token=${apiKey}`).then((r: any) => r.json());
    if (!geo.loc) return res.json({ located: false, reason: 'no_loc' });
    const [lat, lon] = geo.loc.split(',').map(Number);
    res.json({
      located: true,
      ip: clean,
      lat, lon,
      city: geo.city || '',
      country: geo.country || '',
      org: geo.org || '',
      updated: new Date().toISOString(),
    });
  } catch (e: any) { res.status(500).json({ located: false, error: e.message }); }
});

'''

MARKER = "// __THREATMAP_ME_INSTALLED__"

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

if MARKER in content:
    print("INFO: El endpoint ya estaba instalado anteriormente. No se ha modificado nada.")
    sys.exit(0)

count = content.count(ANCHOR)

if count == 0:
    print(f"ERROR: No se encontro el ancla '{ANCHOR}' en {FILE}. No se ha modificado nada.")
    sys.exit(1)

if count > 1:
    print(f"ERROR: El ancla '{ANCHOR}' aparece {count} veces (deberia ser 1). No se ha modificado nada por seguridad.")
    sys.exit(1)

new_content = content.replace(ANCHOR, MARKER + "\n" + BLOCK + ANCHOR, 1)

with open(FILE, "w", encoding="utf-8") as f:
    f.write(new_content)

print("OK: Endpoint /api/threatmap/me insertado correctamente en server.ts")
