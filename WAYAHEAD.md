# WAYAHEAD — ThreatRadar OSINT

Registro de sprints y tareas pendientes. Actualizado: 2026-06-25.

---

## ✅ Sprint 13 — Deploy inicial Hetzner
- SSL certbot, PM2 ecosystem.config.cjs port 3013
- Cloudflare WAF actualizado (5-rule limit)

## ✅ Sprint 14 — APIs y estabilización
- InternetDB sustituyendo Shodan free
- GreyNoise desbloqueado
- Usuario dev en SQLite: dev@threatradar.local / ThreatAdmin2026! (enterprise)
- Demo endpoint con rate limiting
- Groq fallback para Gemini quota

## ✅ Sprint 15 — Threat Intelligence
- APIs integradas: InternetDB, AbuseIPDB, VirusTotal, IPInfo, GreyNoise, OTX, ThreatFox (key dadccac9), crt.sh
- Live Threat Map: tabla `threat_map` SQLite, cron hourly ThreatFox→IPInfo, 100 C2 geolocalizados
- Endpoint `/api/threatmap/live`, refresh frontend cada 5min
- Why Engine: conclusion {summary, evidence, risk, confidence} en computeThreatScore
- Filtro regional mapa por país
- Demo pública `/api/demo/scan` — 3/día por IP

## ✅ Sprint 16 — URLHaus + Fixes (2026-06-25)
- **Fix trust proxy** — `express-rate-limit` v7.5.0 lanzaba `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`
  en bucle (100% CPU, 19 reinicios). Fix: `validate: { xForwardedForHeader: false }` en los 4 limiters.
- **URLHaus integration** — feed `json_recent` abuse.ch, 100 URLs malware activas cada 6h.
  Tabla `urlhaus_feed` SQLite. Endpoint `/api/urlhaus/feed`.
- **deploy.sh** en root del proyecto — flujo: `npm run build` → `rsync dist/` → `pm2 restart 33`

---

## 🔜 Sprint 17 — ASN Clustering (PRÓXIMO)

### Objetivo
Agrupar IPs del Live Threat Map por ASN/organización para identificar
qué proveedores alojan más C2s.

### Tareas
- [ ] Añadir columna `asn` y `org` a tabla `threat_map` (ALTER TABLE o recrear)
- [ ] En `fetchThreatMapData()` — enriquecer cada IP con ASN via IPInfo (`/json` devuelve `org`)
- [ ] Endpoint `/api/threatmap/asn` — top ASNs por count, con país y malware más frecuente
- [ ] Frontend: panel "Top ASNs" en la vista del Live Threat Map

---

## 📋 Pendientes generales

### DNSRecon
Mencionado en UI (`StaticInfo.tsx`), en `db.ts` como módulo activo con comando real
(`dnsrecon -d {target} -t std,rvl,srv,axfr`), y chequeado en `server.ts` con `checkToolAvailable`.
**No instalado en servidor.**
```bash
ssh deploy@178.105.80.193 "sudo apt install -y dnsrecon"
```

### UI Narrative update (Sprint 17/18)
Reemplazar textos mock/placeholder en el frontend por descripciones reales
basadas en los datos live (URLHaus, ThreatFox, Why Engine).

### README update (Sprint 17/18)
Documentar Sprint 15+16: APIs, Live Map, Why Engine, URLHaus, deploy.sh.

### Resend email (pospuesto)
Hetzner IP bloqueada por Resend. Solución: proxy via `/api/send-alert`
en viajeinteligencia.com Next.js que reenvía a Resend desde IP no bloqueada.

---

## 🏗️ Stack

| Componente | Detalle |
|---|---|
| Servidor | Hetzner Ubuntu, IP 178.105.80.193 |
| App dir | `/home/deploy/apps/threatradar-osint` |
| PM2 | id 33, nombre `threatradar` |
| Puerto | 3013 |
| URL | https://threatradar.viajeinteligencia.com |
| DB | SQLite `data/threatradar.db` |
| Deploy | `./deploy.sh` desde root del proyecto |
| Build | `vite build + esbuild server.ts → dist/server.cjs` |

## 🔑 APIs configuradas

| API | Key | Estado |
|---|---|---|
| ThreatFox | dadccac9 (Auth-Key header) | ✅ |
| IPInfo | en .env | ✅ |
| AbuseIPDB | en .env | ✅ |
| VirusTotal | en .env | ✅ |
| Groq | en .env | ✅ fallback Gemini |
| Gemini | en .env | ⚠️ quota agotada |
| GreyNoise | sin key | ✅ free tier |
| OTX | sin key | ✅ free tier |
| URLHaus | sin key | ✅ público |
| Resend | bloqueado desde Hetzner | ⏸️ pospuesto |

---

## 💡 Ideas futuras (backlog)

### Módulo Auditoría/Benchmark
Comparar ThreatRadar vs soluciones similares (Shodan, VirusTotal UI, AbuseIPDB)
en métricas de cobertura, velocidad de respuesta, fuentes integradas.
Panel interno con scores comparativos.

### Mapa geográfico — ventana independiente
Botón "Abrir mapa en ventana nueva" → `window.open('/threatmap', '_blank')`
Vista limpia solo con el mapa, sin sidebar, útil para presentaciones/monitores secundarios.


### ✅ DNSRecon — COMPLETADO (Sprint 17)
Instalado v1.1.5, detectado por Node, en DB servidor, endpoint /api/modules/run ejecuta real.

## ✅ Sprint 17 — ASN Clustering (2026-06-26)
- Columnas `asn` y `org` añadidas a tabla `threat_map` SQLite
- `fetchThreatMapData()` enriquece cada IP con ASN via IPInfo (`geo.org`)
- Endpoint `/api/threatmap/asn` — top 20 ASNs por count con país y malware
- Panel "TOP ASN C2 HOSTING" en SimplifiedVectorMap — colapsable, top 10
- deploy.sh actualizado PM2 id 33→8
- DNSRecon v1.1.5 verificado funcional (instalado, en DB, endpoint real)

Top hallazgos iniciales: AS399486 (12 C2s), AS152194 CTG Server HK (11 C2s), Tencent CN (6 C2s)
