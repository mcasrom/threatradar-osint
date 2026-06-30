#!/usr/bin/env python3
import ssl
import socket

def analyze_tls(target: str, port=443):
    try:
        context = ssl.create_default_context()
        with socket.create_connection((target, port), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=target) as ssock:
                cert = ssock.getpeercert()
                version = ssock.version()
                
                return {
                    "tls_version": version,
                    "cipher": ssock.cipher()[0],
                    "valid_until": cert['notAfter'],
                    "issuer": cert['issuer']
                }
    except Exception as e:
        return {"error": str(e)}
