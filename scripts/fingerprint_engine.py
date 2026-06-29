#!/usr/bin/env python3
import requests
import argparse

def fingerprint(target, port=80):
    print(f"\n🔬 Fingerprinting → {target}:{port}\n")
    headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; CyberOSINT/1.0)'
    }
    
    try:
        url = f"http://{target}:{port}" if port != 443 else f"https://{target}"
        r = requests.get(url, headers=headers, timeout=6, verify=False)
        
        print(f"Status Code: {r.status_code}")
        print(f"Server: {r.headers.get('Server', 'No detectado')}")
        print(f"Powered-By: {r.headers.get('X-Powered-By', 'No detectado')}")
        print(f"Technology hints:")
        
        tech = []
        for header, value in r.headers.items():
            if any(x in header.lower() for x in ['server', 'powered', 'x-', 'asp', 'php', 'nginx', 'apache']):
                print(f"   • {header}: {value}")
                tech.append(value)
        
        return {"status": r.status_code, "tech": tech}
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("target", help="IP o Dominio")
    parser.add_argument("-p", "--port", type=int, default=80)
    args = parser.parse_args()
    fingerprint(args.target, args.port)
