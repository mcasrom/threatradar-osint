#!/usr/bin/env python3
import sys
import os

# === CONFIGURACIÓN DE PATHS ===
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)
sys.path.insert(0, os.path.join(current_dir, 'pasivos'))
sys.path.insert(0, os.path.join(current_dir, 'activos'))
sys.path.insert(0, os.path.join(current_dir, 'core'))
sys.path.insert(0, os.path.join(current_dir, 'defensivos'))

def run_full_threatradar(target: str):
    print(f"\n🚀 Iniciando ThreatRadar OSINT Completo para → {target}\n")
    
    try:
        # Imports con paths corregidos
        from master_passive import run_passive_master
        from master_defensive import run_defensive_master
        
        print("🔍 Fase 1: Reconocimiento Pasivo")
        run_passive_master(target)
        
        print("\n🛡️  Fase 2: Análisis Defensivo")
        run_defensive_master(target)
        
        print(f"\n✅ Análisis completo finalizado para {target}")
        
    except ImportError as e:
        print(f"❌ Error de importación: {e}")
        print("Verifica que todos los módulos existan en sus carpetas.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error durante la ejecución: {e}")

if __name__ == "__main__":
    import sys
    target = sys.argv[1] if len(sys.argv) > 1 else input("Ingresa IP o Dominio: ")
    run_full_threatradar(target)
EOF
