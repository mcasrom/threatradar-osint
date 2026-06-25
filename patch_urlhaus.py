#!/usr/bin/env python3
import sys

path = '/home/miguelc/threatradar-osint/server.ts'

with open(path, 'r') as f:
    content = f.read()

# ── 1. Tabla SQLite urlhaus_feed ──────────────────────────────────────────────
TABLE = """
// --- URLHaus Feed DB setup ---
(function initURLHausTable() {
  const Database = require('better-sqlite3');
  const _db = new Database(require('path').join(process.cwd(), 'data/threatradar.db'));
  _db.prepare(`CREATE TABLE IF NOT EXISTS urlhaus_feed (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT UNIQUE NOT NULL,
    url_status TEXT,
    threat TEXT,
    tags TEXT,
    host TEXT,
    date_added TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`).run();
  _db.prepare(`CREATE INDEX IF NOT EXISTS idx_urlhaus_created ON urlhaus_feed(created_at)`).run();
  _db.close();
})();
async function fetchURLHausData() {
  try {
    const Database = require('better-sqlite3');
    const _db = new Database(require('path').join(process.cwd(), 'data/threatradar.db'));
    const res = await fetch('https://urlhaus-api.abuse.ch/v1/urls/recent/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'limit=100'
    });
    const data = await res.json();
    const urls = (data.urls || []).filter((u: any) => u.url_status === 'online');
    _db.prepare(`DELETE FROM urlhaus_feed WHERE created_at < datetime('now', '-48 hours')`).run();
    const insert = _db.prepare(`INSERT OR IGNORE INTO urlhaus_feed (url, url_status, threat, tags, host, date_added) VALUES (?,?,?,?,?,?)`);
    for (const u of urls) {
      insert.run(
        u.url || '',
        u.url_status || '',
        u.threat || '',
        Array.isArray(u.tags) ? u.tags.join(',') : (u.tags || ''),
        u.host || '',
        u.date_added || ''
      );
    }
    _db.close();
    console.log(`[URLHaus] Updated ${urls.length} malware URLs`);
  } catch (e: any) { console.error('[URLHaus] Error:', e.message); }
}
fetchURLHausData();
setInterval(fetchURLHausData, 6 * 60 * 60 * 1000); // cada 6h
"""

# ── 2. Endpoint /api/urlhaus/feed ─────────────────────────────────────────────
ENDPOINT = """
// URLHaus malware URL feed
app.get('/api/urlhaus/feed', requireAuth, (req: any, res) => {
  try {
    const Database = require('better-sqlite3');
    const _db = new Database(require('path').join(process.cwd(), 'data/threatradar.db'));
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const threat = req.query.threat as string;
    let query = `SELECT url, url_status, threat, tags, host, date_added, created_at FROM urlhaus_feed`;
    const params: any[] = [];
    if (threat) { query += ` WHERE threat = ?`; params.push(threat); }
    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);
    const rows = _db.prepare(query).all(...params);
    const stats = _db.prepare(`SELECT threat, COUNT(*) as count FROM urlhaus_feed GROUP BY threat ORDER BY count DESC`).all();
    _db.close();
    res.json({ total: rows.length, stats, urls: rows });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
"""

# Ancla 1: insertar tabla+cron justo antes de "// --- API Endpoints ---"
ANCHOR_TABLE = 'fetchThreatMapData();\nsetInterval(fetchThreatMapData, 60 * 60 * 1000);'
ANCHOR_TABLE_NEW = ANCHOR_TABLE + '\n' + TABLE

# Ancla 2: insertar endpoint después de /api/threatmap/live
ANCHOR_EP = "// 0. Demo pública — sin auth, 3 scans/día por IP"
ANCHOR_EP_NEW = ENDPOINT + '\n' + ANCHOR_EP

changes = 0

if ANCHOR_TABLE in content:
    content = content.replace(ANCHOR_TABLE, ANCHOR_TABLE_NEW, 1)
    changes += 1
    print('✓ Tabla urlhaus_feed + cron insertados')
else:
    print('✗ Ancla tabla no encontrada')

if ANCHOR_EP in content:
    content = content.replace(ANCHOR_EP, ANCHOR_EP_NEW, 1)
    changes += 1
    print('✓ Endpoint /api/urlhaus/feed insertado')
else:
    print('✗ Ancla endpoint no encontrada')

if changes == 2:
    with open(path, 'w') as f:
        f.write(content)
    print(f'\n✓ {changes}/2 cambios aplicados en server.ts')
else:
    print(f'\n✗ Solo {changes}/2 cambios — archivo NO modificado')
    sys.exit(1)
