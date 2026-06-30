#!/usr/bin/env python3
"""
Prueba cada modulo Python contra un objetivo seguro y resume OK/ERROR.
Uso: python3 scripts/test_modules.py <dominio_o_ip>
Ejemplo: python3 scripts/test_modules.py viajeinteligencia.com
"""
import subprocess
import sys
import time
from pathlib import Path

if len(sys.argv) < 2:
    print("Uso: python3 test_modules.py <dominio_o_ip>")
    sys.exit(1)

TARGET = sys.argv[1]
BASE = Path(__file__).parent

MODULES = {
    "PASIVOS (sin riesgo, ya probados)": [
        "pasivos/asn_analyzer.py",
        "pasivos/dns_analyzer.py",
        "pasivos/entropy_analyzer.py",
        "pasivos/geoip_asn_analyzer.py",
        "pasivos/whois_analyzer.py",
        "pasivos/passive_vuln_scanner.py",
        "pasivos/security_headers_checker.py",
    ],
    "DEFENSIVOS (lectura/clasificacion, bajo riesgo)": [
        "defensivos/honeypot_detector.py",
        "defensivos/infra_classifier.py",
        "defensivos/reputation_engine.py",
        "defensivos/ssl_tls_config_analyzer.py",
    ],
    "CORE (motores de analisis, agregan otras fuentes)": [
        "core/cyber_analysis_engine.py",
        "core/cyberosint_engine_v2_4.py",
    ],
    "ACTIVOS (escaneo activo — usar SOLO contra objetivos propios)": [
        "activos/fingerprint_engine.py",
        "activos/port_scanner.py",
        "activos/tls_analyzer.py",
    ],
}

results = []

for category, mods in MODULES.items():
    for mod in mods:
        path = BASE / mod
        if not path.exists():
            results.append((category, mod, "NO EXISTE", ""))
            continue
        t0 = time.time()
        try:
            p = subprocess.run(
                ["python3", str(path), TARGET],
                capture_output=True, text=True, timeout=45
            )
            elapsed = time.time() - t0
            out = (p.stdout or "").strip()
            if p.returncode == 0:
                preview = out.replace("\n", " | ")[:200]
                # Heuristica: si el output esta lleno de N/A o None, marcar como sospechoso
                suspect_markers = out.count("N/A") + out.count("None") + out.count("No disponible")
                status = f"OK-VACIO ({elapsed:.1f}s, {suspect_markers}x N/A/None)" if suspect_markers >= 3 else f"OK ({elapsed:.1f}s)"
                if not out:
                    status = f"OK-SIN-OUTPUT ({elapsed:.1f}s)"
                results.append((category, mod, status, preview))
            else:
                err = (p.stderr or "").strip().replace("\n", " | ")[:200]
                results.append((category, mod, f"ERROR rc={p.returncode}", err))
        except subprocess.TimeoutExpired:
            results.append((category, mod, "TIMEOUT (>45s)", ""))
        except Exception as e:
            results.append((category, mod, "EXCEPCION", str(e)[:200]))

print(f"\n{'='*95}")
print(f" RESULTADOS — objetivo: {TARGET}")
print(f"{'='*95}")
current_cat = None
for category, mod, status, preview in results:
    if category != current_cat:
        print(f"\n--- {category} ---")
        current_cat = category
    print(f"\n  [{status}] {mod}")
    if preview:
        print(f"     → {preview}")
print(f"\n{'='*95}")
ok = sum(1 for _, _, s, _ in results if s.startswith("OK ("))
vacio = sum(1 for _, _, s, _ in results if "OK-VACIO" in s or "OK-SIN-OUTPUT" in s)
error = len(results) - ok - vacio
print(f" RESUMEN: {ok} OK limpios | {vacio} OK pero sospechosos (vacios/N-A) | {error} con error")
print(f"{'='*95}")
