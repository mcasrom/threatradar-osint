import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'threatradar.db'));

// Inicializar schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    scan_count TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    content TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

export function getUser(email: string) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
}

export function getUserById(id: string) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
}

export function createUser(id: string, email: string, password: string, plan = 'free') {
  const now = new Date().toISOString();
  db.prepare('INSERT INTO users (id, email, password, plan, scan_count, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, email, password, plan, '{}', now);
  return getUserById(id);
}

export function updateScanCount(id: string, scanCount: object) {
  db.prepare('UPDATE users SET scan_count = ? WHERE id = ?')
    .run(JSON.stringify(scanCount), id);
}

export function getScanCount(id: string): Record<string, number> {
  const user = getUserById(id);
  if (!user) return {};
  try { return JSON.parse(user.scan_count); } catch { return {}; }
}

export default db;
