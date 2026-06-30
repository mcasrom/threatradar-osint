#!/usr/bin/env python3
import math
import argparse
import socket
import requests

def calculate_entropy(data: str) -> float:
    """Calcula la entropía de Shannon de una cadena"""
    if not data:
        return 0.0
    
    freq = {}
    for char in data:
        freq[char] = freq.get(char, 0) + 1
    
    entropy = 0.0
    length = len(data)
    for count in freq.values():
        p = count / length
        entropy -= p * math.log2(p)
    
    return round(entropy, 4)

def entropy_analyzer(target):
    print(f"\n📊 Entropy Analyzer → {target}\n")
    results = {}
    
    # 1. Entropía del hostname / dominio
    try:
        hostname = socket.gethostbyaddr(target)[0] if '.' in target else target
        ent = calculate_entropy(hostname)
        print(f"Hostname Entropy:     {ent:.4f}  {'(Alta)' if ent > 4.0 else '(Normal)'}")
        results['hostname_entropy'] = ent
    except:
        print("Hostname Entropy:     No disponible")
    
    # 2. Entropía en banners / respuestas
    try:
        for port in [80, 443]:
            try:
                if port == 443:
                    import ssl
                    context = ssl.create_default_context()
                    with socket.create_connection((target, port), timeout=3) as sock:
                        with context.wrap_socket(sock, server_hostname=target) as ssock:
                            banner = str(ssock.getpeercert())
                else:
                    sock = socket.socket()
                    sock.settimeout(2)
                    sock.connect((target, port))
                    banner = str(sock.recv(1024))
                    sock.close()
                
                ent = calculate_entropy(banner)
                print(f"Banner Entropy (port {port}): {ent:.4f}")
                results[f'port_{port}_entropy'] = ent
                
                if ent > 4.5:
                    print("   → Alta entropía detectada (posible obfuscación o dato aleatorio)")
            except:
                continue
    except:
        pass
    
    # 3. Entropía de respuesta HTTP
    try:
        r = requests.get(f"http://{target}", timeout=4, verify=False)
        ent = calculate_entropy(r.text[:5000])  # Primeros 5000 caracteres
        print(f"HTTP Content Entropy: {ent:.4f}")
        results['http_entropy'] = ent
    except:
        print("HTTP Content Entropy: No disponible")
    
    # Evaluación general
    avg_entropy = sum(results.values()) / len(results) if results else 0
    print(f"\nEntropía Promedio: {avg_entropy:.4f}")
    if avg_entropy > 4.2:
        print("🔴 Alta entropía general → Posible uso de cifrado, obfuscación o datos aleatorios")
    elif avg_entropy > 3.5:
        print("🟡 Entropía moderada")
    else:
        print("🟢 Entropía normal")
    
    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Entropy Analyzer")
    parser.add_argument("target", help="IP o Dominio")
    args = parser.parse_args()
    
    entropy_analyzer(args.target)
