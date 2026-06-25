# ThreatRadar OSINT — WAYAHEAD
Actualizado: 2026-06-25

## COMPLETADO — Sprint 13 (Deploy Hetzner) 2026-06-25
### Infraestructura producción
- App desplegada en https://threatradar.viajeinteligencia.com
- PM2 id 33, nombre: threatradar, puerto 3013, ~21MB RAM
- Nginx reverse proxy con SSL certbot (expira 2026-09-22, autorenovación activa)
- ecosystem.config.cjs creado (node dist/server.cjs, --max-old-space-size=256)
- DNS Cloudflare registro A threatradar → 178.105.80.193 (proxied: true)
- WAF Cloudflare regla 883d6f63

## COMPLETADO — Sprint 14 parcial (APIs OSINT) 2026-06-25
### APIs verificadas y operativas
- Shodan → sustituido por InternetDB (internetdb.shodan.io) — gratis, sin key, ports+CVEs+tags
- AbuseIPDB ✅ key válida, responde correctamente
- VirusTotal ✅ key válida, responde correctamente
- IPInfo ✅ key válida
- GreyNoise ❌ key vacía — pendiente conseguir en viz.greynoise.io/account/api-key
- nmap — NO instalar en Hetzner (TOS), desactivar para IPs externas en producción

## PENDIENTE — Sprint 14
- [ ] GREYNOISE_API_KEY — conseguir key gratuita Community (viz.greynoise.io)
- [ ] Demo pública — 3 scans/día sin login (rate limit por IP, sin auth)
- [ ] Tests Jest — smoke tests endpoints principales
- [ ] Persistir consentimiento legal en localStorage
- [ ] Stripe keys — plan premium (futuro)

## Deploy futuro
npm run build → git push → ssh deploy "cd /home/deploy/apps/threatradar-osint && git pull && npm run build && pm2 restart threatradar"

## CREDENCIALES DEV/TEST (producción)
- Email: dev@threatradar.local
- Password: ThreatAdmin2026!
- Plan: enterprise — scans ilimitados, todas las fuentes
- DB: /home/deploy/apps/threatradar-osint/data/threatradar.db

## SESIÓN 2026-06-25 continuación — verificación completa
### Verificado y funcionando en producción
- Pipeline completo: GET /api/osint/ip-full/:ip → POST /api/osint/analyze
- Score 185.220.101.1 → 85/100 CRÍTICO (TOR exit, AbuseIPDB 100%, VT 14 engines)
- Flujo dos pasos confirmado: ip-full devuelve osintData raw, analyze calcula score+IA
- Engine Groq activo como fallback

### Problemas detectados pendientes
- Shodan API free: existe API pública gratuita pero limitada — investigar endpoint correcto
- GreyNoise Community: key gratuita existe pero no disponible/accesible actualmente
- Módulo "Análisis de Riesgo Infraestructura" — formulario no envía email al usuario
- Resend email en este módulo: revisar endpoint y destinatario

### Próximo sprint 14 (por orden)
- [ ] Demo pública 3 scans/día sin login (rate limit por IP)
- [ ] Fix módulo análisis infraestructura — email no llega
- [ ] Shodan API free — investigar límites reales del plan gratuito
- [ ] GreyNoise — reintentar cuando esté disponible
- [ ] Jest tests endpoints principales
- [ ] localStorage consentimiento

## COMPLETADO — Opción D+A módulos activos 2026-06-25
- isPrivateIP() — permite 10.x, 172.16-31.x, 192.168.x, 127.x, 178.105.80.193
- requiresPrivateTarget() — detecta nmap/masscan/nikto/nuclei en commandTemplate
- /api/modules/run — bloquea herramientas activas contra IPs públicas con error claro
- Módulos pasivos (DNS/WHOIS/SSL/theHarvester) — sin restricción de target
- Resend email — key actualizada en prod pero Hetzner blacklist bloquea entrega (pendiente)
- Email reports: ruta alternativa via viajeinteligencia API pendiente implementar

## PENDIENTE Sprint 14
- [ ] Demo pública 3 scans/día sin login
- [ ] Revisar/actualizar documentación UI módulos (Opción D: renombrar activos→pasivos)
- [ ] Resend email fix — routing via viajeinteligencia Next.js
- [ ] GreyNoise key cuando disponible
- [ ] Jest tests
- [ ] localStorage consentimiento

## COMPLETADO — GreyNoise Community 2026-06-25
- GreyNoise Community API funciona sin key (endpoint v3/community)
- 185.220.101.1: noise=true, classification=malicious ✅
- Guard de apiKey eliminado en /api/osint/greynoise/:ip
- ip-full incluye GreyNoise siempre (key opcional para plan superior)
- Risk engine ya incluía lógica greynoise.noise y greynoise.classification
