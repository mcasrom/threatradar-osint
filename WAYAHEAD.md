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
