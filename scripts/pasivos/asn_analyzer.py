#!/usr/bin/env python3
import requests
import argparse

def asn_analyzer(target):
    print(f"\n🌐 ASN + Organización Analysis → {target}\n")
    try:
        # Usando ipinfo.io (buen balance)
        r = requests.get(f"https://ipinfo.io/{target}/json", timeout=5)
        data = r.json()
        
        print(f"ASN:           {data.get('org', 'N/A')}")
        print(f"Hostname:      {data.get('hostname', 'N/A')}")
        print(f"País:          {data.get('country', 'N/A')}")
        print(f"Región:        {data.get('region', 'N/A')}")
        print(f"Ciudad:        {data.get('city', 'N/A')}")
        
        # Intentar extraer número ASN
        org = data.get('org', '')
        if 'AS' in org:
            asn_num = org.split()[0]
            print(f"ASN Number:    {asn_num}")
        
        return data
    except Exception as e:
        print(f"Error: {e}. Probando alternativa...")
        # Fallback con otra API
        try:
            r = requests.get(f"https://api.bgpview.io/ip/{target}", timeout=5)
            print("Datos BGP disponibles (parciales)")
        except:
            pass
        return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("target", help="IP a analizar")
    args = parser.parse_args()
    asn_analyzer(args.target)
