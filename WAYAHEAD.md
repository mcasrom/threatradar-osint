# ThreatRadar OSINT — WAYAHEAD
Generado: 2026-06-24 06:32

## COMPLETADO HOY — Sprint 11

### computeThreatScore v2 (server.ts)
- Algoritmo propio 5 factores: AbuseIPDB(+30), GreyNoise noise(+25), VT reputation(+20), pais alto riesgo(+15), riot=false(+10)
- Deteccion C2 inference: puertos 4444/1337/6667/31337 en Shodan
- Genera mitigationCommands[] dinamicos segun IP y nivel de riesgo
- Nivel: CRITICO(>=75) / ALTO(>=50) / MEDIO(>=25) / BAJO

### Prompt IA 5 dimensiones (server.ts /api/osint/analyze)
- Dimension 1: BOTNET FINGERPRINT — Mirai/Emotet/Cobalt Strike/C2
- Dimension 2: THREAT ACTOR ATTRIBUTION — APT28/Lazarus/APT41/APT33-34
- Dimension 3: IOCs estructurados — IPs, puertos, CVEs, hashes, patrones
- Dimension 4: NMAP INFERENCE pasivo — OS, servicios, vectores sin escaneo activo
- Dimension 5: ACCIONES CONCRETAS — iptables, fail2ban, SIEM Splunk/ELK
- Groq model: llama-3.3-70b-versatile (upgrade desde 8b-instant)
- Respuesta incluye: { analysis, threatScore, ip, timestamp, engine }

### Badge ThreatRadar Risk Score (IPTesterAndManual.tsx)
- Score 0-100 prominente (text-5xl) con color semanfico por nivel
- Badge CRITICO/ALTO/MEDIO/BAJO con colores rojo/naranja/amarillo/verde
- Lista de factores detectados con icono Activity
- Comandos de mitigacion copiables (iptables + fail2ban + SIEM)
- Boton Exportar PDF via window.print() con HTML formateado

### Email: nodemailer/SMTP -> Resend (server.ts)
- From: alerts@viajeinteligencia.com (dominio propio, no cuenta personal)
- API Resend reutilizando cuenta y dominio verificado de viajeinteligencia
- RESEND_API_KEY añadida al .env
- hasSmtpConfig -> hasResend en /api/status

### Consentimiento legal OSINT (OSINTModulesManager.tsx)
- Modal bloqueante antes de primer escaneo en sesion
- 4 clausulas: autorizacion expresa, responsabilidad penal (Art.197bis/NIS2), exoneracion ThreatRadar, logs de auditoria
- Una vez aceptado: no vuelve a aparecer hasta recargar pagina
- Titulo panel reescrito: "MOTOR DE ANALISIS OSINT — MODULOS ACTIVOS"

---

## SPRINT 12 — React-Markdown (COMPLETADO 2026-06-24)
Objetivo: Renderizar el informe IA con formato real en lugar de texto plano
- Instalar: npm install react-markdown
- Modificar IPTesterAndManual.tsx: sustituir .split('\n').map() por <ReactMarkdown>
- Añadir estilos prose dark para headings/code/lists dentro del panel oscuro

---

## SPRINT 13 — Deploy Hetzner (produccion)
1. Crear /var/www/threatradar/ en Hetzner
2. Nginx reverse proxy puerto 3000
3. SSL certbot para threatradar.viajeinteligencia.com
4. .env.production con todas las keys reales
5. PM2: pm2 start server.ts --name threatradar --interpreter tsx
6. Seed usuario dev pro en produccion via script
7. Actualizar VITE_APP_URL=https://threatradar.viajeinteligencia.com
8. Smoke test completo en produccion

---

## BACKLOG (sin sprint asignado)
- Corregir GREYNOISE_API_KEY (valor incorrecto en .env actual)
- Pagina publica demo sin login (3 scans/dia, IP propia solo)
- Tests Jest: register, login, ip-full, usage, analyze
- Activar billing Gemini si quota free se agota (0.075$/M tokens)
- Persistir consentimiento en localStorage para no pedir en cada recarga

---

## INFRAESTRUCTURA
- Dev: http://localhost:3000 (npm run dev / tsx server.ts)
- Prod objetivo: https://threatradar.viajeinteligencia.com
- PM2 name: threatradar
- Puerto: 3000
- Stack: Node/Express + Vite/React + SQLite + Groq/Gemini + Resend + Stripe

## KEYS CONFIGURADAS EN .env
- GROQ_API_KEY: ok (llama-3.3-70b-versatile)
- GEMINI_API_KEY: ok (gemini-2.0-flash, fallback primario)
- ABUSEIPDB_API_KEY: ok
- VIRUSTOTAL_API_KEY: ok
- SHODAN_API_KEY: ok
- IPINFO_API_KEY: ok
- RESEND_API_KEY: ok (alerts@viajeinteligencia.com)
- GREYNOISE_API_KEY: INCORRECTO — pendiente corregir
- STRIPE_*: no configurado (pendiente Sprint 13)

---
## COMPLETADO SESIÓN 2 (2026-06-24 continuación)

- Sprint 12: react-markdown render informe CTI OK
- PremiumAIChat: copy reescrito "ANALISIS DE RIESGO — TU INFRAESTRUCTURA", campos vacios, placeholders claros
- AutoReportsManager: email/webhook vacios por defecto, webhook Discord/Slack implementado real (embed Discord + texto Slack, detección automática)
- OSINTModulesManager: modal consentimiento legal Art.197bis/NIS2, titulo reescrito
