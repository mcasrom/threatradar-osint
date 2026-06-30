#!/usr/bin/env python3
import dns.resolver
from datetime import datetime
import argparse

def dns_analyzer(target):
    print(f"\n🔍 DNS Analysis → {target}\n")
    records = {}
    
    record_types = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'SOA', 'CNAME']
    
    for rtype in record_types:
        try:
            answers = dns.resolver.resolve(target, rtype)
            records[rtype] = [str(answer) for answer in answers]
            print(f"✅ {rtype:<6} : {records[rtype]}")
        except Exception as e:
            print(f"❌ {rtype:<6} : No encontrado")
    
    return records

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("target", help="Dominio o IP")
    args = parser.parse_args()
    
    dns_analyzer(args.target)
