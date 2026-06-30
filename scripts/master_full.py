#!/usr/bin/env python3
from cyber_analysis_engine import run_full_analysis   # tu engine principal
from master_passive import run_passive_master
from master_defensive import run_defensive_master
from datetime import datetime
import json

def run_full_threatradar(target):
    print("Iniciando Análisis Completo ThreatRadar...")
    
    active = run_full_analysis(target)
    passive = run_passive_master(target)
    defensive = run_defensive_master(target, active.get("open_ports", []))

    final_report = {
        "report_type": "ThreatRadar Full Professional Report",
        "target": target,
        "generated": datetime.now().isoformat(),
        "active_analysis": active,
        "passive_intel": passive,
        "defensive_audit": defensive
    }

    filename = f"THREATRADAR_FULL_{target.replace('.','_')}.json"
    with open(filename, "w") as f:
        json.dump(final_report, f, indent=2, default=str)

    print(f"\nReporte completo generado: {filename}")
    return final_report

if __name__ == "__main__":
    target = input("Objetivo (IP): ")
    run_full_threatradar(target)
