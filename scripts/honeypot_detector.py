#!/usr/bin/env python3
import socket
import argparse

def honeypot_detector(target):
    print(f"\n🍯 Honeypot Detector → {target}\n")
    suspicious = 0
    
    # Puertos típicos de honeypots
    honey_ports = [23, 2323, 5900, 3389]
    responses = []
    
    for port in honey_ports:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(2)
            result = sock.connect_ex((target, port))
            if result == 0:
                suspicious += 1
                responses.append(port)
                print(f"⚠️  Puerto {port} abierto → Posible honeypot")
            sock.close()
        except:
            pass
    
    if suspicious >= 2:
        print("🚨 Alta probabilidad de Honeypot detectada")
    elif suspicious == 1:
        print("⚠️  Posible honeypot o servicio expuesto")
    else:
        print("✅ No se detectaron indicadores claros de honeypot")
    
    return suspicious

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("target", help="IP")
    args = parser.parse_args()
    honeypot_detector(args.target)
