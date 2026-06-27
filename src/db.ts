import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, 'threatradar.json');

if (!fs.existsSync(DB_FILE)) {
  const initialSchema = {
    reports: [],
    customModules: [
      {
        id: 'nmap-scanner',
        name: 'Nmap Port Scanner',
        description: 'Escaneo de puertos abiertos, detección de servicios y versiones con Nmap.',
        version: '7.94',
        status: 'active',
        commandTemplate: 'nmap -sV -sC -T4 {target}',
        outputFormat: 'text',
        category: 'network'
      },
      {
        id: 'nmap-vuln',
        name: 'Nmap Vulnerability Scan',
        description: 'Detección de vulnerabilidades conocidas mediante scripts NSE de Nmap.',
        version: '7.94',
        status: 'active',
        commandTemplate: 'nmap --script vuln -T4 {target}',
        outputFormat: 'text',
        category: 'vulnerability'
      },
      {
        id: 'nmap-os-detect',
        name: 'Nmap OS Detection',
        description: 'Detección del sistema operativo remoto mediante fingerprinting TCP/IP.',
        version: '7.94',
        status: 'active',
        commandTemplate: 'nmap -O --osscan-guess {target}',
        outputFormat: 'text',
        category: 'recon'
      },
      {
        id: 'dnsrecon',
        name: 'DNS Reconnaissance',
        description: 'Enumeración DNS: subdominios, zone transfers, registros MX/NS/TXT.',
        version: '1.2.0',
        status: 'active',
        commandTemplate: 'dnsrecon -d {target} -t std,rvl,srv,axfr',
        outputFormat: 'json',
        category: 'dns'
      },
      {
        id: 'dnsenum',
        name: 'DNS Enumeration',
        description: 'Enumeración exhaustiva de DNS con brute-force de subdominios.',
        version: '1.3.2',
        status: 'active',
        commandTemplate: 'dnsenum --threads 10 {target}',
        outputFormat: 'text',
        category: 'dns'
      },
      {
        id: 'theharvester',
        name: 'theHarvester OSINT',
        description: 'Recolección de emails, subdominios, IPs y hosts desde motores de búsqueda.',
        version: '4.6.0',
        status: 'active',
        commandTemplate: 'theHarvester -d {target} -b google,bing,duckduckgo -l 500',
        outputFormat: 'text',
        category: 'osint'
      },
      {
        id: 'whois-lookup',
        name: 'WHOIS Lookup',
        description: 'Consulta de registros WHOIS para dominios e IPs (registrador, fechas, contactos).',
        version: '1.0.0',
        status: 'active',
        commandTemplate: 'whois {target}',
        outputFormat: 'text',
        category: 'recon'
      },
      {
        id: 'traceroute',
        name: 'Traceroute Network Path',
        description: 'Trazado de ruta de red con identificación de hops y latencia.',
        version: '1.0.0',
        status: 'active',
        commandTemplate: 'traceroute -m 20 {target}',
        outputFormat: 'text',
        category: 'network'
      },
      {
        id: 'dig-dns',
        name: 'DNS Dig Query',
        description: 'Consultas DNS detalladas con dig (A, AAAA, MX, NS, TXT, SOA, ANY).',
        version: '1.0.0',
        status: 'active',
        commandTemplate: 'dig +noall +answer {target} ANY',
        outputFormat: 'text',
        category: 'dns'
      },
      {
        id: 'sslscan',
        name: 'SSL/TLS Scanner',
        description: 'Análisis de configuración SSL/TLS: cipher suites, certificados, vulnerabilidades.',
        version: '2.1.3',
        status: 'active',
        commandTemplate: 'sslscan --tlsall {target}',
        outputFormat: 'text',
        category: 'vulnerability'
      },
      {
        id: 'nikto-web',
        name: 'Nikto Web Scanner',
        description: 'Escaneo de vulnerabilidades web: archivos peligrosos, configuraciones inseguras.',
        version: '2.5.0',
        status: 'active',
        commandTemplate: 'nikto -h {target} -Format json',
        outputFormat: 'json',
        category: 'vulnerability'
      },
      {
        id: 'subfinder',
        name: 'Subfinder Subdomain Enum',
        description: 'Descubrimiento pasivo de subdominios mediante múltiples fuentes OSINT.',
        version: '2.6.6',
        status: 'active',
        commandTemplate: 'subfinder -d {target} -all -silent',
        outputFormat: 'text',
        category: 'osint'
      },
      {
        id: 'httpx-probe',
        name: 'HTTPX Web Probe',
        description: 'Detección de servidores web activos, tecnologías, status codes y headers.',
        version: '1.6.5',
        status: 'active',
        commandTemplate: 'httpx -u https://{target} -tech-detect -status-code -title -content-length',
        outputFormat: 'json',
        category: 'web'
      },
      {
        id: 'nuclei-scan',
        name: 'Nuclei Template Scanner',
        description: 'Escaneo de vulnerabilidades basado en templates (CVEs, misconfigs, exposures).',
        version: '3.3.0',
        status: 'unavailable',
        commandTemplate: 'nuclei -u {target} -t cves,misconfigurations,exposures -silent',
        outputFormat: 'json',
        category: 'vulnerability'
      },
      {
        id: 'amass-enum',
        name: 'OWASP Amass',
        description: 'Mapeo de superficie de ataque y descubrimiento de activos mediante OSINT.',
        version: '4.2.0',
        status: 'unavailable',
        commandTemplate: 'amass enum -passive -d {target}',
        outputFormat: 'text',
        category: 'osint'
      },
      {
        id: 'shodan-cli',
        name: 'Shodan CLI Lookup',
        description: 'Consulta de información Shodan para IPs: puertos, servicios, vulnerabilidades.',
        version: '1.0.0',
        status: 'active',
        commandTemplate: 'shodan host {target}',
        outputFormat: 'text',
        category: 'osint'
      },
      {
        id: 'masscan-fast',
        name: 'Masscan Port Sweep',
        description: 'Escaneo ultra-rápido de puertos TCP en rangos de IP completos.',
        version: '1.3.2',
        status: 'active',
        commandTemplate: 'masscan -p1-65535 {target} --rate 10000',
        outputFormat: 'text',
        category: 'network'
      },
      {
        id: 'wafw00f',
        name: 'WAF Detection',
        description: 'Detección y fingerprinting de Web Application Firewalls (WAF).',
        version: '2.2.0',
        status: 'active',
        commandTemplate: 'wafw00f https://{target}',
        outputFormat: 'text',
        category: 'web'
      }
    ],
    logReports: [],
    activeSubscriptions: [],
    threatFeeds: [],
    apiKeys: {},
    users: []
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialSchema, null, 2));
}

function readDB() {
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    return { reports: [], customModules: [], logReports: [], activeSubscriptions: [], threatFeeds: [], apiKeys: {} };
  }
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing to database:', err);
  }
}

export { readDB, writeDB, APP_URL, GEMINI_API_KEY };
