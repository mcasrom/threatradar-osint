#!/usr/bin/env python3
import whois
import argparse
from datetime import datetime

def whois_analyzer(target):
    print(f"\n🌐 WHOIS Analysis → {target}\n")
    try:
        w = whois.whois(target)
        print(f"Registrant:     {w.registrant_name or w.owner or 'N/A'}")
        print(f"Organization:   {w.org or 'N/A'}")
        print(f"Creation Date:  {w.creation_date}")
        print(f"Expiration Date:{w.expiration_date}")
        print(f"Name Servers:   {w.name_servers}")
        print(f"Status:         {w.status}")
        return w
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("target", help="Dominio o IP")
    args = parser.parse_args()
    whois_analyzer(args.target)
