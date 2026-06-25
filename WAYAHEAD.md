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

## COMPLETADO — Groq fallback premium-report 2026-06-25
- /api/premium-report ahora usa Gemini primero, Groq llama-3.3-70b como fallback
- Verificado: engine=groq activo cuando Gemini quota agotada
- Score y report generados correctamente

## SPRINT 15 — Backlog planificado
### APIs OSINT gratuitas de alto impacto a integrar
- [ ] crt.sh — subdominios via certificados SSL (sin key, json directo)
- [ ] AlienVault OTX — threat intel IPs/dominios (key gratuita fácil)
- [ ] ThreatFox — IOCs malware activos (sin key, API pública)
- [ ] URLHaus — URLs maliciosas (sin key, API pública)
- [ ] URLScan.io — scan URLs/dominios (key gratuita)
- [ ] MXToolbox — DNS/mail checks (free tier)

### Resend email — problema conocido
- Hetzner IP en blacklist para envío directo via Resend
- Solución pendiente: routing via viajeinteligencia.com Next.js API (mismo patrón que viajeinteligencia)
- Endpoint destino: POST /api/email/send en viajeinteligencia → reenvía via Resend
- Afecta: /api/reports/auto-generate y módulo análisis infraestructura

### Video marketing
- Grabar demo con OBS: login → scan IP TOR → score CRÍTICO → mapa → informe IA
- 60-90 segundos, útil para LinkedIn/Twitter/GitHub README
- Hacer cuando demo pública esté lista

### Live Threat Map — capas visuales (PRIORITARIO Sprint 15)
- [ ] Capa Botnet C2 (rojo pulsante) — ThreatFox API, C2 activos con coords
- [ ] Capa Malware Distribution (naranja) — URLHaus IPs activas geolocalizadas
- [ ] Capa Mass Scanners (amarillo) — GreyNoise noise=true acumulado
- [ ] Capa TOR Exits (morado) — AbuseIPDB isTor=true
- [ ] Capa User Scans (cian) — IPs analizadas en sesión actual
- [ ] Cron cada 15min → fetch fuentes → SQLite con lat/lon
- [ ] Switch por capa en UI (patrón ya existe con heatmap)
- [ ] Esto convierte mapa en Live Threat Map real — diferenciador marketing

### Revisión narrativa/documentación (Sprint 15)
- [ ] Revisar y actualizar TODA la narrativa de la UI (textos, descripciones módulos)
- [ ] Actualizar fuentes documentadas (Shodan→InternetDB, añadir nuevas APIs)
- [ ] Metodología OSINT — reflejar stack real actual
- [ ] Sección módulos activos→pasivos (Opción D aplicada en UI)
- [ ] README.md actualizar con stack real y APIs integradas
- [ ] Textos mock/fake eliminar o reemplazar por datos reales

## COMPLETADO — Demo pública Sprint 14 2026-06-25
- POST /api/demo/scan — sin autenticación, 3 scans/día por IP
- demoLimiter: windowMs=24h, max=3, keyGenerator=req.ip
- Fuentes: InternetDB + AbuseIPDB + GreyNoise + IPInfo
- Verificado: 185.220.101.1 → Score 100/100 CRÍTICO sin login
-

## COMPLETADO — APIs OSINT Sprint 15 parcial 2026-06-25
- OTX AlienVault ✅ sin key — 50 pulses en 185.220.101.1
- ThreatFox ✅ key dadccac9... — 37 IOCs, header Auth-Key correcto
- crt.sh ✅ integrado con timeout 5s (útil para dominios, no IPs)
- trust proxy configurado (Nginx/Cloudflare X-Forwarded-For fix)
- THREATFOX_API_KEY añadida en .env local y producción

## PENDIENTE Sprint 15
- [ ] Live Threat Map — capas C2/malware/scanners con ThreatFox+URLHaus
- [ ] Añadir OTX+ThreatFox al risk engine (score)
- [ ] URLHaus integración
- [ ] Narrativa UI actualizar
- [ ] README actualizar
