#!/usr/bin/env python3
import re

with open('server.ts', 'r') as f:
    content = f.read()

# Patch 1: endpoint /api/osint/shodan/:ip — reemplazar fetch a api.shodan.io por internetdb
old1 = """  const apiKey = process.env.SHODAN_API_KEY;
    const response = await fetch(`https://api.shodan.io/shodan/host/${ip}?key=${apiKey}`);"""

new1 = """  // InternetDB: Shodan free tier — ports, CVEs, tags sin API key
    const response = await fetch(`https://internetdb.shodan.io/${ip}`);"""

# Patch 2: llamada paralela en scan completo
old2 = """process.env.SHODAN_API_KEY
      ? fetch(`https://api.shodan.io/shodan/host/${ip}?key=${process.env.SHODAN_API_KEY}`)"""

new2 = """true
      ? fetch(`https://internetdb.shodan.io/${ip}`)"""

if old1 in content:
    content = content.replace(old1, new1)
    print("✅ Patch 1 OK — endpoint /api/osint/shodan/:ip")
else:
    print("❌ Patch 1 no encontrado — revisar manualmente línea 514")

if old2 in content:
    content = content.replace(old2, new2)
    print("✅ Patch 2 OK — llamada paralela scan completo")
else:
    print("❌ Patch 2 no encontrado — revisar manualmente línea 880")

with open('server.ts', 'w') as f:
    f.write(content)

print("\nVerificando resultado:")
for i, line in enumerate(content.split('\n'), 1):
    if 'internetdb' in line or 'api.shodan.io' in line:
        print(f"  L{i}: {line.strip()}")
