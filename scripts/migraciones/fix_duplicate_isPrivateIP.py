#!/usr/bin/env python3
"""
Elimina la funcion isPrivateIP duplicada que se inserto dentro de /api/osint/ip-full/:ip
y la sustituye por una llamada a la funcion global isPrivateIP() ya existente en el archivo
(linea ~141), que ya incluye proteccion para 178.105.80.193 (servidor propio).
Uso: python3 fix_duplicate_isPrivateIP.py
"""
import sys

FILE = "server.ts"
MARKER2 = "// __DUPLICATE_ISPRIVATEIP_REMOVED__"

OLD = """  // __PRIVATE_IP_GUARD_INSTALLED__
  // Deteccion de IP privada/local — evita gastar llamadas a APIs externas en vano
  // y guia al usuario hacia su IP publica real
  const isPrivateIP = (addr: string): boolean => {
    if (addr.startsWith('127.') || addr === 'localhost') return true;
    if (addr.startsWith('10.')) return true;
    if (addr.startsWith('192.168.')) return true;
    if (addr.startsWith('169.254.')) return true; // link-local
    const parts = addr.split('.').map(Number);
    if (addr.startsWith('172.') && parts.length === 4 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (addr === '::1' || addr.startsWith('fe80:') || addr.startsWith('fc') || addr.startsWith('fd')) return true;
    return false;
  };

  if (isPrivateIP(ip)) {"""

NEW = f"""  {MARKER2}
  // Usa la funcion global isPrivateIP() (linea ~141), que YA incluye proteccion
  // para 178.105.80.193 (servidor propio) y los rangos privados estandar.
  if (isPrivateIP(ip) || ip === '127.0.0.1' || ip.startsWith('169.254.')) {{"""

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

if MARKER2 in content:
    print("INFO: Ya estaba corregido. No se ha modificado nada.")
    sys.exit(0)

count = content.count(OLD)
if count == 0:
    print("ERROR: No se encontro el bloque exacto a eliminar. No se ha modificado nada.")
    sys.exit(1)
if count > 1:
    print(f"ERROR: El bloque aparece {count} veces. No se ha modificado nada por seguridad.")
    sys.exit(1)

new_content = content.replace(OLD, NEW, 1)
with open(FILE, "w", encoding="utf-8") as f:
    f.write(new_content)

print("OK: Funcion duplicada eliminada. Ahora usa la isPrivateIP() global (con proteccion de 178.105.80.193)")
