#!/usr/bin/env python3
import socket
import threading
import time
from datetime import datetime
import argparse
import sys

def print_banner():
    print("""
    =============================================
           🛡️  PORT SCANNER - Local Network
           IP Privada (Router WiFi / Dispositivos)
    =============================================
    """)

def scan_port(target_ip: str, port: int, timeout: float = 1.0):
    """Escanea un puerto individual"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((target_ip, port))
        sock.close()
        
        if result == 0:
            try:
                service = socket.getservbyport(port)
            except:
                service = "unknown"
            return (port, True, service)
        return (port, False, None)
    except:
        return (port, False, None)

def port_scanner(target_ip: str, start_port=1, end_port=1024, threads=100, timeout=1.0):
    """Escanea rango de puertos con multithreading"""
    print(f"[+] Escaneando {target_ip} desde puerto {start_port} hasta {end_port}")
    print(f"[+] Usando {threads} hilos | Timeout: {timeout}s\n")
    
    open_ports = []
    start_time = time.time()
    
    def worker(ports):
        for port in ports:
            result = scan_port(target_ip, port, timeout)
            if result[1]:
                open_ports.append(result)
                print(f"[✅] Puerto {port:<6} ABIERTO  →  {result[2]}")
    
    # Dividir puertos entre hilos
    port_list = list(range(start_port, end_port + 1))
    chunk_size = max(1, len(port_list) // threads)
    threads_list = []
    
    for i in range(0, len(port_list), chunk_size):
        chunk = port_list[i:i + chunk_size]
        t = threading.Thread(target=worker, args=(chunk,))
        threads_list.append(t)
        t.start()
    
    for t in threads_list:
        t.join()
    
    duration = time.time() - start_time
    
    # Resultado final
    print("\n" + "="*60)
    print(f"✅ Escaneo completado en {duration:.2f} segundos")
    print(f"📍 IP Objetivo: {target_ip}")
    print(f"🔓 Puertos abiertos encontrados: {len(open_ports)}")
    print("="*60)
    
    if open_ports:
        print("\nPuertos abiertos:")
        for port, _, service in sorted(open_ports):
            print(f"   • {port:<6} → {service}")
    else:
        print("⚠️  No se encontraron puertos abiertos en el rango escaneado.")
    
    return open_ports

def main():
    print_banner()
    
    parser = argparse.ArgumentParser(description="Port Scanner para redes locales")
    parser.add_argument("target", help="IP privada del router (ej: 192.168.1.1)")
    parser.add_argument("-s", "--start", type=int, default=1, help="Puerto inicial (default: 1)")
    parser.add_argument("-e", "--end", type=int, default=1024, help="Puerto final (default: 1024)")
    parser.add_argument("-t", "--threads", type=int, default=150, help="Número de hilos (default: 150)")
    parser.add_argument("--timeout", type=float, default=1.0, help="Timeout por puerto (segundos)")
    parser.add_argument("--all", action="store_true", help="Escanear hasta puerto 65535 (lento)")
    
    args = parser.parse_args()
    
    if args.all:
        args.end = 65535
        args.threads = max(args.threads, 300)
    
    # Validación básica de IP privada
    if not args.target.startswith("192.168.") and not args.target.startswith("10.") and not args.target.startswith("172."):
        print("⚠️  Advertencia: La IP no parece ser privada. Asegúrate de que sea de tu red local.")
    
    try:
        port_scanner(
            target_ip=args.target,
            start_port=args.start,
            end_port=args.end,
            threads=args.threads,
            timeout=args.timeout
        )
    except KeyboardInterrupt:
        print("\n\n[!] Escaneo cancelado por el usuario.")
        sys.exit(0)
    except Exception as e:
        print(f"[!] Error: {e}")

if __name__ == "__main__":
    main()
