#!/usr/bin/env python3
"""
CyberOSINT Analysis Engine v2.3 - Versión Pulida Final
"""

import argparse
import json
import warnings
import sys
from datetime import datetime
from typing import Dict, Any

# Imports
def safe_import(module_name: str, func_name: str):
    try:
        module = __import__(module_name, fromlist=[func_name])
        return getattr(module, func_name)
    except:
        return None

port_scanner         = safe_import("port_scanner", "port_scanner")
dns_analyzer         = safe_import("dns_analyzer", "dns_analyzer")
classify_infrastructure = safe_import("infra_classifier", "classify_infrastructure")
fingerprint          = safe_import("fingerprint_engine", "fingerprint")
tls_analyzer         = safe_import("tls_analyzer", "tls_analyzer")
honeypot_detector    = safe_import("honeypot_detector", "honeypot_detector")
calculate_risk       = safe_import("explainable_risk", "calculate_risk")
entropy_analyzer     = safe_import("entropy_analyzer", "entropy_analyzer")


def print_header(target: str):
    print("\n" + "═" * 90)
    print(" " * 28 + "CYBEROSINT ANALYSIS ENGINE v2.3")
    print(" " * 22 + "Módulo Profesional de Análisis de Seguridad")
    print("═" * 90)
    print(f"Objetivo".ljust(22) + f": {target}")
    print(f"Fecha".ljust(22) + f": {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("═" * 90 + "\n")


def run_full_analysis(target: str, max_ports: int = 1024):
    start_time = datetime.now()
    print_header(target)

    report: Dict[str, Any] = {
        "target": target,
        "timestamp": start_time.isoformat(),
        "modules": {},
        "summary": {}
    }

    open_ports = []

    # Port Scanner (capturando salida)
    print("[1/7] Port Scanner → ", end="")
    try:
        if port_scanner:
            # Ejecutamos pero suprimimos la salida verbosa del módulo original
            import io
            from contextlib import redirect_stdout
            f = io.StringIO()
            with redirect_stdout(f):
                open_ports_raw = port_scanner(target, 1, max_ports, threads=200)
            open_ports = [p[0] for p in open_ports_raw] if open_ports_raw else []
            print(f"✅ {len(open_ports)} puertos abiertos")
        report["modules"]["port_scanner"] = {"open_ports": open_ports, "count": len(open_ports)}
    except:
        print("⚠️ Error")
    
    # Resto de módulos (más limpios)
    modules = [
        ("DNS Analysis", dns_analyzer),
        ("Infrastructure Classifier", classify_infrastructure),
        ("Fingerprint & TLS", lambda t: (fingerprint(t,80) if fingerprint else None, tls_analyzer(t,443) if tls_analyzer else None)),
        ("Risk & Honeypot", lambda t: (honeypot_detector(t) if honeypot_detector else None, calculate_risk(t, open_ports) if calculate_risk else None)),
        ("Entropy Analysis", entropy_analyzer)
    ]

    for i, (name, func) in enumerate(modules, 2):
        print(f"[{i}/7] {name} → ", end="")
        try:
            result = func(target) if func else None
            print("✅ Completado")
            report["modules"][name.lower().replace(" ", "_").replace("&", "and")] = result
        except Exception:
            print("⚠️ Parcial")

    # Resumen Final
    open_count = len(open_ports)
    risk_data = report["modules"].get("risk_and_honeypot", [None, {}])[1] or {}
    risk_level = risk_data.get("risk_level", "Medio")

    recommendation = "Revisión inmediata recomendada" if open_count >= 4 else \
                     "Mejorar configuración de seguridad" if open_count >= 2 else \
                     "Configuración razonable"

    summary = {
        "open_ports": open_count,
        "risk_level": risk_level,
        "recommendation": recommendation
    }
    report["summary"] = summary
    report["duration_seconds"] = round((datetime.now() - start_time).total_seconds(), 2)

    filename = f"cyber_report_{target.replace('.', '_')}_{datetime.now().strftime('%Y%m%d_%H%M')}.json"
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, default=str)

    print("\n" + "═" * 90)
    print("RESUMEN EJECUTIVO".center(90))
    print("═" * 90)
    print(f"{'Puertos Abiertos':<25}: {open_count}")
    print(f"{'Nivel de Riesgo':<25}: {risk_level}")
    print(f"{'Recomendación':<25}: {recommendation}")
    print(f"{'Duración Total':<25}: {report['duration_seconds']}s")
    print(f"{'Reporte JSON':<25}: {filename}")
    print("═" * 90)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CyberOSINT Engine v2.3")
    parser.add_argument("target", help="IP a analizar")
    parser.add_argument("--max-ports", type=int, default=1024)
    args = parser.parse_args()
    
    run_full_analysis(args.target, args.max_ports)
