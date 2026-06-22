# ThreatRadar OSINT - APIs y Motores OSINT Disponibles

## 📡 APIs de Inteligencia de Amenazas

### Shodan
- **URL:** https://developer.shodan.io/
- **Tipo:** Indexador de dispositivos IoT y servicios expuestos
- **Uso:** Búsqueda de puertos abiertos, banners de servicio, vulnerabilidades CVE
- **Precio:** Free tier (100 créditos/mes), Membership desde $59/mes
- **Integración:** `shodan host <ip>`, API REST con queries avanzadas
- **Endpoints:** `/shodan/host/{ip}`, `/shodan/search`, `/shodan/ports`

### Censys
- **URL:** https://search.censys.io/api
- **Tipo:** Motor de búsqueda de Internet (alternativa a Shodan)
- **Uso:** Certificados TLS, hosts, sitios web, vulnerabilidades
- **Precio:** Free tier limitado, API desde $299/mes
- **Integración:** API REST v2 con autenticación API ID + Secret
- **Endpoints:** `/v2/hosts/{ip}`, `/v2/certificates/search`

### ZoomEye
- **URL:** https://www.zoomeye.org/doc
- **Tipo:** Motor de búsqueda cyberspace (chino)
- **Uso:** Dispositivos, servicios, componentes web
- **Precio:** Free tier (1000 queries/mes), VIP desde $99/mes
- **Integración:** API REST con JWT token
- **Endpoints:** `/host/search`, `/web/search`

### BinaryEdge
- **URL:** https://docs.binaryedge.io/api-v2.html
- **Tipo:** Platform de threat intelligence y attack surface management
- **Uso:** Puertos, servicios, tecnologías, data leaks
- **Precio:** Free tier, Community desde $99/mes
- **Integración:** API REST v2 con API key
- **Endpoints:** `/v2/query/{query}`, `/v2/hosts/{ip}`

### GreyNoise
- **URL:** https://docs.greynoise.io/reference/get_v3-community-ip
- **Tipo:** Platform de ruido de Internet y threat intelligence
- **Uso:** Identificar scanners vs ataques reales, IPs maliciosas
- **Precio:** Community free, Enterprise desde $500/mes
- **Integración:** API REST v3 con API key
- **Endpoints:** `/v3/community/{ip}`, `/v2/noise/context/{ip}`

### AlienVault OTX (Open Threat Exchange)
- **URL:** https://otx.alienvault.com/api
- **Tipo:** Threat intelligence colaborativo
- **Uso:** IOCs, pulses, indicators, malware samples
- **Precio:** Free
- **Integración:** API REST con API key
- **Endpoints:** `/api/v1/indicators/{type}/{value}`, `/api/v1/pulses`

### VirusTotal
- **URL:** https://docs.virustotal.com/reference/overview
- **Tipo:** Análisis de malware y URLs sospechosas
- **Uso:** Scanning de archivos, URLs, dominios, IPs
- **Precio:** Free (500 req/día), Premium desde $150/mes
- **Integración:** API v3 con API key
- **Endpoints:** `/files/{id}`, `/urls/{id}`, `/domains/{domain}`, `/ip_addresses/{ip}`

### AbuseIPDB
- **URL:** https://docs.abuseipdb.com/
- **Tipo:** Base de datos de IPs abusivas
- **Uso:** Verificar reputación de IPs, reportar abusos
- **Precio:** Free (1000 req/día), Premium desde $5/mes
- **Integración:** API v2 con API key
- **Endpoints:** `/api/v2/check`, `/api/v2/report`

### ThreatFox (Abuse.ch)
- **URL:** https://threatfox-api.abuse.ch/
- **Tipo:** IOC de malware distribuido por threat actors
- **Uso:** URLs malware, hashes, IPs C2
- **Precio:** Free
- **Integración:** API REST POST
- **Endpoints:** `/api/`

### URLhaus (Abuse.ch)
- **URL:** https://urlhaus-api.abuse.ch/
- **Tipo:** URLs maliciosas distribuidas por malware
- **Uso:** Detección de URLs de phishing/malware
- **Precio:** Free
- **Integración:** API REST POST/GET
- **Endpoints:** `/v1/url/`, `/v1/payload/`

### MISP (Malware Information Sharing Platform)
- **URL:** https://www.misp-project.org/documentation/
- **Tipo:** Platform de threat intelligence self-hosted
- **Uso:** IOCs, eventos, atributos, correlación
- **Precio:** Free (open source)
- **Integración:** API REST con API key
- **Endpoints:** `/events`, `/attributes`, `/indicators/search`

---

## 🔍 APIs de Reconocimiento y OSINT

### SecurityTrails
- **URL:** https://docs.securitytrails.com/reference/getting-started
- **Tipo:** Historical DNS y domain data
- **Uso:** DNS history, subdomains, WHOIS history, associated domains
- **Precio:** Free tier (50 queries/mes), desde $99/mes
- **Integración:** API REST con API key
- **Endpoints:** `/domain/{domain}/history/dns`, `/domain/{domain}/subdomains`

### FullHunt
- **URL:** https://fullhunt.io/docs
- **Tipo:** Attack surface discovery
- **Uso:** Subdomains, exposed assets, technologies
- **Precio:** Free tier, desde $49/mes
- **Integración:** API REST con API key
- **Endpoints:** `/api/v1/domain/{domain}`, `/api/v1/domain/{domain}/hosts`

### Hunter.io
- **URL:** https://hunter.io/api-documentation
- **Tipo:** Email finder y verifier
- **Uso:** Encontrar emails corporativos por dominio
- **Precio:** Free (25 searches/mes), desde $49/mes
- **Integración:** API REST con API key
- **Endpoints:** `/v2/domain-search`, `/v2/email-finder`, `/v2/email-verifier`

### Snov.io
- **URL:** https://snov.io/api/docs
- **Tipo:** Email finder y outreach automation
- **Uso:** Emails corporativos, verification, campaigns
- **Precio:** Free tier, desde $39/mes
- **Integración:** API REST con client ID + secret
- **Endpoints:** `/emails`, `/verify-email`, `/domain-emails`

### BuiltWith
- **URL:** https://api.builtwith.com/
- **Tipo:** Technology profiler
- **Uso:** Detectar tecnologías web (CMS, frameworks, analytics)
- **Precio:** Free tier, desde $29/mes
- **Integración:** API REST con API key
- **Endpoints:** `/v19/api.json?LOOKUP={domain}`

### Wappalyzer
- **URL:** https://www.wappalyzer.com/api/
- **Tipo:** Technology detection
- **Uso:** Identificar stack tecnológico de sitios web
- **Precio:** Desde $50/mes
- **Integración:** API REST con API key
- **Endpoints:** `/lookup?url={url}`

### DNSlytics
- **URL:** https://dnslytics.com/api
- **Tipo:** Reverse DNS y domain intelligence
- **Uso:** Reverse IP, domain history, WHOIS
- **Precio:** Free tier limitado
- **Integración:** API REST con API key
- **Endpoints:** `/api/v1/reverse-ip`, `/api/v1/whois`

### ViewDNS
- **URL:** https://viewdns.info/docs/
- **Tipo:** DNS tools y reverse lookups
- **Uso:** Reverse IP, DNS history, port scan, whois
- **Precio:** Free limitado, Pro $10/mes
- **Integración:** API REST con API key
- **Endpoints:** `/reverseip/`, `/dnshistory/`, `/portscan/`

---

## 🌐 APIs de Geolocalización IP

### ipapi.co
- **URL:** https://ipapi.co/api/
- **Tipo:** IP geolocation
- **Uso:** País, ciudad, ISP, coordenadas, ASN
- **Precio:** Free (1000 req/día), desde $15/mes
- **Integración:** REST GET
- **Endpoints:** `/{ip}/json/`, `/json/`

### IPinfo.io
- **URL:** https://ipinfo.io/developers
- **Tipo:** IP data y geolocation
- **Uso:** Geolocation, ASN, company, carrier, abuse contact
- **Precio:** Free (50k req/mes), desde $49/mes
- **Integración:** REST con token
- **Endpoints:** `/{ip}/json`, `/bogon`

### MaxMind GeoIP2
- **URL:** https://dev.maxmind.com/geoip/geolite2-free-geolocation-data
- **Tipo:** Geolocation database (self-hosted)
- **Uso:** País, ciudad, ASN, threat intelligence
- **Precio:** Free (GeoLite2), Precision desde $180/año
- **Integración:** Database local o web service
- **Endpoints:** `/geoip/v2.1/city/{ip}`, `/geoip/v2.1/insights/{ip}`

### IP2Location
- **URL:** https://www.ip2location.com/web-service
- **Tipo:** IP geolocation
- **Uso:** País, región, ciudad, ISP, domain, timezone
- **Precio:** Free (20 req/día), desde $50/mes
- **Integración:** REST con API key
- **Endpoints:** `/?ip={ip}&key={key}`

---

## 🛡️ APIs de Vulnerabilidades y CVEs

### NVD (National Vulnerability Database)
- **URL:** https://nvd.nist.gov/developers/vulnerabilities
- **Tipo:** Base de datos oficial de vulnerabilidades US
- **Uso:** CVEs, CVSS scores, descriptions, references
- **Precio:** Free
- **Integración:** REST API v2.0
- **Endpoints:** `/rest/json/cves/2.0`, `/rest/json/products/2.0`

### CIRCL CVE Search
- **URL:** https://cve.circl.lu/
- **Tipo:** CVE search engine
- **Uso:** Búsqueda de vulnerabilidades por producto/vendor
- **Precio:** Free
- **Integración:** REST API
- **Endpoints:** `/api/search/{vendor}/{product}`

### ExploitDB (Offensive Security)
- **URL:** https://gitlab.com/exploit-database/exploitdb
- **Tipo:** Base de datos de exploits públicos
- **Uso:** Buscar exploits por CVE, producto, plataforma
- **Precio:** Free
- **Integración:** API EDB Search
- **Endpoints:** `https://exploit-db.com/search?query={cve}`

### Vulners
- **URL:** https://vulners.com/docs/
- **Tipo:** Vulnerability intelligence aggregator
- **Uso:** CVEs, exploits, advisories, threat feeds
- **Precio:** Free tier, API desde $99/mes
- **Integración:** REST API con API key
- **Endpoints:** `/api/v3/archive/cve/`, `/api/v3/search/lucene`

### OpenCVE
- **URL:** https://www.opencve.io/api
- **Tipo:** CVE tracking y alerting
- **Uso:** CVEs con scoring, vendors, products
- **Precio:** Free
- **Integración:** REST API
- **Endpoints:** `/api/cve/`, `/api/vendors/`

---

## 📧 APIs de Email Intelligence

### HaveIBeenPwned
- **URL:** https://haveibeenpwned.com/API/v3
- **Tipo:** Breached account checker
- **Uso:** Verificar si email aparece en data breaches
- **Precio:** $3.50/mes (API key)
- **Integración:** REST con API key
- **Endpoints:** `/breachedaccount/{email}`, `/pasteaccount/{email}`

### DeHashed
- **URL:** https://dehashed.com/docs
- **Tipo:** Breached data search engine
- **Uso:** Buscar credenciales expuestas por email/username/IP
- **Precio:** Desde $9.99/mes
- **Integración:** API REST con API key
- **Endpoints:** `/v1/{query}/{value}`

### EmailRep.io
- **URL:** https://docs.emailrep.io/
- **Tipo:** Email reputation checker
- **Uso:** Reputación de emails, social profiles, breach data
- **Precio:** Free (100 req/día), desde $100/mes
- **Integración:** REST con API key
- **Endpoints:** `/api/{email}`

---

## 🔐 APIs de Seguridad Web

### Mozilla Observatory
- **URL:** https://observatory.mozilla.org/api/
- **Tipo:** Web security scanner
- **Uso:** HTTP headers, CSP, TLS, SSH configuration
- **Precio:** Free
- **Integración:** REST API
- **Endpoints:** `/api/v2/analyze/{host}`

### SSL Labs (Qualys)
- **URL:** https://github.com/ssllabs/ssllabs-scan/blob/master/ssllabs-api-docs-v3.md
- **Tipo:** SSL/TLS server testing
- **Uso:** SSL grade, certificate analysis, protocol support
- **Precio:** Free
- **Integración:** REST API
- **Endpoints:** `/api/v3/analyze?host={host}`

### SecurityHeaders.com
- **URL:** https://securityheaders.com/
- **Tipo:** HTTP security header analyzer
- **Uso:** Verificar headers de seguridad web
- **Precio:** Free
- **Integración:** REST API
- **Endpoints:** `/?domain={domain}&hide=on`

---

## 🗃️ Herramientas CLI para Instalar en el Servidor

### Herramientas de Red
```bash
# Nmap - Port scanner
apt install nmap

# Masscan - Fast port scanner
apt install masscan

# Traceroute
apt install traceroute

# DNS tools
apt install dnsutils dnsrecon dnsenum

# WHOIS
apt install whois

# SSL/TLS scanning
apt install sslscan sslyze
```

### Herramientas OSINT
```bash
# theHarvester - Email/subdomain enumeration
pip3 install theHarvester

# Subfinder - Passive subdomain discovery
go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest

# Amass - OWASP Attack Surface Discovery
go install -v github.com/owasp-amass/amass/v4/...@master

# httpx - HTTP probe toolkit
go install -v github.com/projectdiscovery/httpx/cmd/httpx@latest

# Nuclei - Template-based vulnerability scanner
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest

# Naabu - Fast port scanner
go install -v github.com/projectdiscovery/naabu/v2/cmd/naabu@latest
```

### Herramientas Web
```bash
# Nikto - Web server scanner
apt install nikto

# WAF detection
pip3 install wafw00f

# SQLMap - SQL injection testing
apt install sqlmap

# Dirb/Dirbuster - Directory brute force
apt install dirb
```

### Shodan CLI
```bash
pip3 install shodan
shodan init YOUR_API_KEY
```

---

## 📋 Integración Recomendada para ThreatRadar

### Prioridad 1 (Free/Essential)
1. **Shodan** - Device/service discovery
2. **AbuseIPDB** - IP reputation
3. **HaveIBeenPwned** - Breach checking
4. **VirusTotal** - Malware analysis
5. **AlienVault OTX** - Threat feeds

### Prioridad 2 (Professional)
6. **SecurityTrails** - DNS history
7. **GreyNoise** - Internet noise filtering
8. **Hunter.io** - Email discovery
9. **Censys** - Alternative to Shodan
10. **NVD** - CVE database

### Prioridad 3 (Enterprise)
11. **BinaryEdge** - Attack surface management
12. **ZoomEye** - Cyberspace search
13. **DeHashed** - Breached data
14. **MISP** - Threat intelligence platform
15. **Vulners** - Vulnerability intelligence

---

## 🔑 Configuración de API Keys

Crear archivo `.env` con las keys:

```env
# Core AI
GEMINI_API_KEY=your_gemini_key

# Threat Intelligence
SHODAN_API_KEY=your_shodan_key
ABUSEIPDB_API_KEY=your_abuseipdb_key
VIRUSTOTAL_API_KEY=your_virustotal_key
ALIENVAULT_OTX_KEY=your_otx_key
GREYNOISE_API_KEY=your_greynoise_key

# DNS & Recon
SECURITYTRAILS_API_KEY=your_securitytrails_key
FULLHUNT_API_KEY=your_fullhunt_key

# Email Intelligence
HUNTER_API_KEY=your_hunter_key
HIBP_API_KEY=your_hibp_key

# Geolocation
IPINFO_TOKEN=your_ipinfo_token

# Payments
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret
STRIPE_PRICE_BASIC=price_xxx
STRIPE_PRICE_PREMIUM=price_xxx
STRIPE_PRICE_ENTERPRISE=price_xxx

# Email Dispatch
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@domain.com
SMTP_PASS=your_app_password
SMTP_FROM="ThreatRadar SOC <your_email@domain.com>"

# App
APP_URL=https://threatradar.tudominio.com
```
