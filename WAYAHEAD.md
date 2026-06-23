
---

## ✅ Sesión 23 Junio 2026 — Sumario

**Lo que hicimos:**
- Eliminado bug YouTube export (URL simulada falsa) de SimplifiedVectorMap.tsx y MonetizationPanel.tsx
- Creado PricingPage.tsx — tabla de planes Free/Pro/Enterprise con features reales
- Integrada tab "Precios" en App.tsx con CTA que navega a billing
- Corregido Dockerfile — añadidas build tools python3/make/g++ para compilar better-sqlite3
- Actualizado docker-compose.yml — añadidas variables HUNTER_API_KEY, GREYNOISE_API_KEY, IPINFO_TOKEN, JWT_SECRET
- Build Docker exitoso
- 2 commits pusheados a mcasrom/threatradar-osint

---

## 🔄 Sprint 8+ — Próximos pasos priorizados

### Inmediato
1. docker-compose up -d y smoke test en contenedor
2. Activar billing Gemini (quota free agotada, limit=0)
3. Fix registro: parámetro plan ignorado en /api/auth/register

### Sprint 9 — Frontend real
4. Conectar /api/osint/ip-full a IPTesterAndManual.tsx (datos reales en UI)
5. Dashboard usuario: plan actual, scans usados, upgrade visible

### Sprint 10 — Producción
6. Deploy en Hetzner (Nginx reverse proxy puerto 3000)
7. Dominio threatradar.viajeinteligencia.com + SSL certbot
8. .env.production con todas las keys

### Backlog
- Tests Jest básicos (register, login, ip-full, usage)
- Página pública sin login (demo limitada)
- GreyNoise key en producción
