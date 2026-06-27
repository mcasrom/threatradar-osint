#!/usr/bin/env python3
"""Sprint 24 — Historial rotacional premium: scan_history SQLite + endpoints + ScanHistoryPanel.tsx"""
import os, sys

BASE   = os.path.expanduser('~/threatradar-osint')
SERVER = f'{BASE}/server.ts'
APP    = f'{BASE}/src/App.tsx'
PANEL  = f'{BASE}/src/components/ScanHistoryPanel.tsx'

for p in [SERVER, APP]:
    if not os.path.exists(p):
        print(f"ERROR: {p}"); sys.exit(1)

# ══════════════════════════════════════════════════════════════
# 1. ENDPOINTS en server.ts — insertar antes de // Vite Middleware
# ══════════════════════════════════════════════════════════════
HISTORY_ENDPOINTS = """
// ═══════════════════════════════════════════════════════════
// HISTORIAL ROTACIONAL PREMIUM — Sprint 24
// ═══════════════════════════════════════════════════════════

// Crear tabla scan_history si no existe
(async () => {
  try {
    const sdb = (await import('./src/sqlite.js')).default;
    sdb.exec(`
      CREATE TABLE IF NOT EXISTS scan_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        ip TEXT NOT NULL,
        threat_score INTEGER,
        threat_level TEXT,
        country TEXT,
        isp TEXT,
        summary TEXT,
        sources_ok INTEGER,
        created_at TEXT NOT NULL
      )
    `);
    console.log('[scan_history] Tabla lista');
  } catch (e: any) { console.error('[scan_history] Error creando tabla:', e.message); }
})();

// Retención por plan en días
const RETENTION_DAYS: Record<string, number> = { free: 7, pro: 90, enterprise: 365 };

// Guardar scan en historial (llamado internamente tras /api/osint/ip-full)
async function saveScanHistory(userId: string, plan: string, ip: string, result: any, threatScore: any) {
  try {
    const sdb = (await import('./src/sqlite.js')).default;
    const id  = `sh-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    sdb.prepare(`
      INSERT INTO scan_history (id, user_id, ip, threat_score, threat_level, country, isp, summary, sources_ok, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, userId, ip,
      threatScore?.score ?? null,
      threatScore?.level ?? null,
      result?.ipinfo?.country ?? null,
      (result?.ipinfo?.org ?? '').slice(0, 80),
      threatScore?.conclusion?.summary?.slice(0, 300) ?? null,
      Object.values(result || {}).filter((v: any) => v && !v.error && typeof v === 'object').length,
      new Date().toISOString()
    );
    // Purgar entradas antiguas según plan
    const cutoff = new Date(Date.now() - (RETENTION_DAYS[plan] || 7) * 86400000).toISOString();
    sdb.prepare('DELETE FROM scan_history WHERE user_id = ? AND created_at < ?').run(userId, cutoff);
  } catch (e: any) { console.error('[scan_history] Error guardando:', e.message); }
}

// GET /api/history — historial del usuario autenticado
app.get('/api/history', authMiddleware, async (req: any, res) => {
  try {
    const sdb  = (await import('./src/sqlite.js')).default;
    const user = req.user;
    const plan = user.plan || 'free';
    const limit = plan === 'enterprise' ? 500 : plan === 'pro' ? 200 : 20;
    const rows = sdb.prepare(
      'SELECT * FROM scan_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
    ).all(user.id, limit);
    res.json({
      history: rows,
      plan,
      retention_days: RETENTION_DAYS[plan] || 7,
      total: rows.length,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/history/:id — eliminar entrada del historial
app.delete('/api/history/:id', authMiddleware, async (req: any, res) => {
  try {
    const sdb = (await import('./src/sqlite.js')).default;
    sdb.prepare('DELETE FROM scan_history WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

"""

with open(SERVER, 'r') as f: server = f.read()

ANCHOR = '// Vite Middleware'
if '/api/history' not in server:
    server = server.replace(ANCHOR, HISTORY_ENDPOINTS + ANCHOR)
    with open(SERVER, 'w') as f: f.write(server)
    print("OK server.ts — endpoints historial añadidos")
else:
    print("INFO server.ts — endpoints ya presentes")

# ══════════════════════════════════════════════════════════════
# 2. ScanHistoryPanel.tsx
# ══════════════════════════════════════════════════════════════
PANEL_TSX = """\
import React, { useState, useEffect } from 'react';
import { History, Trash2, RefreshCw, Shield, AlertTriangle } from 'lucide-react';

interface ScanEntry {
  id: string;
  ip: string;
  threat_score: number | null;
  threat_level: string | null;
  country: string | null;
  isp: string | null;
  summary: string | null;
  sources_ok: number;
  created_at: string;
}

const SCORE_COLOR = (s: number | null) =>
  !s ? 'text-zinc-500' :
  s >= 80 ? 'text-red-400' : s >= 60 ? 'text-orange-400' : s >= 30 ? 'text-yellow-400' : 'text-green-400';

const SCORE_BG = (s: number | null) =>
  !s ? 'bg-zinc-800' :
  s >= 80 ? 'bg-red-950/60' : s >= 60 ? 'bg-orange-950/60' : s >= 30 ? 'bg-yellow-950/60' : 'bg-green-950/60';

export function ScanHistoryPanel() {
  const [history, setHistory]   = useState<ScanEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [plan, setPlan]         = useState('free');
  const [retention, setRetention] = useState(7);
  const [deleting, setDeleting] = useState<string | null>(null);

  const token = () => localStorage.getItem('tr_token');

  const load = async () => {
    setLoading(true); setError('');
    const t = token();
    if (!t) { setError('Necesitas iniciar sesión.'); setLoading(false); return; }
    try {
      const r = await fetch('/api/history', { headers: { Authorization: `Bearer ${t}` } });
      if (!r.ok) throw new Error(`Error ${r.status}`);
      const d = await r.json();
      setHistory(d.history || []);
      setPlan(d.plan || 'free');
      setRetention(d.retention_days || 7);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const deleteEntry = async (id: string) => {
    setDeleting(id);
    const t = token();
    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } });
      setHistory(h => h.filter(e => e.id !== id));
    } catch {}
    finally { setDeleting(null); }
  };

  const planColor = plan === 'enterprise' ? 'text-purple-400' : plan === 'pro' ? 'text-brand-cyan' : 'text-zinc-400';

  return (
    <div className="space-y-4">

      <div className="bg-brand-panel border border-brand-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History size={16} className="text-brand-cyan" />
            <h2 className="text-sm font-bold text-white font-mono tracking-wider">HISTORIAL DE ANÁLISIS</h2>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 hover:text-brand-cyan border border-brand-border rounded px-2 py-1 transition">
            <RefreshCw size={10} className={loading ? 'animate-spin' : ''} /> Actualizar
          </button>
        </div>
        <div className="flex gap-4 mt-3 text-[10px] font-mono">
          <span>Plan: <span className={`font-bold uppercase ${planColor}`}>{plan}</span></span>
          <span className="text-zinc-500">Retención: <span className="text-zinc-300">{retention} días</span></span>
          <span className="text-zinc-500">Registros: <span className="text-zinc-300">{history.length}</span></span>
        </div>
        {plan === 'free' && (
          <div className="mt-3 flex items-center gap-2 bg-brand-cyan/5 border border-brand-cyan/20 rounded px-3 py-2">
            <AlertTriangle size={11} className="text-brand-cyan shrink-0" />
            <span className="text-[10px] font-mono text-zinc-400">
              Plan Free — 7 días retención, 20 registros max.
              <span className="text-brand-cyan ml-1">Pro: 90 días · Enterprise: 365 días</span>
            </span>
          </div>
        )}
      </div>

      {error && <div className="text-red-400 text-xs font-mono bg-red-400/10 border border-red-400/20 rounded p-3">{error}</div>}

      {loading && (
        <div className="text-center py-8 text-zinc-500 font-mono text-xs animate-pulse">Cargando historial...</div>
      )}

      {!loading && history.length === 0 && !error && (
        <div className="text-center py-10 space-y-2">
          <Shield size={28} className="mx-auto text-zinc-700" />
          <div className="text-zinc-500 text-xs font-mono">Sin análisis en el historial</div>
          <div className="text-zinc-600 text-[10px] font-mono">Los análisis aparecerán aquí tras analizar una IP</div>
        </div>
      )}

      {!loading && history.length > 0 && (
        <div className="space-y-2">
          {history.map(entry => (
            <div key={entry.id} className={`border border-brand-border rounded-lg p-3 ${SCORE_BG(entry.threat_score)} flex gap-3 items-start`}>

              <div className="shrink-0 text-center w-12">
                <div className={`text-xl font-bold font-mono ${SCORE_COLOR(entry.threat_score)}`}>
                  {entry.threat_score ?? '—'}
                </div>
                <div className="text-[8px] font-mono text-zinc-500">score</div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-mono text-[12px] font-bold">{entry.ip}</span>
                  {entry.threat_level && (
                    <span className={`text-[9px] font-mono font-bold ${SCORE_COLOR(entry.threat_score)}`}>
                      {entry.threat_level}
                    </span>
                  )}
                  {entry.country && <span className="text-[9px] font-mono text-zinc-500">{entry.country}</span>}
                </div>
                {entry.isp && <div className="text-[10px] font-mono text-zinc-500 mt-0.5 truncate">{entry.isp}</div>}
                {entry.summary && (
                  <div className="text-[10px] font-sans text-zinc-400 mt-1 leading-relaxed line-clamp-2">{entry.summary}</div>
                )}
                <div className="flex gap-3 mt-1.5 text-[9px] font-mono text-zinc-600">
                  <span>{new Date(entry.created_at).toLocaleString('es-ES')}</span>
                  <span>{entry.sources_ok} fuentes</span>
                </div>
              </div>

              <button
                onClick={() => deleteEntry(entry.id)}
                disabled={deleting === entry.id}
                className="shrink-0 p-1.5 rounded border border-brand-border text-zinc-600 hover:text-red-400 hover:border-red-400/40 transition"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
"""

with open(PANEL, 'w') as f: f.write(PANEL_TSX)
print("OK ScanHistoryPanel.tsx creado")

# ══════════════════════════════════════════════════════════════
# 3. App.tsx — añadir tab Historial
# ══════════════════════════════════════════════════════════════
with open(APP, 'r') as f: app = f.read()

changed = False

# Import
OLD_IMP = "import { LegalPanel } from './components/LegalPanel';"
NEW_IMP = OLD_IMP + "\nimport { ScanHistoryPanel } from './components/ScanHistoryPanel';"
if 'ScanHistoryPanel' not in app:
    app = app.replace(OLD_IMP, NEW_IMP); changed = True

# Tipo tab
OLD_T = "'monitor' | 'osint' | 'ai-report' | 'dispatch' | 'billing' | 'pricing' | 'docs' | 'dashboard' | 'audit' | 'legal'"
NEW_T = OLD_T.replace("'legal'", "'legal' | 'historial'")
if "'historial'" not in app:
    app = app.replace(OLD_T, NEW_T); changed = True

# Botón tab — después del botón Legal
OLD_BTN = "            <Scale size={14} /> Legal\n          </button>"
NEW_BTN = OLD_BTN + """
          <button
            onClick={() => setActiveTab('historial')}
            className={`flex-1 py-2 px-3 text-xs font-sans font-semibold rounded-md transition flex justify-center items-center gap-2 ${
              activeTab === 'historial' ? 'bg-brand-cyan text-brand-bg shadow font-bold' : 'text-zinc-400 hover:bg-brand-panel hover:text-white'
            }`}
          >
            <Activity size={14} /> Historial
          </button>"""
if 'Historial' not in app:
    app = app.replace(OLD_BTN, NEW_BTN); changed = True

# Render
OLD_R = "{activeTab === 'legal' && <LegalPanel />}"
NEW_R = OLD_R + "\n\n          {activeTab === 'historial' && <ScanHistoryPanel />}"
if 'ScanHistoryPanel' not in app:
    app = app.replace(OLD_R, NEW_R); changed = True

with open(APP, 'w') as f: f.write(app)
print(f"OK App.tsx {'parcheado' if changed else 'ya actualizado'}")
print("\nDONE — Sprint 24 historial listo para build")
