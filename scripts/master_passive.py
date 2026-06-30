#!/usr/bin/env python3
from dns_analyzer import dns_analyzer
from whois_analyzer import whois_analyzer
from geoip_asn_analyzer import geoip_asn_analyzer
from entropy_analyzer import entropy_analyzer
from passive_vuln_scanner import passive_vuln_scan
from security_headers_checker import check_security_headers
from datetime import datetime
import json

def run_passive_master(target):
    report = {
        "type": "Passive Intelligence Report",
        "target": target,
        "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "modules": {}
    }

    report["modules"]["dns"] = dns_analyzer(target)
    report["modules"]["whois"] = whois_analyzer(target)
    report["modules"]["geoip"] = geoip_asn_analyzer(target)
    report["modules"]["entropy"] = entropy_analyzer(target)
    report["modules"]["passive_vuln"] = passive_vuln_scan(target)
    report["modules"]["security_headers"] = check_security_headers(target)

    with open(f"passive_report_{target.replace('.','_')}.json", "w") as f:
        json.dump(report, f, indent=2, default=str)

    print("Passive Master Report generado correctamente.")
    return report

if __name__ == "__main__":
    target = input("IP o Dominio: ")
    run_passive_master(target)
