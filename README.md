<div align="center">

# 🛡️ ThreatRadar OSINT

**Plataforma de Inteligencia de Fuentes Abiertas (OSINT) para Monitorización de Amenazas Cibernéticas en Tiempo Real**

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/mcasrom/threatradar-osint)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0-brightgreen.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/react-19.0-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/typescript-5.8-blue.svg)](https://www.typescriptlang.org)

[Características](#-características) • [Instalación](#-instalación) • [Despliegue](#-despliegue-en-hetzner) • [API](#-api-reference) • [Monetización](#-modelo-de-monetización) • [Contacto](#-contacto)

</div>

---

## 📋 Descripción

**ThreatRadar OSINT** es una plataforma profesional de ciberseguridad diseñada para SOC (Security Operations Center) y analistas de inteligencia que proporciona:

- **Mapa de amenazas geolocalizado** en tiempo real con visualización SVG vectorial
- **Motor de análisis IA** integrado con Google Gemini 3.5 Flash para informes tácticos
- **Módulos OSINT extensibles** (Nmap, DNS Recon, theHarvester)
- **Generación automática de reportes** con despacho por email y webhooks
- **Simulador de ataques** para testing de infraestructura defensiva
- **Panel de monetización** con integración Stripe para modelo SaaS

> **Contacto:** [threatradar-osint@viajeinteligencia.com](mailto:threatradar-osint@viajeinteligencia.com)

---

## ✨ Características

### 🗺️ Mapa Táctico de Amenazas
- Visualización SVG vectorial con proyección equirectangular
- Arcos de ataque animados con curvas Bézier
- Heatmap overlay interactivo
- Geolocalización IP en tiempo real (ipapi.co / ipify)
- Selector de regiones geopolíticas

### 🤖 Motor Premium IA (Gemini)
- Generación de informes tácticos de seguridad
- Chat interactivo con contexto de infraestructura
- Queries optimizadas para Shodan, Sensys y LeakIX
- Análisis de superficie de ataque personalizado
- Score de postura de seguridad (0-100)

### 🔌 Sistema de Plugins OSINT
- **Nmap Port Scanner** - Escaneo de puertos y servicios
- **DNS Reconnaissance** - Mapeo de subdominios y registros
- **theHarvester** - Recolección de emails y subdominios
- Registro de plugins personalizados con plantillas de comando

### 📧 Despacho Automático de Reportes
- Frecuencias: diario, semanal, mensual
- Envío por SMTP (Gmail, custom)
- Integración webhooks (Discord, Slack, Telegram)
- Historial de reportes con métricas

### 💰 Modelo de Monetización SaaS
| Plan | Precio | Características |
|------|--------|----------------|
| **Freemium** | Gratis | Mapa básico, 2 escaneos/día |
| **Cyber Sentinel PRO** | 49€/mes | IA ilimitada, reportes automáticos, exportación |
| **SOC Multi-Tenant** | 299€/mes | Despliegue dedicado, SLA 99.99%, soporte 1-to-1 |

---

## 🚀 Instalación

### Prerrequisitos
- Node.js >= 18.0
- npm >= 9.0
- API Key de Google Gemini (opcional, para motor IA)

### Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/mcasrom/threatradar-osint.git
cd threatradar-osint

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Ejecutar en producción
npm start
```

La aplicación estará disponible en `http://localhost:3000`

---

## 🐳 Docker

```bash
# Construir y ejecutar con Docker Compose
docker compose up -d

# Ver logs
docker compose logs -f threatradar-osint
```

---

## 🏗️ Despliegue en Hetzner

### Requisitos del Servidor
- **Hetzner Cloud** (CX22 mínimo: 2 vCPU, 4GB RAM, 40GB SSD)
- Ubuntu 22.04 LTS
- Dominio configurado con DNS apuntando al servidor

### Despliegue Automático

```bash
# Conectar al servidor
ssh root@TU_IP_HETZNER

# Ejecutar script de despliegue
chmod +x deploy-hetzner.sh
./deploy-hetzner.sh
```

### Despliegue Manual

```bash
# 1. Actualizar sistema
apt update && apt upgrade -y

# 2. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 3. Instalar Nginx
apt install -y nginx

# 4. Clonar y configurar
git clone https://github.com/mcasrom/threatradar-osint.git /opt/threatradar
cd /opt/threatradar
npm install
cp .env.example .env
# Editar .env

# 5. Construir
npm run build

# 6. Configurar Nginx (ver deploy/nginx.conf)
cp deploy/nginx.conf /etc/nginx/sites-available/threatradar
ln -s /etc/nginx/sites-available/threatradar /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 7. Instalar PM2 y configurar servicio
npm install -g pm2
pm2 start dist/server.cjs --name threatradar
pm2 save
pm2 startup
```

### Certificado SSL (Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d threatradar.tudominio.com
```

---

## 🔧 API Reference

### Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/status` | Estado del servidor y módulos |
| `GET` | `/api/modules` | Listar módulos OSINT |
| `POST` | `/api/modules` | Crear nuevo módulo |
| `POST` | `/api/modules/run` | Ejecutar módulo OSINT |
| `POST` | `/api/premium-report` | Generar informe IA |
| `POST` | `/api/reports/auto-generate` | Generar y despachar reporte |
| `GET` | `/api/reports/auto-generate` | Listar reportes generados |
| `POST` | `/api/billing/setup` | Configurar suscripción |

### Ejemplo: Generar Informe IA

```bash
curl -X POST http://localhost:3000/api/premium-report \
  -H "Content-Type: application/json" \
  -d '{
    "organization": "Mi Empresa S.L.",
    "infrastructure": "Nginx + PostgreSQL en Hetzner Cloud"
  }'
```

---

## 🔐 Seguridad

### Variables de Entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `GEMINI_API_KEY` | API Key de Google Gemini | No (fallback mock) |
| `APP_URL` | URL de la aplicación | No |
| `SMTP_HOST` | Servidor SMTP | No |
| `SMTP_PORT` | Puerto SMTP (587/465) | No |
| `SMTP_USER` | Usuario SMTP | No |
| `SMTP_PASS` | Contraseña SMTP | No |
| `SMTP_FROM` | Remitente emails | No |

> **Importante:** Nunca commitear el archivo `.env`. Usar `.env.example` como plantilla.

### Mejoras de Seguridad Implementadas
- Rate limiting en endpoints API
- Validación de inputs sanitizada
- Helmet.js para headers HTTP seguros
- CORS configurado
- Variables de entorno protegidas en `.gitignore`

---

## 📁 Estructura del Proyecto

```
threatradar-osint/
├── src/
│   ├── components/
│   │   ├── AlertSimulator.tsx      # Simulador de ataques
│   │   ├── AutoReportsManager.tsx  # Gestión de reportes automáticos
│   │   ├── IPTesterAndManual.tsx   # Tester de IP y manual
│   │   ├── MonetizationPanel.tsx   # Panel de monetización Stripe
│   │   ├── OSINTModulesManager.tsx # Gestor de módulos OSINT
│   │   ├── PremiumAIChat.tsx       # Motor IA premium
│   │   ├── SimplifiedVectorMap.tsx # Mapa de amenazas SVG
│   │   └── StaticInfo.tsx          # FAQs, About, Metodología
│   ├── App.tsx                     # Componente principal
│   ├── db.ts                       # Base de datos JSON + config
│   ├── types.ts                    # Tipos TypeScript
│   ├── index.css                   # Estilos Tailwind + custom
│   └── main.tsx                    # Entry point React
├── server.ts                       # Servidor Express + API
├── deploy/
│   ├── nginx.conf                  # Configuración Nginx
│   └── hetzner-deploy.sh           # Script despliegue
├── docker-compose.yml              # Docker Compose
├── Dockerfile                      # Docker image
├── .env.example                    # Plantilla variables
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🛠️ Stack Tecnológico

- **Frontend:** React 19 + TypeScript + Vite 6
- **Backend:** Express.js 4 + TypeScript (tsx)
- **Estilos:** Tailwind CSS 4 + animaciones custom
- **IA:** Google Gemini 3.5 Flash
- **Email:** Nodemailer
- **Base de datos:** JSON file (SQLite ready)
- **UI Icons:** Lucide React
- **Build:** Esbuild + Vite
- **Deploy:** Docker / PM2 / Nginx

---

## 📈 Roadmap

- [ ] Integración real con Stripe para pagos
- [ ] Base de datos SQLite/PostgreSQL persistente
- [ ] Autenticación de usuarios (JWT + OAuth)
- [ ] API de feeds de amenazas en tiempo real
- [ ] Dashboard multi-tenant
- [ ] Integración con Shodan/LeakIX API real
- [ ] Exportación de reportes PDF
- [ ] Notificaciones push (PWA)
- [ ] Integración con MISP (Threat Intelligence Platform)

---

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

---

## 📞 Contacto

- **Email:** [threatradar-osint@viajeinteligencia.com](mailto:threatradar-osint@viajeinteligencia.com)
- **GitHub:** [@mcasrom](https://github.com/mcasrom)
- **Autor:** Miguel C.

---

<div align="center">

**ThreatRadar OSINT** • Inteligencia de Fuentes Abiertas para la Defensa Cibernética

Hecho con 🛡️ para la comunidad de seguridad informática

</div>
