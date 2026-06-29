#!/usr/bin/env python3
import requests
import argparse
from datetime import datetime

def check_reputation(target):
    print(f"\n⭐ Reputation Analysis → {target}\n")
    results = {}
    
    # VirusTotal (necesitas API key)
    try:
        vt_key = "TU_VIRUSTOTAL_API_KEY"  # ← Cambia esto
        if vt_key != "TU_VIRUSTOTAL_API_KEY":
            url = f"https://www.virustotal.com/api/v3/ip_addresses/{target}"
            headers = {"x-apikey": vt_key}
            r = requests.get(url, headers=headers, timeout=6)
            if r.status_code == 200:
                data = r.json()
                score = data['data']['attributes']['last_analysis_stats']
                malicious = score.get('malicious', 0)
                print(f"🦠 VirusTotal: {malicious} detecciones maliciosas")
                results['virustotal'] = malicious
    except:
        print("VirusTotal: No disponible (API key)")
    
    # AbuseIPDB
    try:
        abd_key = "TU_ABUSEIPDB_API_KEY"
        if abd_key != "TU_ABUSEIPDB_API_KEY":
            url = f"https://api.abuseipdb.com/api/v2/check?ipAddress={target}"
            headers = {'Key': abd_key, 'Accept': 'application/json'}
            r = requests.get(url, headers=headers, timeout=6)
            if r.status_code == 200:
                data = r.json()['data']
                print(f"🚨 AbuseIPDB: {data['abuseConfidenceScore']}% de confianza de abuso")
                results['abuseipdb'] = data['abuseConfidenceScore']
    except:
        print("AbuseIPDB: No disponible")
    
    # IP Reputation simple (ipqualityscore o similar)
    try:
        r = requests.get(f"https://ipinfo.io/{target}/json", timeout=5)
        data = r.json()
        print(f"📍 ISP: {data.get('org')}")
        print(f"Locación: {data.get('city')}, {data.get('country')}")
    except:
        pass
    
    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("target", help="IP o Dominio")
    args = parser.parse_args()
    check_reputation(args.target)
