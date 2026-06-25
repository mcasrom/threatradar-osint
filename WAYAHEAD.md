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
