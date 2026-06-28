# WAYAHEAD — ThreatRadar OSINT


## Sprint 18 — Telegram Alerts Integration ✅ [2026-06-26]

### Completado
- [x] Endpoint `/api/alerts/telegram` (POST) en server.ts
  - Acepta `message`, `ip`, `score`, `level`
  - Emoji automático por nivel (🔴 CRITICAL / 🟠 HIGH / 🟡 MEDIUM / 🟢 LOW)
  - Formato Markdown con parse_mode
- [x] Trigger automático en `/api/modules/run` → alerta si score HIGH/CRITICAL
- [x] Trigger automático en `/api/osint/analyze` → alerta si score HIGH/CRITICAL
- [x] Canal @ThreatRadar_Osint (`-1004403719037`) confirmado operativo
- [x] Variables TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID en .env servidor

### Pendiente Sprint 19
- [ ] UI narrative update (reemplazar textos mock en frontend)
- [ ] Map window enhancements
- [ ] README actualización
- [ ] Benchmark/audit module


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

## ✅ Sprint 17b — Resend proxy + fixes (2026-06-26)
- Proxy `/api/send-alert` creado en viaje-con-inteligencia (Next.js)
- Cloudflare WAF regla "Challenge bots" actualizada para excluir `/api/send-alert`
- ThreatRadar server.ts usa `https://www.viajeinteligencia.com/api/send-alert` (evita redirect 301)
- CRON_SECRET añadido al .env de threatradar-osint en servidor
- Email confirmado llegando via Resend ✅
- deploy.sh PM2 id corregido 33→8

## ✅ Sprint 17c — Telegram + Mapa ventana (2026-06-26)
- Bot @Threatradar_osint_bot creado, canal @ThreatRadar_Osint (chat_id: -1004403719037)
- Alertas Telegram al generar reporte via sendTelegramAlert()
- Mapa ventana independiente: botón VENTANA + /?mode=map standalone
- TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID en .env servidor

## ✅ Sprint 17d — Fixes y herramientas (2026-06-26)
- Groq fallback en auto-generate report (Gemini quota agotada)
- Email con contenido real via Groq ✅
- Telegram alerts funcionando al generar reporte ✅
- Herramientas instaladas en servidor: nmap, dnsrecon, whois, dig (ya existían) + traceroute, masscan, nikto (nuevas)
- Mapa ventana independiente ✅ botón VENTANA + /?mode=map
- Bot Telegram: @Threatradar_osint_bot, canal: @ThreatRadar_Osint, chat_id: -1004403719037

## 📋 Pendientes próxima sesión

### ThreatRadar
- [ ] Marcar en UI qué módulos están realmente instalados vs decorativos
- [ ] Instalar herramientas restantes: subfinder, httpx, nuclei, amass, theHarvester
- [ ] UI narrative update — reemplazar textos mock por datos reales
- [ ] README update Sprint 15-17
- [ ] Módulo auditoría/benchmark vs soluciones similares
- [ ] Telegram: enriquecer mensaje con top ASNs del día

### Infraestructura
- [ ] PM2 save para que el id 8 persista tras reinicios

## ✅ Sprint 19b — Fix audit/stats SQLite real (2026-06-27)
- [x] better-sqlite3 COUNT directo por número de línea (bypass readDB JSON)
- [x] Datos confirmados en producción:
  - C2s rastreados: 3.477 | URLHaus: 141 | Usuarios: 2
  - Top ASN: CTG Server Ltd (294), 12651980 Canada (278), DigitalOcean (243)
  - Top países: US (1154), HK (678), CN (338), NL (322), DE (236)
- [x] Todas las herramientas CLI activas: nmap dnsrecon nikto masscan traceroute whois
- [x] Todas las APIs configuradas: abuseipdb virustotal ipinfo threatfox groq gemini telegram
- [x] Commit 48d2426 — Sprint 19 completo en GitHub

## ✅ Sprint 20 — UX Guiado + Rediseño IPTester (2026-06-27)

### Completado
- [x] Hero IP input — campo grande centrado, Enter o botón Analizar
- [x] Score card inmediato — 0-100 con color, país, ISP, ciudad, conclusión Why Engine
- [x] Login gate — usuario sin sesión ve prompt registro, no error críptico
- [x] Free tier — score + análisis IA, sin datos raw
- [x] Pro tier — acordeón colapsable por fuente (8 fuentes) + comandos mitigación
- [x] Upsell card para free — CTA hacia planes visible tras resultado
- [x] Manual de operación eliminado del flujo principal
- [x] Auto-inject en mapa al analizar IP

### Credenciales desarrollo
- Dev user: dev@threatradar.local / ThreatAdmin2026! (plan enterprise)
- Plan enterprise: acceso completo a todas las funciones

## 📋 Sprint 21 — Pendientes próxima sesión

### ThreatRadar — alta prioridad
- [ ] ToS / Aviso Legal — tab estático con límites Hetzner explícitos
- [ ] nmap restringido por ToS — solo IPs privadas o IP propia del usuario
- [ ] Historial premium scan_history — retención Free 7d / Pro 90d / Ent 365d
- [ ] Panel historial con evolución de scores por IP
- [ ] Tabla competidores dinámica — SQLite + review mensual Telegram día 1
- [ ] apt install subfinder httpx nuclei amass + pip theHarvester en Hetzner
- [ ] UI narrative update — textos reales en StaticInfo.tsx
- [ ] README update Sprint 15-20
- [ ] pm2 save — persistir id 8 tras reinicios
- [ ] CSP fix — añadir static.cloudflareinsights.com a connect-src en server.ts

### Stack / infra
- App: ~/threatradar-osint (local) → deploy SSH deploy@178.105.80.193
- PM2 id 8, puerto 3013, URL: threatradar.viajeinteligencia.com
- Deploy: npm run build → rsync dist/ → rsync server.ts → pm2 restart 8 → CF purge
- SQLite: /home/deploy/apps/threatradar-osint/data/threatradar.db
- Telegram alerts: @Threatradar_osint_bot → canal @ThreatRadar_Osint (-1004403719037)
- Resend proxy: https://www.viajeinteligencia.com/api/send-alert
- CF_ZONE_ID en ~/.cf_env

## ✅ Sprint 21 — LegalPanel ToS + tab Legal (2026-06-27)

### Completado
- [x] LegalPanel.tsx — 5 secciones en acordeón:
  - Términos de Servicio (6 cláusulas)
  - Límites Hetzner (nmap restringido, masscan deshabilitado, volumen por plan)
  - Privacidad y datos (RGPD, retención por plan, derechos usuario)
  - Metodología OSINT (9 fuentes, cálculo ThreatScore, Why Engine)
  - Conductas prohibidas y consecuencias (Art. 197 bis CP)
- [x] Tab "Legal" con icono Scale añadido en App.tsx
- [x] Import Scale de lucide-react añadido
- [x] IPTesterAndManual restaurado al original funcional (detección IP pública OK)
- [x] Commit 67303f4 — GitHub actualizado

### Pendiente Sprint 22
- [ ] Tabla comparativa vs competidores dinámica en AuditPanel (diseño listo)
- [ ] pm2 save — persistir id 8 tras reinicios
- [ ] CSP fix — añadir static.cloudflareinsights.com a script-src en server.ts
- [ ] Historial scan_history — retención Free 7d / Pro 90d / Ent 365d
- [ ] Panel historial con evolución scores por IP
- [ ] apt install subfinder httpx nuclei amass en Hetzner
- [ ] pip install theHarvester en Hetzner
- [ ] README update Sprint 15-21
- [ ] UI narrative update — textos reales en StaticInfo.tsx

## ✅ Sprint 21b — Fix build + Legal visible (2026-06-27)
- [x] Fix coma faltante en lucide-react imports (Mail, Scale)
- [x] Bundle index-eDha8SIQ.js — nuevo hash confirmado
- [x] Tab Legal visible en producción ✅
- [x] pm2 save ejecutado — id 8 persistirá tras reinicios
- [x] Instalados en Hetzner: nmap dnsrecon nikto whois traceroute dig masscan
- [x] Pendiente instalar: wafw00f subfinder httpx nuclei amass theHarvester

## ✅ Sprint 23 — Herramientas servidor (2026-06-27)
- [x] httpx v2.14.0 — ~/go/bin/httpx ✅
- [x] subfinder — ~/go/bin/subfinder ✅  
- [x] wafw00f v2.4.2 — pip ✅
- [x] Limpieza disco: /tmp/go-build* eliminado → 77%→71%
- [x] PATH ~/go/bin añadido a .env PM2
- [ ] theHarvester real — pip instala stub v0.0.1, necesita instalación manual desde GitHub
- [ ] nuclei — no instalado, demasiado pesado, marcar unavailable en UI
- [ ] amass — no instalado, marcar unavailable en UI
- [ ] db.ts — actualizar status real de módulos (unavailable vs active)

## 📋 Sprint 24 — Próxima sesión
- [ ] Tabla comparativa dinámica en AuditPanel (SQLite + review mensual Telegram)
- [ ] Historial scan_history retención por plan (Free 7d / Pro 90d / Ent 365d)
- [ ] CSP fix — static.cloudflareinsights.com
- [ ] theHarvester real desde GitHub releases
- [ ] db.ts módulos — status real vs decorativo
- [ ] README update Sprint 15-23

## ✅ Limpieza disco Hetzner (2026-06-27)
- [x] ~/.cache/go-build eliminado — 1.9GB liberados
- [x] ~/.cache/Cypress eliminado — 679MB liberados  
- [x] ~/.cache/pip eliminado — 146MB liberados
- [x] Disco: 77% → 63% (14GB libres)

## 🔄 Sprint 24 — En progreso (2026-06-27)
- [x] scan_history tabla SQLite con auto-creación
- [x] GET /api/history — retención Free 7d / Pro 90d / Ent 365d
- [x] DELETE /api/history/:id
- [x] ScanHistoryPanel.tsx — lista con score, nivel, país, ISP, resumen, fecha
- [x] Tab Historial en App.tsx
- [x] Sprint 22 — StaticInfo.tsx narrativa real (FAQs acordeón, normativa IPs, IPv6, fuentes reales)
- [x] Sprint 23 — httpx v2.14.0, subfinder, wafw00f instalados en Hetzner
- [x] Disco Hetzner: 77% → 63% (limpieza go-build/Cypress/pip cache)
- [ ] PENDIENTE: conectar saveScanHistory() al endpoint /api/osint/ip-full

## ✅ Sprint 24 completado (2026-06-27)
- [x] saveScanHistory() conectado a /api/osint/ip-full (línea 1250)
- [x] Cada análisis OSINT completo guarda en scan_history SQLite
- [x] Retención automática por plan al guardar (purga entradas antiguas)
- [x] Tab Historial visible en producción
- [x] Commit 0d7c000

## 📋 Sprint 25 — Pendientes
- [ ] CSP fix: añadir static.cloudflareinsights.com a script-src en server.ts
- [ ] Tabla comparativa competidores dinámica en AuditPanel (SQLite + review mensual Telegram)
- [ ] theHarvester real desde GitHub releases
- [ ] nuclei/amass — marcar unavailable en db.ts
- [ ] README update Sprint 15-24
- [ ] WAF recommendations endpoint /api/waf/recommend

## ✅ Sprint 25a — CSP fix + db.ts módulos (2026-06-27)
- [x] CSP fix — static.cloudflareinsights.com añadido a script-src y connect-src en server.ts
- [x] db.ts — nuclei, amass, theHarvester marcados como unavailable (no instalados)
- [x] Deploy confirmado en producción

## 📋 Sprint 25b — Pendientes
- [ ] Tabla comparativa competidores dinámica en AuditPanel (SQLite + review mensual Telegram)
- [ ] theHarvester real desde GitHub releases
- [ ] WAF recommendations endpoint /api/waf/recommend
- [ ] README update Sprint 15-24

## ✅ Sprint 25b — WAF Recommendations Engine (2026-06-28)
- [x] Endpoint POST /api/waf/recommend — authMiddleware
- [x] Análisis basado en: InternetDB ports/vulns/tags, GreyNoise classification, AbuseIPDB score
- [x] Reglas por prioridad: CRITICAL/HIGH/MEDIUM/LOW/INFO
- [x] Comandos ufw listos para copiar por recomendación
- [x] Cloudflare WAF rules sugeridas automáticamente
- [x] Testado en producción: 185.220.101.1 → 2x CRITICAL ✅

## 📋 Sprint 26 — Pendientes
- [ ] WAFPanel.tsx — UI para /api/waf/recommend integrada en App.tsx
- [ ] Tabla comparativa competidores dinámica en AuditPanel
- [ ] Análisis y mejora de informes IA generados
- [ ] theHarvester — test real en producción con dominio de prueba
- [ ] README update Sprint 15-25

## ✅ Sprint 26 — WAFPanel + Mejora informes IA (2026-06-28)
- [x] WAFPanel.tsx — UI completa con prioridades, comandos copiables, reglas Cloudflare
- [x] Tab WAF integrado en App.tsx
- [x] Prompt CTI mejorado — structuredData selectivo (OTX/ThreatFox/crtsh/AbuseIPDB categories)
- [x] Executive Summary añadido como sección 0
- [x] max_tokens 4000 (antes 3000)
- [x] Fix Array.isArray para threatfox_iocs
- [x] Informes verificados en producción — calidad notablemente mejorada

## 📋 Sprint 27 — Pendientes
- [ ] abuseipdb_categories no llega — revisar estructura reports en ip-full
- [ ] Tabla comparativa competidores dinámica en AuditPanel
- [ ] theHarvester — test real con dominio de prueba
- [ ] README update Sprint 15-26

## 📋 Sprint 27 — Mapa + Competidores + Fixes (próxima sesión)

### Mapa D3.js (SimplifiedVectorMap.tsx — rediseño completo)
- ThreatAlert ya tiene latitude/longitude reales ✅
- Stack: D3.js (ya disponible) + TopoJSON world (~200KB)
- Mejoras: geografía real reconocible, puntos lat/lng precisos, animaciones amenazas, stats en tiempo real junto al mapa, estética profesional
- Archivo: src/components/SimplifiedVectorMap.tsx (502 líneas, reemplazar completo)
- TopoJSON source: https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json

### Otros pendientes Sprint 27
- [ ] abuseipdb_categories no llega al prompt — revisar estructura reports en /api/osint/ip-full
- [ ] Tabla comparativa competidores dinámica en AuditPanel (SQLite + review mensual)
- [ ] theHarvester — test real con dominio de prueba en servidor
- [ ] README update Sprint 15-26

## ✅ Sprint 27a — Fixes críticos (2026-06-28)
- [x] execAsync PATH fix — ~/.local/bin y ~/go/bin en env de ejecución de módulos
- [x] checkToolAvailable PATH fix — rutas absolutas sin tilde
- [x] Auto-generate informe con datos SQLite reales (C2s, URLHaus, ASNs, países, scans)
- [x] Bug fecha 2024 → 2026 corregido
- [x] Bug `no such column: score` → `threat_score` corregido
- [x] Bug `abuseipdb_categories` Array.isArray corregido
- [x] Bug ruta SQLite relativa → path.join(process.cwd()) corregido
- [x] shodan marcado unavailable (sin API key)
- [x] theHarvester activo (~/.local/bin/theHarvester)
- [x] wafw00f funcional en producción

## 📋 Sprint 28 — Próxima sesión
- [ ] Mapa D3.js rediseño completo SimplifiedVectorMap.tsx (TopoJSON, lat/lng reales, animaciones)
- [ ] Tabla comparativa competidores dinámica en AuditPanel
- [ ] theHarvester test real con dominio de prueba
- [ ] README update Sprint 15-27
