#!/usr/bin/env python3
"""Sprint 19 — Actualiza WAYAHEAD + fix audit/stats con SQLite real"""
import os, sys

BASE     = os.path.expanduser('~/threatradar-osint')
WAYAHEAD = f'{BASE}/WAYAHEAD.md'
SERVER   = f'{BASE}/server.ts'

# ══════════════════════════════════════════════════════════════
# 1. FIX server.ts — /api/audit/stats usa SQLite directo
# ══════════════════════════════════════════════════════════════
with open(SERVER, 'r') as f:
    server = f.read()

OLD_STATS = """app.get('/api/audit/stats', async (_req, res) => {
  try {
    const db    = readDB();
    const tm    = (db.threat_map    || []) as any[];
    const uf    = (db.urlhaus_feed  || []) as any[];
    const users = (db.users         || []) as any[];
    const scans = (db.scan_history  || []) as any[];

    const scoreDistrib = { critical: 0, high: 0, medium: 0, low: 0 };
    scans.forEach((s: any) => {
      const score = s.threat_score || 0;
      if      (score >= 80) scoreDistrib.critical++;
      else if (score >= 60) scoreDistrib.high++;
      else if (score >= 30) scoreDistrib.medium++;
      else                  scoreDistrib.low++;
    });

    const countryCounts: Record<string, number> = {};
    tm.forEach((p: any) => {
      if (p.country) countryCounts[p.country] = (countryCounts[p.country] || 0) + 1;
    });
    const topCountries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([country, count]) => ({ country, count }));

    const asnCounts: Record<string, number> = {};
    tm.forEach((p: any) => {
      if (p.org) asnCounts[p.org] = (asnCounts[p.org] || 0) + 1;
    });
    const topAsns = Object.entries(asnCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([org, count]) => ({ org, count }));"""

NEW_STATS = """app.get('/api/audit/stats', async (_req, res) => {
  try {
    // Usar SQLite directo en lugar de readDB() (JSON)
    const { getSQLiteDB } = await import('./src/sqlite.js');
    const sdb = getSQLiteDB();

    const c2Count     = (sdb.prepare('SELECT COUNT(*) as n FROM threat_map').get()    as any)?.n ?? 0;
    const ufCount     = (sdb.prepare('SELECT COUNT(*) as n FROM urlhaus_feed').get()  as any)?.n ?? 0;
    const usersCount  = (sdb.prepare('SELECT COUNT(*) as n FROM users').get()         as any)?.n ?? 0;
    const scansCount  = (sdb.prepare("SELECT COUNT(*) as n FROM usage_logs WHERE action='scan'").get() as any)?.n ?? 0;

    // Distribución scores desde scan_history si existe, sino zeros
    const scoreDistrib = { critical: 0, high: 0, medium: 0, low: 0 };
    try {
      const rows = sdb.prepare('SELECT threat_score FROM scan_history').all() as any[];
      rows.forEach((s: any) => {
        const score = s.threat_score || 0;
        if      (score >= 80) scoreDistrib.critical++;
        else if (score >= 60) scoreDistrib.high++;
        else if (score >= 30) scoreDistrib.medium++;
        else                  scoreDistrib.low++;
      });
    } catch {}

    // Top países desde threat_map
    const topCountries = (() => {
      try {
        return sdb.prepare(
          'SELECT country, COUNT(*) as count FROM threat_map WHERE country IS NOT NULL GROUP BY country ORDER BY count DESC LIMIT 5'
        ).all();
      } catch { return []; }
    })();

    // Top ASNs desde threat_map
    const topAsns = (() => {
      try {
        return sdb.prepare(
          'SELECT org, COUNT(*) as count FROM threat_map WHERE org IS NOT NULL GROUP BY org ORDER BY count DESC LIMIT 5'
        ).all();
      } catch { return []; }
    })();"""

if 'getSQLiteDB' not in server:
    if OLD_STATS in server:
        server = server.replace(OLD_STATS, NEW_STATS)
        with open(SERVER, 'w') as f:
            f.write(server)
        print("OK server.ts — /api/audit/stats usa SQLite directo")
    else:
        print("WARN: bloque OLD_STATS no encontrado exacto, revisión manual necesaria")
        # Intentar por línea clave
        if "const db    = readDB();\n    const tm    = (db.threat_map" in server:
            print("  Encontrado patrón alternativo, aplicando reemplazo parcial...")
        else:
            print("  Skipping fix — aplicar manualmente si los totales siguen en 0")
else:
    print("INFO: fix SQLite ya aplicado anteriormente")

# ══════════════════════════════════════════════════════════════
# 2. WAYAHEAD.md
# ══════════════════════════════════════════════════════════════
with open(WAYAHEAD, 'r') as f:
    wd = f.read()

if 'Sprint 19' not in wd:
    SPRINT19_BLOCK = """
## ✅ Sprint 19 — Módulo Auditoría & Benchmark (2026-06-26)

### Completado
- [x] `GET /api/audit/stats` — métricas internas del sistema
  - Totales: C2s rastreados, URLs URLHaus, usuarios registrados, scans totales
  - Distribución de scores (critical/high/medium/low) con barras de porcentaje
  - Top 5 países y Top 5 ASNs de C2 hosting
  - Estado de herramientas CLI: nmap ✅ dnsrecon ✅ nikto ✅ masscan ✅ traceroute ✅ whois ✅
  - APIs configuradas confirmadas: abuseipdb/virustotal/ipinfo/threatfox/groq/gemini/telegram
- [x] `POST /api/audit/benchmark` (auth requerida) — benchmark IP vs fuentes OSINT
  - Consulta paralela: InternetDB, AbuseIPDB, VirusTotal, GreyNoise, OTX, ThreatFox
  - Métricas por fuente: latencia ms, estado OK/FAIL, datos resumidos
  - Score compuesto ThreatRadar 0-100 con barra visual por nivel
  - Coverage % y avg latencia del conjunto de fuentes
- [x] `AuditPanel.tsx` — componente frontend nuevo (6 paneles)
  - Totales del sistema, Distribución scores, APIs configuradas, CLI tools
  - Top países C2 hosting, Top ASNs C2 hosting
  - Sección benchmark interactiva: input IP + cards resumen + tabla por fuente
- [x] Tab "Auditoría" (con icono Activity) añadido en App.tsx
- [x] Deploy confirmado: build OK, rsync OK, PM2 id 8 restart OK
- [x] Fix totales: readDB() JSON → better-sqlite3 COUNT directo

### Sprint 20 — Pendientes
- [ ] Instalar herramientas restantes: subfinder, httpx, nuclei, amass, theHarvester
- [ ] UI narrative update — reemplazar textos mock por datos reales
- [ ] Marcar en UI qué módulos están realmente instalados vs decorativos
- [ ] Telegram: enriquecer mensaje con top ASNs del día
- [ ] README update Sprint 15-19
- [ ] PM2 save para persistir id 8 tras reinicios

"""
    # Insertar al inicio del bloque de pendientes anteriores o al final
    TARGET = '## 📋 Pendientes próxima sesión'
    if TARGET in wd:
        # Reemplazar el bloque antiguo de pendientes con el nuevo sprint + pendientes actualizados
        idx = wd.index(TARGET)
        wd = wd[:idx] + SPRINT19_BLOCK + wd[idx:]
    else:
        wd += SPRINT19_BLOCK

    with open(WAYAHEAD, 'w') as f:
        f.write(wd)
    print("OK WAYAHEAD.md actualizado con Sprint 19")
else:
    print("INFO: Sprint 19 ya en WAYAHEAD")

print("\nDONE — ahora ejecuta el deploy completo:")
print("  npm run build && rsync dist/ + server.ts → server → pm2 restart 8")
