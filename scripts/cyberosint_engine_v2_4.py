#!/usr/bin/env python3
"""
CyberOSINT Analysis Engine v2.4 - Professional Console Edition
"""

import argparse
import json
from datetime import datetime
from typing import Dict, Any

def safe_import(module_name: str, func_name: str):
    try:
        module = __import__(module_name, fromlist=[func_name])
        return getattr(module, func_name)
    except Exception:
        return None

port_scanner = safe_import("port_scanner", "port_scanner")
dns_analyzer = safe_import("dns_analyzer", "dns_analyzer")
classify_infrastructure = safe_import("infra_classifier", "classify_infrastructure")
fingerprint = safe_import("fingerprint_engine", "fingerprint")
tls_analyzer = safe_import("tls_analyzer", "tls_analyzer")
honeypot_detector = safe_import("honeypot_detector", "honeypot_detector")
calculate_risk = safe_import("explainable_risk", "calculate_risk")
entropy_analyzer = safe_import("entropy_analyzer", "entropy_analyzer")

LINE = "─" * 90
DOUBLE = "═" * 90

def separator(title=None):
    print()
    print(LINE)
    if title:
        print(title)
        print(LINE)

def print_status(label, value):
    print(f"{label:<12}: {value}")

def print_header(target):
    print("\n" + DOUBLE)
    print(" " * 28 + "CYBEROSINT ANALYSIS ENGINE v2.4")
    print(" " * 22 + "Professional Security Analysis Module")
    print(DOUBLE)
    print(f"{'Target':<22}: {target}")
    print(f"{'Date':<22}: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(DOUBLE)

def run_full_analysis(target, max_ports=1024):
    start = datetime.now()
    print_header(target)
    report: Dict[str, Any] = {"target": target, "timestamp": start.isoformat(), "modules": {}, "summary": {}}
    open_ports = []

    separator("[1/7] PORT SCANNER")
    try:
        if port_scanner:
            import io
            from contextlib import redirect_stdout
            s = io.StringIO()
            with redirect_stdout(s):
                raw = port_scanner(target, 1, max_ports, threads=200)
            open_ports = [p[0] for p in raw] if raw else []
        report["modules"]["port_scanner"] = {"open_ports": open_ports, "count": len(open_ports)}
        print_status("Status", "✅ Completed")
        print_status("Result", f"{len(open_ports)} open ports")
    except Exception as e:
        print_status("Status", "⚠ Error")
        print_status("Detail", str(e))

    modules = [
        ("DNS Analysis", dns_analyzer),
        ("Infrastructure Classifier", classify_infrastructure),
        ("Fingerprint & TLS", lambda t: (fingerprint(t,80) if fingerprint else None, tls_analyzer(t,443) if tls_analyzer else None)),
        ("Risk & Honeypot", lambda t: (honeypot_detector(t) if honeypot_detector else None, calculate_risk(t, open_ports) if calculate_risk else None)),
        ("Entropy Analysis", entropy_analyzer)
    ]

    for i,(name,func) in enumerate(modules,2):
        separator(f"[{i}/7] {name.upper()}")
        try:
            result = func(target) if func else None
            report["modules"][name.lower().replace(" ","_").replace("&","and")] = result
            print_status("Status","✅ Completed")
        except Exception as e:
            print_status("Status","⚠ Partial")
            print_status("Detail",str(e))

    risk_data = report["modules"].get("risk_and_honeypot",[None,{}])[1] or {}
    risk_level = risk_data.get("risk_level","Medium")
    recommendation = ("Immediate review recommended" if len(open_ports)>=4 else
                      "Improve security configuration" if len(open_ports)>=2 else
                      "Reasonable configuration")
    report["summary"]={"open_ports":len(open_ports),"risk_level":risk_level,"recommendation":recommendation}
    report["duration_seconds"]=round((datetime.now()-start).total_seconds(),2)
    fn=f"cyber_report_{target.replace('.','_')}_{datetime.now().strftime('%Y%m%d_%H%M')}.json"
    with open(fn,"w",encoding="utf-8") as f:
        json.dump(report,f,indent=2,default=str)

    print("\n"+DOUBLE)
    print("EXECUTIVE SUMMARY".center(90))
    print(DOUBLE)
    print(f"{'Open Ports':<28}: {len(open_ports)}")
    print(f"{'Risk Level':<28}: {risk_level}")
    print(f"{'Recommendation':<28}: {recommendation}")
    print(f"{'Execution Time':<28}: {report['duration_seconds']} s")
    print(f"{'JSON Report':<28}: {fn}")
    print(DOUBLE)

if __name__=="__main__":
    p=argparse.ArgumentParser(description="CyberOSINT Engine v2.4")
    p.add_argument("target")
    p.add_argument("--max-ports",type=int,default=1024)
    a=p.parse_args()
    run_full_analysis(a.target,a.max_ports)
