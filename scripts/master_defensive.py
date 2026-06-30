#!/usr/bin/env python3
from infra_classifier import classify_infrastructure
from exposed_services_audit import audit_exposed_services
from ssl_tls_config_analyzer import analyze_tls
from explainable_risk import calculate_risk
from honeypot_detector import honeypot_detector
from datetime import datetime
import json

def run_defensive_master(target, open_ports=None):
    if open_ports is None:
        open_ports = [22,23,53,80]  # ejemplo

    report = {
        "type": "Defensive Security Report",
        "target": target,
        "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "modules": {}
    }

    report["modules"]["infrastructure"] = classify_infrastructure(target)
    report["modules"]["exposed_services"] = audit_exposed_services(open_ports)
    report["modules"]["tls_config"] = analyze_tls(target)
    report["modules"]["risk_assessment"] = calculate_risk(target, open_ports)
    report["modules"]["honeypot_check"] = honeypot_detector(target)

    with open(f"defensive_report_{target.replace('.','_')}.json", "w") as f:
        json.dump(report, f, indent=2, default=str)

    print("Defensive Master Report generado correctamente.")
    return report

if __name__ == "__main__":
    target = input("IP o Dominio: ")
    run_defensive_master(target)
