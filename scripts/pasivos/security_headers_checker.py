#!/usr/bin/env python3
import requests
import json
from datetime import datetime

def check_security_headers(target: str):
    try:
        r = requests.get(f"http://{target}", timeout=5, verify=False)
        headers = r.headers
        
        security_score = 0
        results = {}
        
        checks = {
            "Strict-Transport-Security": "HSTS",
            "Content-Security-Policy": "CSP",
            "X-Frame-Options": "Clickjacking Protection",
            "X-Content-Type-Options": "MIME Sniffing",
            "Referrer-Policy": "Referrer Policy"
        }
        
        for header, name in checks.items():
            present = bool(headers.get(header))
            results[name] = "Presente" if present else "Ausente"
            if present: security_score += 20
        
        return {
            "target": target,
            "security_score": security_score,
            "headers": results,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {"error": str(e)}
