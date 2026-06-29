#!/usr/bin/env python3
import socket
import ssl
from datetime import datetime
import argparse

def tls_analyzer(hostname, port=443):
    print(f"\n🔐 TLS/Certificate Analysis → {hostname}:{port}\n")
    try:
        context = ssl.create_default_context()
        with socket.create_connection((hostname, port), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                
                print(f"Subject:     {cert['subject']}")
                print(f"Issuer:      {cert['issuer']}")
                print(f"Valid From:  {cert['notBefore']}")
                print(f"Valid Until: {cert['notAfter']}")
                print(f"Version:     {cert['version']}")
                print(f"Serial:      {cert['serialNumber']}")
                
                # Check expiration
                exp_date = datetime.strptime(cert['notAfter'], "%b %d %H:%M:%S %Y %Z")
                days_left = (exp_date - datetime.utcnow()).days
                print(f"\n⏳ Días restantes: {days_left} días")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("hostname", help="Dominio o IP")
    parser.add_argument("-p", "--port", type=int, default=443)
    args = parser.parse_args()
    tls_analyzer(args.hostname, args.port)
