#!/usr/bin/env python3

path = '/home/miguelc/threatradar-osint/server.ts'

with open(path, 'r') as f:
    content = f.read()

old = """    const res = await fetch('https://urlhaus-api.abuse.ch/v1/urls/recent/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'limit=100'
    });
    const data = await res.json();
    const urls = (data.urls || []).filter((u: any) => u.url_status === 'online');"""

new = """    const res = await fetch('https://urlhaus.abuse.ch/downloads/json_recent/', {
      method: 'GET'
    });
    const data = await res.json();
    // json_recent devuelve dict {host: [urls]}  — aplanar y tomar las 100 primeras online
    const allUrls: any[] = Object.values(data).flat();
    const urls = allUrls.filter((u: any) => u.url_status === 'online').slice(0, 100);"""

if old in content:
    content = content.replace(old, new, 1)
    # Adaptar campos: dateadded -> date_added, tags es array
    content = content.replace(
        "u.date_added || ''",
        "u.dateadded || u.date_added || ''"
    )
    with open(path, 'w') as f:
        f.write(content)
    print('✓ Fix URLHaus fetch aplicado')
else:
    print('✗ Patrón no encontrado')
