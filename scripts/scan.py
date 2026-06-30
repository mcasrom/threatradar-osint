#!/usr/bin/env python3
import sys
import os

# Solución directa al problema
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

try:
    from run_full_scan import run_full_threatradar
except ImportError as e:
    print("Error: No se encontró run_full_scan.py")
    print("Asegúrate que el archivo run_full_scan.py está en la misma carpeta.")
    sys.exit(1)

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else input("Ingresa IP o Dominio: ")
    run_full_threatradar(target)
