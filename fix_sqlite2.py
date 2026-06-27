#!/usr/bin/env python3
import os, sys

SERVER = os.path.expanduser('~/threatradar-osint/server.ts')
with open(SERVER, 'r') as f:
    s = f.read()

OLD = """    // Usar SQLite directo en lugar de readDB() (JSON)
    const { getSQLiteDB } = await import('./src/sqlite.js');
    const sdb = getSQLiteDB();

    const c2Count     = (sdb.prepare('SELECT COUNT(*) as n FROM threat_map').get()    as any)?.n ?? 0;
    const ufCount     = (sdb.prepare('SELECT COUNT(*) as n FROM urlhaus_feed').get()  as any)?.n ?? 0;
    const usersCount  = (sdb.prepare('SELECT COUNT(*) as n FROM users').get()         as any)?.n ?? 0;
    const scansCount  = (sdb.prepare("SELECT COUNT(*) as n FROM usage_logs WHERE action='scan'").get() as any)?.n ?? 0;"""

NEW = """    // SQLite directo — export default db desde sqlite.ts
    const sdb = (await import('./src/sqlite.js')).default;

    const c2Count    = (() => { try { return (sdb.prepare('SELECT COUNT(*) as n FROM threat_map').get() as any)?.n ?? 0; } catch { return 0; } })();
    const ufCount    = (() => { try { return (sdb.prepare('SELECT COUNT(*) as n FROM urlhaus_feed').get() as any)?.n ?? 0; } catch { return 0; } })();
    const usersCount = (() => { try { return (sdb.prepare('SELECT COUNT(*) as n FROM users').get() as any)?.n ?? 0; } catch { return 0; } })();
    const scansCount = (() => { try { return (sdb.prepare("SELECT COUNT(*) as n FROM usage_logs WHERE action='scan'").get() as any)?.n ?? 0; } catch { return 0; } })();"""

if OLD in s:
    s = s.replace(OLD, NEW)
    with open(SERVER, 'w') as f:
        f.write(s)
    print("OK fix aplicado — export default db")
else:
    print("ERROR: bloque no encontrado exacto")
    idx = s.find('getSQLiteDB')
    if idx >= 0:
        print("Contexto encontrado:")
        print(repr(s[max(0,idx-100):idx+300]))
    sys.exit(1)
