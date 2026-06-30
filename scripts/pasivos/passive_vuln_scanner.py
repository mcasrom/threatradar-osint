# passive_vuln_scanner.py
import requests
import argparse
from datetime import datetime

def passive_vuln_check(target):
    print(f"\n🛡️  Passive Vulnerability Scanner → {target}\n")
    
    checks = {
        "heartbleed": "https://internetdb.shodan.io/{target}",  # ejemplo
        "known_vulns": f"https://cve.circl.lu/api/search/{target}"
    }
    
    # Banner grabbing pasivo + headers de seguridad
    try:
        r = requests.get(f"http://{target}", timeout=5, verify=False)
        headers = r.headers
        
        security_headers = {
            "Strict-Transport-Security": headers.get("Strict-Transport-Security"),
            "X-Frame-Options": headers.get("X-Frame-Options"),
            "Content-Security-Policy": headers.get("Content-Security-Policy"),
            "X-Content-Type-Options": headers.get("X-Content-Type-Options")
        }
        
        print("Security Headers:")
        for k, v in security_headers.items():
            status = "✅ Presente" if v else "❌ Ausente"
            print(f"   • {k:<30} {status}")
        
    except:
        print("No se pudo conectar al servicio web.")

    print("\nRecomendaciones defensivas:")
    print("- Implementar todos los security headers")
    print("- Deshabilitar Telnet (puerto 23)")
    print("- Usar SSH con key-based auth solo")
    print("- Cerrar DNS recursivo si no es necesario")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("target", help="IP/Dominio")
    args = parser.parse_args()
    passive_vuln_check(args.target)
