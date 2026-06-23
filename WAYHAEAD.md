# ThreatRadar OSINT - WayAhead & Roadmap

> **Email:** threatradar-osint@viajeinteligencia.com  
> **Repo:** https://github.com/mcasrom/threatradar-osint  
> **Última actualización:** Junio 2026

---

## 🔑 APIs OSINT Prioritarias a Conseguir

### Sprint 0 - Inmediato (Free)

| API | Uso | URL Registro | Precio |
|-----|-----|-------------|--------|
| **Google Gemini** | Motor IA informes | https://aistudio.google.com/app/apikey | Free (60 req/min) |
| **Shodan** | Device discovery | https://account.shodan.io/register | Free (100 créditos/mes) |
| **AbuseIPDB** | IP reputation | https://www.abuseipdb.com/register | Free (1000 req/día) |
| **VirusTotal** | Malware analysis | https://www.virustotal.com/gui/join-us | Free (500 req/día) |
| **HaveIBeenPwned** | Breach checking | https://haveibeenpwned.com/API/Key | $3.50/mes |
| **IPinfo** | Geolocalización IP | https://ipinfo.io/signup | Free (50k req/mes) |
| **AlienVault OTX** | Threat feeds | https://otx.alienvault.com/ | Free |

### Sprint 1-2 - Profesional (Low Cost)

| API | Uso | URL Registro | Precio |
|-----|-----|-------------|--------|
| **SecurityTrails** | DNS history, subdomains | https://securitytrails.com/corp/api | Free → $99/mes |
| **GreyNoise** | Internet noise filtering | https://www.greynoise.io/ | Free → $500/mes |
| **Hunter.io** | Email discovery | https://hunter.io/users/register | Free → $49/mes |
| **Censys** | Cyberspace search | https://censys.io/register | Free → $299/mes |
| **FullHunt** | Attack surface | https://fullhunt.io/ | Free → $49/mes |
| **DeHashed** | Breached data search | https://dehashed.com/register | $9.99/mes |

### Sprint 3+ - Enterprise

| API | Uso | URL Registro | Precio |
|-----|-----|-------------|--------|
| **BinaryEdge** | Attack surface mgmt | https://www.binaryedge.io/ | $99/mes |
| **ZoomEye** | Cyberspace search | https://www.zoomeye.org/ | $99/mes |
| **MISP** | Threat intel platform | Self-hosted (Free) | Free |
| **Recorded Future** | Threat intelligence | https://www.recordedfuture.com/ | Enterprise |
| **CrowdStrike Falcon** | EDR + threat intel | https://www.crowdstrike.com/ | Enterprise |

---

## 📋 Roadmap por Sprints

### Sprint 1 - Semanas 1-2: Core Real y Autenticación

**Objetivo:** Hacer la app 100% funcional con herramientas reales y proteger acceso.

- [ ] **Autenticación de usuarios**
  - JWT + bcrypt para registro/login
  - Roles: free, premium, admin
  - Middleware de autenticación en endpoints protegidos

- [ ] **Base de datos real**
  - Migrar de JSON a SQLite o PostgreSQL
  - Tablas: users, scans, reports, subscriptions, alerts
  - Conexión pool y migrations

- [ ] **Panel de usuario**
  - Dashboard personal con historial de escaneos
  - Estadísticas de uso (scans/day, reports generated)
  - Gestión de perfil y API keys personales

- [ ] **Integración Shodan real**
  - Endpoint `/api/osint/shodan/:ip` ya creado, probar con key real
  - Cache de resultados (TTL 24h)
  - Rate limiting por usuario

- [ ] **Integración AbuseIPDB real**
  - Endpoint `/api/osint/abuseipdb/:ip` ya creado
  - Mostrar score de confianza en UI
  - Badge visual verde/amarillo/rojo

- [ ] **Integración VirusTotal real**
  - Endpoint `/api/osint/virustotal/:ip` ya creado
  - Mostrar detecciones en UI
  - Link directo al reporte VT

- [ ] **Integración HIBP real**
  - Endpoint `/api/osint/hibp/:email` ya creado
  - Formulario de búsqueda de email en UI
  - Mostrar breaches encontrados

- [ ] **Mejoras de seguridad**
  - CSRF protection
  - Input sanitization en todos los endpoints
  - Audit log de acciones de usuario

---

### Sprint 2 - Semanas 3-4: Monetización y Stripe

**Objetivo:** Activar modelo de negocio SaaS con pagos reales.

- [ ] **Stripe completo**
  - Crear productos en Stripe Dashboard (Basic, Premium, Enterprise)
  - Configurar webhook endpoint en server
  - Customer portal para gestión de suscripción
  - Cancelación y downgrade automático

- [ ] **Feature gating por plan**
  - Free: 2 scans/día, sin IA, sin reports automáticos
  - Premium (49€/mes): scans ilimitados, IA, reports automáticos, export PDF
  - Enterprise (299€/mes): multi-tenant, API access, SLA, soporte prioritario

- [ ] **Landing page de pricing**
  - Página pública comparativa de planes
  - Testimonios y casos de uso
  - FAQ de facturación

- [ ] **Sistema de trials**
  - 14 días premium gratis al registro
  - Email de recordatorio antes de cobrar
  - Conversión automática a free si no paga

- [ ] **Facturación**
  - Generar invoices PDF
  - Historial de pagos en dashboard
  - Descarga de facturas

- [ ] **Integración SecurityTrails**
  - DNS history lookup
  - Subdomain enumeration
  - WHOIS history

- [ ] **Integración GreyNoise**
  - IP context: scanner vs attacker
  - Reducir falsos positivos en alertas
  - Badge "Internet Noise" vs "Real Threat"

---

### Sprint 3 - Semanas 5-6: Features Premium y Automatización

**Objetivo:** Diferenciadores competitivos para retención.

- [ ] **Scheduled scans**
  - Cron jobs para escaneos periódicos
  - Configurar frecuencia por target
  - Notificación de cambios detectados

- [ ] **Threat feed aggregator**
  - Consumir feeds RSS de: AlienVault OTX, MISP, Abuse.ch
  - Dashboard de amenazas globales en tiempo real
  - Alertas personalizadas por IOC

- [ ] **Export de reportes**
  - PDF con branding profesional
  - Templates personalizables
  - Envío automático por email

- [ ] **Webhooks outbound**
  - Configurar webhooks para Discord, Slack, Telegram
  - Payload JSON personalizable
  - Retry logic con exponential backoff

- [ ] **API pública**
  - REST API documentada con Swagger/OpenAPI
  - API keys por usuario
  - Rate limiting por tier

- [ ] **Integración Hunter.io**
  - Email finder por dominio
  - Email verification
  - Bulk search

- [ ] **Integración Censys**
  - Alternative Shodan data
  - Certificate transparency logs
  - Host discovery

---

### Sprint 4 - Semanas 7-8: Enterprise y Multi-Tenant

**Objetivo:** Capturar clientes corporativos.

- [ ] **Multi-tenant architecture**
  - Organizaciones separadas
  - Data isolation por tenant
  - Admin panel para gestión

- [ ] **SSO / OAuth**
  - Google OAuth
  - GitHub OAuth
  - SAML para enterprise

- [ ] **Team management**
  - Invitar miembros a organización
  - Roles: admin, analyst, viewer
  - Activity log por usuario

- [ ] **Compliance reporting**
  - Templates: ISO 27001, SOC 2, GDPR
  - Automated compliance checks
  - Audit trail export

- [ ] **SLA monitoring**
  - Uptime dashboard
  - Performance metrics
  - Incident management

- [ ] **Integración MISP**
  - Self-hosted threat intel platform
  - IOC sharing
  - Event correlation

- [ ] **Integración BinaryEdge**
  - Attack surface discovery
  - Data leak monitoring
  - Asset inventory

---

### Sprint 5 - Semanas 9-10: UX Avanzada y Analytics

**Objetivo:** Mejorar retención y engagement.

- [ ] **Real-time WebSocket**
  - Live alert streaming
  - Scan progress updates
  - Collaborative dashboard

- [ ] **Advanced map features**
  - Leaflet.js con tiles reales
  - Clustering de amenazas
  - Heatmap con densidad real
  - Filtros por tipo de ataque, país, severidad

- [ ] **Analytics dashboard**
  - Gráficos de tendencias (Chart.js/D3)
  - Top attack sources
  - Most targeted ports
  - Temporal patterns

- [ ] **Mobile responsive**
  - PWA con offline support
  - Push notifications
  - Mobile-first design

- [ ] **Dark/Light theme**
  - Toggle de tema
  - Persistencia en localStorage
  - System preference detection

- [ ] **Search global**
  - Búsqueda unificada: IPs, dominios, reports
  - Autocomplete
  - Filtros avanzados

---

### Sprint 6+ - Futuro

- [ ] **ML threat prediction**
  - Modelos de predicción de ataques
  - Anomaly detection
  - Behavioral analysis

- [ ] **Threat intelligence sharing**
  - Comunidad de usuarios
  - IOC sharing platform
  - Reputation system

- [ ] **Integración con SIEM**
  - Splunk, Elastic, QRadar
  - Log forwarding
  - Correlation rules

- [ ] **Honeypot network**
  - Deploy honeypots reales
  - Feed de datos reales al mapa
  - Community honeypot network

- [ ] **Bug bounty integration**
  - Submit vulnerabilities
  - Integration with HackerOne/Bugcrowd
  - Automated triage

---

## 🚀 Mejoras Técnicas Inmediatas

### Performance
- [ ] Implementar Redis para caching de scans
- [ ] CDN para assets estáticos
- [ ] Database indexing en queries frecuentes
- [ ] Lazy loading de componentes React
- [ ] Code splitting por ruta

### DevOps
- [ ] CI/CD con GitHub Actions
- [ ] Automated tests (Jest + React Testing Library)
- [ ] E2E tests con Playwright
- [ ] Docker health checks
- [ ] Monitoring con Prometheus + Grafana
- [ ] Log aggregation con ELK stack

### Security
- [ ] Penetration testing
- [ ] Dependency audit (npm audit)
- [ ] Secret scanning con git-secrets
- [ ] WAF rules
- [ ] DDoS protection (Cloudflare)
- [ ] Regular security audits

### SEO & Marketing
- [ ] SSR con Next.js (migrar desde Vite)
- [ ] Blog técnico para content marketing
- [ ] API documentation pública
- [ ] Demo interactiva sin registro
- [ ] Affiliate program

---

## 💰 Estrategia de Monetización

### Fase 1: Tráfico (Meses 1-3)
- Freemium para atraer usuarios
- Content marketing (blog, YouTube, Twitter)
- Community building (Discord, Reddit)
- Demo pública viral

### Fase 2: Conversión (Meses 3-6)
- Trial a premium conversion
- Email marketing campaigns
- Case studies y testimonios
- Webinars de demostración

### Fase 3: Escala (Meses 6-12)
- Enterprise sales
- Partner program
- Marketplace de plugins
- White-label solution

### Métricas Clave
| Métrica | Target M3 | Target M6 | Target M12 |
|---------|-----------|-----------|------------|
| Usuarios registrados | 1,000 | 5,000 | 20,000 |
| Premium conversion | 2% | 5% | 8% |
| MRR | €500 | €5,000 | €25,000 |
| Churn rate | <10% | <5% | <3% |
| NPS | >40 | >50 | >60 |

---

## 📞 Contacto y Recursos

- **Email:** threatradar-osint@viajeinteligencia.com
- **GitHub:** https://github.com/mcasrom/threatradar-osint
- **Documentación APIs:** `docs/OSINT_APIS.md`
- **Deploy Guide:** `deploy/hetzner-deploy.sh`

---

*Documento vivo - actualizar al final de cada sprint*

---

## ✅ Sprint 0 COMPLETADO — 22 Junio 2026

### Lo que hicimos hoy:
- [x] Verificadas 4 APIs OSINT con datos reales: Shodan, AbuseIPDB, VirusTotal, Hunter.io
- [x] Añadido endpoint `/api/osint/hunter/:domain` (no existía)
- [x] Añadido endpoint `/api/osint/ip-full/:ip` — Shodan+AbuseIPDB+VirusTotal en paralelo (Promise.all, ~900ms)
- [x] Servidor corriendo en puerto 3000 con Gemini + SMTP configurados

### Próximo — Sprint 1:
- [ ] Conectar /api/osint/ip-full a IPTesterAndManual.tsx (UI datos reales)
- [ ] Auth JWT
- [ ] Migrar JSON DB a SQLite

---

## 🔄 Sprint 0 — Sesión 2 — 22 Junio 2026

### Lo que hicimos:
- [x] Endpoint `/api/osint/ip-full/:ip` — Shodan+AbuseIPDB+VirusTotal en paralelo (Promise.all)
- [x] Endpoint `/api/osint/hunter/:domain` añadido
- [x] Migrado geolocalización de `ipapi.co` (caído) a `ip-api.com` (funcional)
- [x] Corregidos campos geo: `lat/lon/country/query` en IPTesterAndManual.tsx
- [x] Añadido Australia/Brisbane/Sydney como vector de ataque en AlertSimulator
- [x] Verificadas 4 APIs con datos reales: Shodan, AbuseIPDB, VirusTotal, Hunter.io

### Pendiente Sprint 1 (próxima sesión):
- [ ] Conectar /api/osint/ip-full a UI para mostrar datos reales en scan
- [ ] Auth JWT (registro/login/middleware)
- [ ] Migrar JSON DB a SQLite/PostgreSQL
- [ ] Feature gating por plan (free/pro/enterprise)
- [ ] Stripe en producción

---

## ✅ Sprint 1 — Auth JWT — 23 Junio 2026

### Lo que hicimos:
- [x] src/auth.ts — registerUser, loginUser, generateToken, authMiddleware
- [x] POST

---

## 🔄 Sprint 2 — Feature Gating — PENDIENTE

### Objetivo: convertir el proyecto en SaaS con tiers reales

### Plan:
1. [ ] Proteger endpoints OSINT con authMiddleware (requieren token válido)
2. [ ] Añadir campo scanCount al usuario en db.ts
3. [ ] Middleware de plan: free=10 scans/mes, pro=ilimitado, enterprise=ilimitado+priority
4. [ ] /api/auth/register acepta plan como parámetro opcional
5. [ ] Endpoint /api/user/usage — devuelve scans usados y límite del plan
6. [ ] Proteger /api/osint/ip-full con auth + plan check

### Lógica de gating:
- free: máx 10 scans/mes, solo Shodan+AbuseIPDB
- pro: ilimitado, Shodan+AbuseIPDB+VirusTotal+Hunter
- enterprise: todo pro + priority queue + webhook support

---

## ✅ Sprint 2 — Feature Gating — 23 Junio 2026

### Lo que hicimos:
- [x] planMiddleware — controla scans por plan (free=10/mes, pro=-1, enterprise=-1)
- [x] getPlanLimits() — define sources permitidas por tier
- [x] /api/user/usage — devuelve scansUsed/scansLimit/plan/month
- [x] /api/osint/ip-full protegido con authMiddleware + planMiddleware
- [x] scanCount persistido en db.ts por mes (key: YYYY-M)
- [x] Verificado: scan cuenta +1, límite free=10 funcional

### Próximo — Sprint 3:
- [ ] Proteger resto de endpoints OSINT con auth
- [ ] Stripe en producción (conectar plan pro/enterprise al checkout)
- [ ] Migrar JSON DB a SQLite
- [ ] Frontend: login/register UI

---

## ✅ Manual de Usuario — 23 Junio 2026

### Lo que hicimos:
- [x] Manual actualizado a v2.0 con APIs reales, endpoints, planes y seguridad
- [x] Eliminadas referencias a datos simulados

## 🔄 Sprint 3 — PENDIENTE

### Objetivo: cerrar el ciclo SaaS completo

### Plan:
1. [ ] Proteger endpoints OSINT restantes con authMiddleware
2. [ ] Stripe en producción (conectar plan pro/enterprise al checkout)
3. [ ] Migrar JSON DB a SQLite (mejor concurrencia y persistencia)
4. [ ] Login/register UI en el frontend
5. [ ] Dashboard de usuario (plan, scans usados, upgrade button)

---

## ✅ Sprint 3 — Parcial — 23 Junio 2026

### Lo que hicimos:
- [x] Todos los endpoints OSINT protegidos con authMiddleware (401 sin token)
- [x] SQLite instalado (better-sqlite3) — reemplaza JSON db
- [x] src/sqlite.ts — schema: users, reports, subscriptions
- [x] src/auth.ts — migrado a SQLite (getUser, getUserById, createUser, updateScanCount)
- [x] /api/user/usage — migrado a SQLite
- [x] Verificado: registro, login y usage funcionan sobre SQLite

### Pendiente Sprint 3:
- [ ] Stripe en producción (conectar plan pro/enterprise al checkout)
- [ ] Login/register UI en el frontend
- [ ] Dashboard de usuario (plan, scans usados, upgrade button)
- [ ] GreyNoise endpoint (cuando esté la key)

---

## ✅ Sprint 3 — Stripe + SQLite completo — 23 Junio 2026

### Lo que hicimos:
- [x] /api/billing/setup protegido con authMiddleware
- [x] Stripe webhook migrado a SQLite (updateUserPlan + updateSubscriptionStatus)
- [x] createSubscription/updateUserPlan/updateSubscriptionStatus en sqlite.ts
- [x] Stripe checkout pasa userId en metadata para actualizar plan tras pago

### Pendiente Sprint 4:
- [ ] Login/register UI en el frontend
- [ ] Dashboard de usuario (plan, scans usados, upgrade button)
- [ ] GreyNoise endpoint (cuando esté la key)
- [ ] Tests básicos (Jest)

---

## ✅ Sprint 4 — Auth UI — 23 Junio 2026

### Lo que hicimos:
- [x] AuthPanel.tsx — login, registro, dashboard, upgrade button
- [x] Muestra plan, scans usados, botón upgrade a Pro

### Pendiente próxima sesión:
- [ ] Integrar AuthPanel en App.tsx (header o sidebar)
- [ ] GreyNoise endpoint
- [ ] Tests básicos Jest
- [ ] Deploy producción

---

## ✅ Sprint 4 COMPLETO — 23 Junio 2026

### Lo que hicimos:
- [x] AuthPanel.tsx integrado en App.tsx header
- [x] Login/register/logout visible en UI
- [x] Dashboard: plan, scans usados, botón upgrade Pro
- [x] Stripe checkout desde UI

---

## 📊 RESUMEN TOTAL DEL PROYECTO — 23 Junio 2026

### Sprints completados:
- Sprint 0: 4 APIs OSINT reales (Shodan, AbuseIPDB, VirusTotal, Hunter)
- Sprint 1: Auth JWT (register/login/me) con bcrypt
- Sprint 2: Feature gating (free=10/mes, pro=ilimitado, planMiddleware)
- Sprint 3: SQLite migration + Stripe billing + todos endpoints protegidos
- Sprint 4: AuthPanel UI + integración en header

### Estado actual:
- Backend: production-ready
- Auth: JWT funcional
- DB: SQLite (no más JSON)
- APIs OSINT: 4 fuentes reales verificadas
- Monetización: Stripe checkout integrado
- UI Auth: login/register/dashboard/upgrade visible

## 🔄 Sprint 5 — Próxima sesión:
- [ ] GreyNoise endpoint (key pendiente)
- [ ] Tests básicos Jest (register, login, ip-full, usage)
- [ ] Deploy producción (Docker + Nginx)
- [ ] Página de precios pública /pricing

---

## ✅ Footer mailto — 23 Junio 2026
- [x] Email pie de página convertido a mailto link

