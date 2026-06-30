#!/usr/bin/env python3
import requests
import argparse

def geoip_asn_analyzer(ip):
    print(f"\n📍 GeoIP + ASN Analysis → {ip}\n")
    try:
        # Usando ipapi.co (gratuito sin key para uso moderado)
        response = requests.get(f"https://ipapi.co/{ip}/json/", timeout=5)
        data = response.json()
        
        print(f"País:          {data.get('country_name')} ({data.get('country')})")
        print(f"Ciudad:        {data.get('city')}")
        print(f"ISP:           {data.get('org')}")
        print(f"ASN:           {data.get('asn')}")
        print(f"Lat/Lon:       {data.get('latitude')}, {data.get('longitude')}")
        print(f"Zona Horaria:  {data.get('timezone')}")
    except:
        print("Error al consultar API. Intenta con otra IP o verifica conexión.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("ip", help="IP a analizar")
    args = parser.parse_args()
    geoip_asn_analyzer(args.ip)
