#!/usr/bin/env python3
"""
Infrastructure Classifier v2 - Optimizado para Routers WiFi y Dispositivos Locales
"""

import requests
import socket
import re
import argparse
from typing import Dict

def classify_infrastructure(target: str) -> Dict:
    print(f"🏗️  Infrastructure Classifier → {target}")
    
    result = {
        "type": "Dispositivo de Red Local",
        "brand": "Desconocido",
        "model_hints": [],
        "confidence": 40,
        "services": [],
        "details": {}
    }

    try:
        # === Análisis Web (HTTP/HTTPS) ===
        for port in [80, 8080, 443, 8443]:
            try:
                protocol = "https" if port in (443, 8443) else "http"
                url = f"{protocol}://{target}:{port}"
                
                r = requests.get(url, timeout=4, verify=False, allow_redirects=True)
                
                server_header = r.headers.get('Server', '').lower()
                powered_by = r.headers.get('X-Powered-By', '').lower()
                title_match = re.search(r'<title>(.*?)</title>', r.text, re.IGNORECASE | re.DOTALL)
                title = title_match.group(1).strip()[:120] if title_match else ""

                result["details"][f"port_{port}"] = {
                    "server": server_header,
                    "title": title
                }

                # Detecciones específicas por marca
                if any(x in server_header or title.lower() for x in ['mikrotik', 'routeros', 'winbox']):
                    result["brand"] = "MikroTik"
                    result["type"] = "Router Profesional / RouterOS"
                    result["confidence"] = 88
                    result["model_hints"].append("Router MikroTik")
                    result["services"].append("WinBox / WebFig")

                elif any(x in server_header or title.lower() for x in ['tp-link', 'tplink', 'archer', 'mercury']):
                    result["brand"] = "TP-Link"
                    result["type"] = "Router WiFi Doméstico"
                    result["confidence"] = 82
                    result["model_hints"].append("TP-Link Archer / Deco")

                elif any(x in server_header or title.lower() for x in ['huawei', 'hg', 'hon', 'hi-link']):
                    result["brand"] = "Huawei"
                    result["type"] = "Router / ONT Fibra"
                    result["confidence"] = 80

                elif any(x in server_header or title.lower() for x in ['asus', 'rt-', 'aimesh', 'zenwifi']):
                    result["brand"] = "ASUS"
                    result["type"] = "Router Gaming / Mesh"
                    result["confidence"] = 78

                elif 'openwrt' in server_header or 'openwrt' in title.lower():
                    result["brand"] = "OpenWrt"
                    result["type"] = "Router Customizado"
                    result["confidence"] = 90

                elif 'dd-wrt' in server_header or 'dd-wrt' in title.lower():
                    result["brand"] = "DD-WRT"
                    result["type"] = "Router Customizado"
                    result["confidence"] = 85

                # Guardar servicio web
                result["services"].append(f"Interfaz Web Admin ({port})")

            except:
                continue

        # === Detección por puertos clásicos ===
        common_ports = {
            23: "Telnet (Riesgoso)",
            22: "SSH",
            53: "DNS Server",
            8291: "MikroTik WinBox",
            2323: "Telnet Alternativo"
        }

        for port, service_name in common_ports.items():
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1.2)
                if sock.connect_ex((target, port)) == 0:
                    result["services"].append(f"{service_name} ({port})")
                    if port == 8291:
                        result["brand"] = "MikroTik"
                        result["confidence"] = max(result["confidence"], 85)
                sock.close()
            except:
                pass

        # Ajuste final de confianza
        if len(result["services"]) >= 5:
            result["confidence"] = min(95, result["confidence"] + 15)

        # Salida final
        print(f"   → Detectado: {result['brand']} - {result['type']}")
        print(f"   → Confianza: {result['confidence']}%")
        print(f"   → Servicios: {', '.join(result['services'][:6])}")

        return result

    except Exception as e:
        print(f"   → Error en clasificación: {e}")
        return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("target", help="IP del dispositivo")
    args = parser.parse_args()
    classify_infrastructure(args.target)
