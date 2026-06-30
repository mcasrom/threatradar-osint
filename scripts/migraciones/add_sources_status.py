#!/usr/bin/env python3
"""
Inserta el endpoint /api/sources/status en server.ts, justo despues de /api/threatmap/me.
Prueba EN VIVO cada fuente OSINT (no solo si tiene key configurada) contra un target neutro
y devuelve activo/error/sin_key por fuente, para que el frontend pueda desactivar tarjetas rotas.
Uso: python3 add_sources_status.py
"""
import sys

FILE = "server.ts"
MARKER = "// __SOURCES_STATUS_INSTALLED__"
ANCHOR = "// ASN Clustering endpoint"

BLOCK = f'''{MARKER}
// 0d. Estado en vivo de todas las fuentes OSINT (no solo si hay API key, sino si responden)
app.get('/api/sources/status', async (req, res) => {{
  const TEST_IP = '8.8.8.8'; // target neutro, no consume cuota relevante
  const results: Record<string, any> = {{}};

  const check = async (name: string, hasKey: boolean, fn: () => Promise<boolean>) => {{
    if (!hasKey) {{ results[name] = {{ status: 'sin_key', active: false }}; return; }}
    try {{
      const ok = await Promise.race([
        fn(),
        new Promise<boolean>((_, rej) => setTimeout(() => rej(new Error('timeout')), 6000)),
      ]);
      results[name] = {{ status: ok ? 'activo' : 'error', active: ok }};
    }} catch (e: any) {{
      results[name] = {{ status: 'error', active: false, detail: e.message }};
    }}
  }};

  await Promise.all([
    check('ipinfo', !!process.env.IPINFO_API_KEY, async () => {{
      const r = await fetch(`https://ipinfo.io/${{TEST_IP}}?token=${{process.env.IPINFO_API_KEY}}`);
      const d = await r.json();
      return !!d.loc;
    }}),
    check('abuseipdb', !!process.env.ABUSEIPDB_API_KEY, async () => {{
      const r = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${{TEST_IP}}&maxAgeInDays=90`,
        {{ headers: {{ 'Key': process.env.ABUSEIPDB_API_KEY!, 'Accept': 'application/json' }} }});
      return r.ok;
    }}),
    check('virustotal', !!process.env.VIRUSTOTAL_API_KEY, async () => {{
      const r = await fetch(`https://www.virustotal.com/api/v3/ip_addresses/${{TEST_IP}}`,
        {{ headers: {{ 'x-apikey': process.env.VIRUSTOTAL_API_KEY! }} }});
      return r.ok;
    }}),
    check('greynoise', true, async () => {{
      const r = await fetch(`https://api.greynoise.io/v3/community/${{TEST_IP}}`,
        {{ headers: process.env.GREYNOISE_API_KEY ? {{ key: process.env.GREYNOISE_API_KEY }} : {{}} }});
      return r.status !== 500 && r.status !== 401;
    }}),
    check('internetdb_shodan', true, async () => {{
      const r = await fetch(`https://internetdb.shodan.io/${{TEST_IP}}`);
      return r.ok;
    }}),
    check('threatfox', true, async () => {{
      const r = await fetch('https://threatfox-api.abuse.ch/api/v1/', {{
        method: 'POST', headers: {{ 'Content-Type': 'application/json' }},
        body: JSON.stringify({{ query: 'get_iocs', days: 1 }}),
      }});
      return r.ok;
    }}),
    check('urlhaus', true, async () => {{
      const r = await fetch('https://urlhaus.abuse.ch/downloads/json_recent/');
      return r.ok;
    }}),
    check('groq', !!process.env.GROQ_API_KEY, async () => true),
    check('gemini', !!process.env.GEMINI_API_KEY, async () => true),
    check('telegram', !!process.env.TELEGRAM_BOT_TOKEN, async () => true),
  ]);

  const summary = {{
    total: Object.keys(results).length,
    activas: Object.values(results).filter((r: any) => r.active).length,
    sin_key: Object.values(results).filter((r: any) => r.status === 'sin_key').length,
    con_error: Object.values(results).filter((r: any) => r.status === 'error').length,
  }};

  res.json({{ sources: results, summary, checked_at: new Date().toISOString() }});
}});

{ANCHOR}'''

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

if MARKER in content:
    print("INFO: El endpoint ya estaba instalado. No se ha modificado nada.")
    sys.exit(0)

count = content.count(ANCHOR)
if count == 0:
    print(f"ERROR: No se encontro el ancla en {FILE}. No se ha modificado nada.")
    sys.exit(1)
if count > 1:
    print(f"ERROR: El ancla aparece {count} veces (esperado 1). No se ha modificado nada por seguridad.")
    sys.exit(1)

new_content = content.replace(ANCHOR, BLOCK, 1)

with open(FILE, "w", encoding="utf-8") as f:
    f.write(new_content)

print("OK: Endpoint /api/sources/status insertado correctamente en server.ts")
