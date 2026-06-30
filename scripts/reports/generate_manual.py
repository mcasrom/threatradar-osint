#!/usr/bin/env python3
"""
ThreatRadar OSINT — User Manual Generator v2.0
Genera manual-threatradar-v2.pdf en dist/ para descarga desde la UI
Uso: python3 generate_manual.py --output dist/manual-threatradar-v2.pdf
"""
import argparse
from datetime import datetime
from pathlib import Path

def build_html() -> str:
    now = datetime.now()
    version = "2.0.0"
    date_str = now.strftime("%d de %B de %Y")

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<style>
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  body {{ background:#050d1a; color:#e2e8f0; font-family:Arial,sans-serif; font-size:12px; line-height:1.7; }}
  .page {{ padding:48px 52px; max-width:860px; margin:0 auto; }}

  /* Cover */
  .cover {{ text-align:center; padding:60px 0 50px; border-bottom:2px solid #1e3a5f; margin-bottom:40px; }}
  .cover-logo {{ font-family:monospace; font-size:11px; color:#00f2ff; letter-spacing:4px; margin-bottom:12px; }}
  .cover-title {{ color:#00f2ff; font-family:monospace; font-size:28px; font-weight:bold; letter-spacing:2px; margin-bottom:6px; }}
  .cover-sub {{ color:#94a3b8; font-size:14px; margin-bottom:24px; }}
  .cover-badge {{ display:inline-block; background:#00f2ff22; border:1px solid #00f2ff44; color:#00f2ff;
                  font-family:monospace; font-size:11px; padding:6px 20px; border-radius:20px; margin:4px; }}
  .cover-meta {{ color:#475569; font-size:10px; font-family:monospace; margin-top:20px; }}

  /* TOC */
  .toc {{ background:#0a1628; border:1px solid #1e3a5f; border-radius:8px; padding:24px 28px; margin-bottom:32px; }}
  .toc-title {{ color:#00f2ff; font-family:monospace; font-size:12px; font-weight:bold; margin-bottom:14px; letter-spacing:1px; }}
  .toc-item {{ display:flex; justify-content:space-between; padding:4px 0;
               border-bottom:1px dotted #1e3a5f; font-size:11px; color:#94a3b8; }}
  .toc-item span:first-child {{ color:#e2e8f0; }}
  .toc-num {{ color:#00f2ff; font-family:monospace; min-width:20px; }}

  /* Sections */
  h1 {{ color:#00f2ff; font-family:monospace; font-size:16px; letter-spacing:1px;
        border-left:3px solid #00f2ff; padding-left:12px; margin:32px 0 14px; page-break-before:always; }}
  h1:first-of-type {{ page-break-before:avoid; }}
  h2 {{ color:#7dd3fc; font-family:monospace; font-size:12px; margin:20px 0 8px; }}
  h3 {{ color:#94a3b8; font-family:monospace; font-size:11px; margin:14px 0 6px; }}
  p {{ color:#cbd5e1; font-size:11px; margin-bottom:10px; }}

  /* Cards */
  .card {{ background:#0a1628; border:1px solid #1e3a5f; border-radius:6px; padding:16px 20px; margin-bottom:14px; }}
  .card-title {{ color:#00f2ff; font-family:monospace; font-size:11px; font-weight:bold; margin-bottom:8px; }}

  /* Steps */
  .step {{ display:flex; gap:14px; align-items:flex-start; padding:10px 0; border-bottom:1px solid #0f2744; }}
  .step-num {{ min-width:26px; height:26px; background:#00f2ff22; border:1px solid #00f2ff44;
               color:#00f2ff; border-radius:50%; display:flex; align-items:center; justify-content:center;
               font-family:monospace; font-size:10px; font-weight:bold; flex-shrink:0; }}
  .step-content {{ flex:1; }}
  .step-title {{ color:#e2e8f0; font-size:11px; font-weight:600; margin-bottom:3px; }}
  .step-desc {{ color:#64748b; font-size:10px; font-family:monospace; }}

  /* Table */
  table {{ width:100%; border-collapse:collapse; font-size:10px; font-family:monospace; margin:10px 0; }}
  th {{ background:#0f2744; color:#00f2ff; padding:8px 10px; text-align:left; border-bottom:1px solid #1e3a5f; }}
  td {{ padding:7px 10px; border-bottom:1px solid #0f2744; color:#94a3b8; }}
  tr:hover td {{ background:#0a1628; }}

  /* Badges */
  .badge {{ display:inline-block; padding:2px 8px; border-radius:3px; font-size:9px;
            font-family:monospace; font-weight:bold; margin:1px; }}
  .badge-free {{ background:#16a34a22; color:#16a34a; border:1px solid #16a34a44; }}
  .badge-pro {{ background:#0891b222; color:#0891b2; border:1px solid #0891b244; }}
  .badge-ent {{ background:#dc262622; color:#dc2626; border:1px solid #dc262644; }}

  /* Alert boxes */
  .alert {{ padding:10px 14px; border-radius:6px; font-size:11px; margin:10px 0; }}
  .alert-info {{ background:#0891b211; border-left:3px solid #0891b2; color:#7dd3fc; }}
  .alert-warn {{ background:#d9770611; border-left:3px solid #d97706; color:#fbbf24; }}
  .alert-tip  {{ background:#16a34a11; border-left:3px solid #16a34a; color:#86efac; }}

  /* Risk colors */
  .risk-crit {{ color:#dc2626; font-weight:bold; }}
  .risk-high {{ color:#ea580c; font-weight:bold; }}
  .risk-med  {{ color:#d97706; font-weight:bold; }}
  .risk-low  {{ color:#16a34a; font-weight:bold; }}

  /* Footer */
  .footer {{ margin-top:40px; padding-top:16px; border-top:1px solid #1e3a5f;
             text-align:center; color:#1e3a5f; font-size:9px; font-family:monospace; line-height:1.8; }}

  @page {{ margin:20px; size:A4; }}
  @media print {{ .page {{ padding:32px; }} }}
</style>
</head>
<body>
<div class="page">

<!-- ══ PORTADA ══ -->
<div class="cover">
  <div class="cover-logo">⬡ THREATRADAR OSINT PLATFORM</div>
  <div class="cover-title">MANUAL DE USUARIO</div>
  <div class="cover-sub">Guia completa de la plataforma de inteligencia de amenazas</div>
  <div>
    <span class="cover-badge">Version {version}</span>
    <span class="cover-badge">Sprint 27</span>
    <span class="cover-badge">Produccion</span>
  </div>
  <div class="cover-meta">
    Fecha de emision: {date_str}<br/>
    threatradar.viajeinteligencia.com &nbsp;·&nbsp; Confidencial — Uso autorizado
  </div>
</div>

<!-- ══ INDICE ══ -->
<div class="toc">
  <div class="toc-title">INDICE DE CONTENIDOS</div>
  {''.join(f'<div class="toc-item"><span><span class="toc-num">{i}.</span> {t}</span><span>{p}</span></div>' for i,(t,p) in enumerate([
    ('Introduccion y vision general', '2'),
    ('Acceso y autenticacion', '3'),
    ('Panel principal — Live Threat Map', '4'),
    ('Analisis OSINT de IPs y dominios', '5'),
    ('Modulos de reconocimiento CLI', '6'),
    ('Motor de IA — Gemini y Groq', '7'),
    ('Informes PDF profesionales', '8'),
    ('Auditoría, benchmark y comparativa', '9'),
    ('Alertas y notificaciones', '10'),
    ('Planes y facturacion', '11'),
    ('Preguntas frecuentes', '12'),
  ], 1))}
</div>

<!-- ══ 1. INTRODUCCION ══ -->
<h1>1. Introduccion y vision general</h1>
<p>
  <strong style="color:#00f2ff">ThreatRadar OSINT</strong> es una plataforma self-hosted de inteligencia de amenazas
  ciberneticas en tiempo real. Permite a equipos de seguridad, analistas SOC y profesionales IT
  monitorizar amenazas activas, analizar IPs y dominios sospechosos, y generar informes ejecutivos
  profesionales — todo desde una interfaz unificada.
</p>

<div class="card">
  <div class="card-title">CAPACIDADES PRINCIPALES</div>
  <div class="step">
    <div class="step-num">1</div>
    <div class="step-content">
      <div class="step-title">Mapa de amenazas en tiempo real</div>
      <div class="step-desc">200+ puntos C2 activos geolocalizados, actualizados cada 30 segundos desde feeds ThreatFox</div>
    </div>
  </div>
  <div class="step">
    <div class="step-num">2</div>
    <div class="step-content">
      <div class="step-title">Analisis OSINT multi-fuente</div>
      <div class="step-desc">AbuseIPDB, VirusTotal, GreyNoise, OTX, ThreatFox, crt.sh, InternetDB — correlacion automatica</div>
    </div>
  </div>
  <div class="step">
    <div class="step-num">3</div>
    <div class="step-content">
      <div class="step-title">Herramientas CLI integradas</div>
      <div class="step-desc">Nmap, Nikto, Subfinder, theHarvester, Nuclei, Amass, WAF detection, SSL analysis y mas</div>
    </div>
  </div>
  <div class="step">
    <div class="step-num">4</div>
    <div class="step-content">
      <div class="step-title">Informes PDF ejecutivos</div>
      <div class="step-desc">Assessment profesional con radar de riesgo, hallazgos priorizados y recomendaciones accionables</div>
    </div>
  </div>
  <div class="step">
    <div class="step-num">5</div>
    <div class="step-content">
      <div class="step-title">Motor IA (Gemini + Groq)</div>
      <div class="step-desc">Analisis automatico con score de amenaza, evidencia, riesgo y confianza — en espanol</div>
    </div>
  </div>
</div>

<div class="alert alert-warn">
  <strong>USO RESPONSABLE:</strong> ThreatRadar OSINT debe utilizarse exclusivamente sobre sistemas
  propios o con autorizacion expresa por escrito. El analisis no autorizado de sistemas ajenos
  puede constituir un delito. Consulte el panel Legal para informacion completa.
</div>

<!-- ══ 2. ACCESO ══ -->
<h1>2. Acceso y autenticacion</h1>
<p>Accede a la plataforma en <strong style="color:#00f2ff">threatradar.viajeinteligencia.com</strong></p>

<div class="card">
  <div class="card-title">PROCESO DE REGISTRO E INICIO DE SESION</div>
  <div class="step">
    <div class="step-num">1</div>
    <div class="step-content">
      <div class="step-title">Crear cuenta</div>
      <div class="step-desc">Haz clic en "Registrarse" e introduce tu email y contrasena. La cuenta se activa inmediatamente en plan Free.</div>
    </div>
  </div>
  <div class="step">
    <div class="step-num">2</div>
    <div class="step-content">
      <div class="step-title">Iniciar sesion</div>
      <div class="step-desc">Introduce tus credenciales. El sistema genera un token JWT valido 7 dias almacenado en localStorage.</div>
    </div>
  </div>
  <div class="step">
    <div class="step-num">3</div>
    <div class="step-content">
      <div class="step-title">Acceso sin cuenta (Demo)</div>
      <div class="step-desc">El endpoint demo permite 3 analisis gratuitos por dia sin registro. Ideal para evaluacion inicial.</div>
    </div>
  </div>
</div>

<table>
  <tr><th>Plan</th><th>Scans/dia</th><th>Historial</th><th>Informes PDF</th><th>IA avanzada</th><th>Precio</th></tr>
  <tr><td><span class="badge badge-free">FREE</span></td><td>3 (demo)</td><td>—</td><td>—</td><td>—</td><td>0 €</td></tr>
  <tr><td><span class="badge badge-pro">PRO</span></td><td>Ilimitado</td><td>30 dias</td><td>✓</td><td>✓</td><td>4,99 €/mes</td></tr>
  <tr><td><span class="badge badge-ent">ENTERPRISE</span></td><td>Ilimitado</td><td>90 dias</td><td>✓ Prioritario</td><td>✓ Completo</td><td>19,99 €/ano</td></tr>
</table>

<!-- ══ 3. MAPA ══ -->
<h1>3. Panel principal — Live Threat Map</h1>
<p>
  El mapa de amenazas en tiempo real es el elemento central de ThreatRadar. Muestra las
  <strong style="color:#ff2d55">amenazas C2 activas</strong> geolocalizadas en todo el mundo,
  actualizadas automaticamente cada 30 segundos.
</p>

<div class="card">
  <div class="card-title">ELEMENTOS DEL MAPA</div>
  <table>
    <tr><th>Elemento</th><th>Descripcion</th></tr>
    <tr><td style="color:#ff2d55">● Punto rojo</td><td>Amenaza CRITICAL — botnet C2, ransomware activo</td></tr>
    <tr><td style="color:#ff6b35">● Punto naranja</td><td>Amenaza HIGH — malware, exploit activo</td></tr>
    <tr><td style="color:#ffd60a">● Punto amarillo</td><td>Amenaza MEDIUM — phishing, scanner</td></tr>
    <tr><td style="color:#30d158">● Punto verde</td><td>Amenaza LOW — actividad sospechosa menor</td></tr>
    <tr><td style="color:#00f2ff">×N badge</td><td>Cluster de N IPs en la misma zona geografica</td></tr>
    <tr><td>Heatmap pais</td><td>Color de fondo por densidad de amenazas en ese pais</td></tr>
  </table>
</div>

<h2>Interaccion con el mapa</h2>
<div class="step">
  <div class="step-num">1</div>
  <div class="step-content">
    <div class="step-title">Click en un punto</div>
    <div class="step-desc">Abre popup con: IP, puerto, tipo de amenaza, malware, pais, fuente OSINT, coordenadas y timestamp</div>
  </div>
</div>
<div class="step">
  <div class="step-num">2</div>
  <div class="step-content">
    <div class="step-title">Boton TOP ASN</div>
    <div class="step-desc">Muestra los principales sistemas autonomos que alojan infraestructura C2, con malwares asociados</div>
  </div>
</div>
<div class="step">
  <div class="step-num">3</div>
  <div class="step-content">
    <div class="step-title">Boton ↻ (refresh)</div>
    <div class="step-desc">Actualiza manualmente los 200 puntos de amenaza sin esperar el ciclo automatico de 30s</div>
  </div>
</div>

<!-- ══ 4. ANALISIS OSINT ══ -->
<h1>4. Analisis OSINT de IPs y dominios</h1>
<p>
  El modulo de analisis OSINT consulta en paralelo multiples fuentes de inteligencia para
  obtener una evaluacion completa del objetivo en segundos.
</p>

<div class="card">
  <div class="card-title">FUENTES DE INTELIGENCIA INTEGRADAS</div>
  <table>
    <tr><th>Fuente</th><th>Tipo</th><th>Informacion proporcionada</th></tr>
    <tr><td style="color:#00f2ff">AbuseIPDB</td><td>Reputacion</td><td>Score de abuso 0-100, reportes de la comunidad, categorias de ataque</td></tr>
    <tr><td style="color:#00f2ff">VirusTotal</td><td>Antivirus</td><td>Detecciones de 70+ motores, categorias, votos comunidad</td></tr>
    <tr><td style="color:#00f2ff">GreyNoise</td><td>Clasificacion</td><td>Noise vs amenaza real, intencion, primera/ultima vez visto</td></tr>
    <tr><td style="color:#00f2ff">OTX AlienVault</td><td>IOC</td><td>Pulsos de inteligencia, indicadores de compromiso</td></tr>
    <tr><td style="color:#00f2ff">ThreatFox</td><td>C2/Malware</td><td>IOCs de malware activo, servidores C2, confianza</td></tr>
    <tr><td style="color:#00f2ff">URLHaus</td><td>URLs malware</td><td>URLs de distribucion de malware activas</td></tr>
    <tr><td style="color:#00f2ff">InternetDB</td><td>Puertos/Tags</td><td>Puertos abiertos, servicios, CVEs — datos pasivos sin escaneo</td></tr>
    <tr><td style="color:#00f2ff">crt.sh</td><td>Certificados</td><td>Subdominios expuestos via certificados TLS</td></tr>
    <tr><td style="color:#00f2ff">IPInfo</td><td>Geolocalizacion</td><td>Pais, ciudad, ISP, ASN, coordenadas</td></tr>
  </table>
</div>

<h2>Interpretacion del Score ThreatRadar</h2>
<table>
  <tr><th>Score</th><th>Nivel</th><th>Accion recomendada</th></tr>
  <tr><td class="risk-crit">85 — 100</td><td class="risk-crit">CRITICAL</td><td>Bloquear inmediatamente. Investigar compromiso. Notificar SOC.</td></tr>
  <tr><td class="risk-high">70 — 84</td><td class="risk-high">HIGH</td><td>Bloquear en firewall. Revisar logs de acceso. Alertar al equipo.</td></tr>
  <tr><td class="risk-med">40 — 69</td><td class="risk-med">MEDIUM</td><td>Monitorizar. Aplicar reglas WAF. Investigar contexto.</td></tr>
  <tr><td class="risk-low">0 — 39</td><td class="risk-low">LOW</td><td>Observar. Sin accion urgente. Mantener en watchlist.</td></tr>
</table>

<!-- ══ 5. MODULOS CLI ══ -->
<h1>5. Modulos de reconocimiento CLI</h1>
<p>
  ThreatRadar integra herramientas de reconocimiento profesionales ejecutadas directamente
  en el servidor. Solo deben usarse sobre sistemas propios o con autorizacion expresa.
</p>

<div class="card">
  <div class="card-title">HERRAMIENTAS DISPONIBLES Y VERIFICADAS</div>
  <table>
    <tr><th>Herramienta</th><th>Version</th><th>Funcion principal</th></tr>
    <tr><td style="color:#00f2ff">Nmap</td><td>7.94</td><td>Escaneo de puertos, deteccion de servicios y versiones</td></tr>
    <tr><td style="color:#00f2ff">Nikto</td><td>2.5.0</td><td>Vulnerabilidades web, archivos peligrosos, misconfigs</td></tr>
    <tr><td style="color:#00f2ff">DNSRecon</td><td>1.2.0</td><td>Enumeracion DNS, zone transfers, registros MX/NS/TXT</td></tr>
    <tr><td style="color:#00f2ff">theHarvester</td><td>4.11.1</td><td>Emails, subdominios, IPs desde motores de busqueda</td></tr>
    <tr><td style="color:#00f2ff">Subfinder</td><td>2.6.6</td><td>Descubrimiento pasivo de subdominios multi-fuente</td></tr>
    <tr><td style="color:#00f2ff">HTTPX</td><td>1.6.5</td><td>Deteccion servidores web, tecnologias, status codes</td></tr>
    <tr><td style="color:#00f2ff">Nuclei</td><td>3.3.0</td><td>Escaneo CVEs y misconfigs con templates actualizados</td></tr>
    <tr><td style="color:#00f2ff">OWASP Amass</td><td>4.2.0</td><td>Mapeo superficie de ataque, activos externos</td></tr>
    <tr><td style="color:#00f2ff">Masscan</td><td>1.3.2</td><td>Escaneo ultra-rapido de rangos de puertos TCP</td></tr>
    <tr><td style="color:#00f2ff">WAF Detection</td><td>wafw00f</td><td>Fingerprinting de Web Application Firewalls</td></tr>
    <tr><td style="color:#00f2ff">SSL/TLS</td><td>sslyze</td><td>Analisis cipher suites, certificados, vulnerabilidades</td></tr>
    <tr><td style="color:#00f2ff">Dig / WHOIS</td><td>sistema</td><td>Consultas DNS detalladas y registros de dominio</td></tr>
    <tr><td style="color:#00f2ff">Traceroute</td><td>sistema</td><td>Trazado de ruta de red con latencia por hop</td></tr>
  </table>
</div>

<div class="alert alert-tip">
  <strong>CONSEJO:</strong> Para dominios publicos, comienza siempre con herramientas pasivas
  (Subfinder, theHarvester, Dig, WHOIS) antes de herramientas activas (Nmap, Nikto, Nuclei).
  Las herramientas activas generan trafico detectable hacia el objetivo.
</div>

<!-- ══ 6. MOTOR IA ══ -->
<h1>6. Motor de IA — Gemini y Groq</h1>
<p>
  ThreatRadar incorpora analisis de inteligencia artificial para interpretar automaticamente
  los resultados OSINT y generar conclusiones accionables en espanol.
</p>

<div class="card">
  <div class="card-title">COMPONENTES DEL ANALISIS IA</div>
  <div class="step">
    <div class="step-num">1</div>
    <div class="step-content">
      <div class="step-title">Why Engine — Explicacion automatica</div>
      <div class="step-desc">Genera un resumen de por que una IP tiene el score asignado, con evidencias concretas de cada fuente OSINT</div>
    </div>
  </div>
  <div class="step">
    <div class="step-num">2</div>
    <div class="step-content">
      <div class="step-title">Premium AI Chat</div>
      <div class="step-desc">Chat interactivo con el analista IA para consultas especificas sobre el objetivo analizado</div>
    </div>
  </div>
  <div class="step">
    <div class="step-num">3</div>
    <div class="step-content">
      <div class="step-title">Reportes IA periodicos</div>
      <div class="step-desc">Informes diarios/semanales/mensuales con datos reales de la base de datos ThreatRadar, enviados por email o webhook</div>
    </div>
  </div>
</div>

<div class="alert alert-info">
  El sistema usa <strong>Gemini 2.0 Flash</strong> como motor primario y
  <strong>Groq llama-3.3-70b</strong> como fallback automatico. El label en el panel
  indica que motor esta activo en cada momento.
</div>

<!-- ══ 7. INFORMES PDF ══ -->
<h1>7. Informes PDF profesionales</h1>
<p>
  Los informes PDF de ThreatRadar son documentos ejecutivos completos pensados para
  ser presentados a clientes, direccion o equipos de seguridad. El foco esta en los
  resultados y recomendaciones, no en la mecanica tecnica.
</p>

<div class="card">
  <div class="card-title">ESTRUCTURA DEL INFORME</div>
  <div class="step">
    <div class="step-num">1</div>
    <div class="step-content">
      <div class="step-title">Portada ejecutiva</div>
      <div class="step-desc">ID unico, objetivo analizado, fecha, nivel de riesgo global con semaforo visual y score /100</div>
    </div>
  </div>
  <div class="step">
    <div class="step-num">2</div>
    <div class="step-content">
      <div class="step-title">Resumen ejecutivo</div>
      <div class="step-desc">Sintesis del analisis, numero de hallazgos por severidad y correlacion con base de datos ThreatRadar</div>
    </div>
  </div>
  <div class="step">
    <div class="step-num">3</div>
    <div class="step-content">
      <div class="step-title">Radar de riesgo — 8 dimensiones</div>
      <div class="step-desc">Grafico SVG: Exposicion Red, SSL/TLS, Subdominios, Email, WAF, Reputacion IP, Servicios Criticos, OSINT</div>
    </div>
  </div>
  <div class="step">
    <div class="step-num">4</div>
    <div class="step-content">
      <div class="step-title">Superficie de ataque</div>
      <div class="step-desc">Puertos y servicios abiertos, subdominios expuestos, emails publicos, estado WAF, analisis SSL</div>
    </div>
  </div>
  <div class="step">
    <div class="step-num">5</div>
    <div class="step-content">
      <div class="step-title">Hallazgos priorizados</div>
      <div class="step-desc">Lista ordenada CRITICAL→LOW con descripcion tecnica, impacto y accion correctiva concreta</div>
    </div>
  </div>
  <div class="step">
    <div class="step-num">6</div>
    <div class="step-content">
      <div class="step-title">Recomendaciones accionables</div>
      <div class="step-desc">Plan de accion priorizado con pasos especificos para reducir la superficie de ataque</div>
    </div>
  </div>
</div>

<div class="alert alert-tip">
  <strong>COMO GENERAR UN INFORME:</strong> Ve al panel "Reportes", seccion "Security Assessment Report",
  introduce el dominio o IP objetivo y pulsa "GENERAR PDF". El proceso tarda 60-120 segundos.
  El PDF se descarga automaticamente al completarse. Disponible en planes Pro y Enterprise.
</div>

<!-- ══ 8. AUDITORIA ══ -->
<h1>8. Auditoria, benchmark y comparativa</h1>
<p>El panel de Auditoria ofrece visibilidad completa sobre el estado del sistema y permite
   comparar el rendimiento de ThreatRadar contra otras plataformas del mercado.</p>

<div class="card">
  <div class="card-title">SECCION BENCHMARK — IP vs FUENTES OSINT</div>
  <p style="font-size:10px;color:#94a3b8">
    Introduce una IP y el sistema la consulta en paralelo contra todas las fuentes configuradas,
    midiendo latencia, cobertura y generando un score compuesto ThreatRadar. Util para validar
    que todas las integraciones estan operativas y comparar tiempos de respuesta.
  </p>
</div>

<div class="card">
  <div class="card-title">COMPARATIVA CON COMPETIDORES</div>
  <p style="font-size:10px;color:#94a3b8">
    Tabla de 14 criterios comparando ThreatRadar con VirusTotal, Shodan, Censys, AbuseIPDB y GreyNoise.
    ThreatRadar destaca en: live C2 feed, informes IA, WAF engine, herramientas CLI integradas,
    alertas Telegram, self-hosted y open source.
  </p>
</div>

<!-- ══ 9. ALERTAS ══ -->
<h1>9. Alertas y notificaciones</h1>

<table>
  <tr><th>Canal</th><th>Trigger</th><th>Configuracion</th></tr>
  <tr><td style="color:#00f2ff">Telegram</td><td>Score >= 70 (HIGH) o >= 85 (CRITICAL)</td><td>Automatico — configurado en servidor</td></tr>
  <tr><td style="color:#00f2ff">Discord</td><td>Generacion de informe periodico</td><td>Webhook URL en panel Reportes</td></tr>
  <tr><td style="color:#00f2ff">Slack</td><td>Generacion de informe periodico</td><td>Webhook URL en panel Reportes</td></tr>
  <tr><td style="color:#00f2ff">Email</td><td>Despacho de informe periodico</td><td>Email corporativo en panel Reportes</td></tr>
</table>

<!-- ══ 10. PLANES ══ -->
<h1>10. Planes y facturacion</h1>

<div class="card">
  <div class="card-title">PLAN FREE</div>
  <p style="font-size:10px;color:#94a3b8">
    3 analisis demo por dia sin registro. Acceso al mapa live y estadisticas publicas.
    Sin historial, sin informes PDF, sin acceso IA avanzado.
  </p>
</div>

<div class="card">
  <div class="card-title">PLAN PRO — 4,99 €/mes</div>
  <p style="font-size:10px;color:#94a3b8">
    Analisis OSINT ilimitado. Historial 30 dias. Informes PDF profesionales.
    Motor IA completo (Gemini + Groq). Alertas Telegram. Benchmark avanzado.
    Ideal para profesionales y consultores de seguridad independientes.
  </p>
</div>

<div class="card">
  <div class="card-title">PLAN ENTERPRISE — 19,99 €/ano</div>
  <p style="font-size:10px;color:#94a3b8">
    Todo lo de Pro mas: historial 90 dias, prioridad en generacion de informes PDF,
    acceso completo a todos los modulos CLI, soporte prioritario.
    Ideal para equipos SOC y empresas de ciberseguridad.
  </p>
</div>

<!-- ══ 11. FAQ ══ -->
<h1>11. Preguntas frecuentes</h1>

<div class="card">
  <h3>¿Puedo analizar cualquier IP o dominio?</h3>
  <p>Solo sistemas propios o con autorizacion expresa por escrito. El analisis no autorizado
  puede ser ilegal. Los modulos pasivos (WHOIS, DNS, crt.sh) son generalmente seguros;
  los activos (Nmap, Nikto, Nuclei) generan trafico hacia el objetivo.</p>
</div>

<div class="card">
  <h3>¿Con que frecuencia se actualiza el mapa de amenazas?</h3>
  <p>Los puntos C2 se actualizan cada hora desde ThreatFox. El mapa en la UI se refresca
  automaticamente cada 30 segundos o manualmente con el boton de refresh.</p>
</div>

<div class="card">
  <h3>¿Cuanto tarda en generarse un informe PDF?</h3>
  <p>Entre 60 y 120 segundos dependiendo del objetivo y la respuesta de las herramientas.
  El sistema ejecuta en paralelo nmap, subfinder, sslyze, wafw00f, theHarvester y WHOIS,
  luego compila y renderiza el PDF con WeasyPrint.</p>
</div>

<div class="card">
  <h3>¿Los datos son en tiempo real o historicos?</h3>
  <p>Los feeds C2 (ThreatFox) y URLHaus se actualizan cada hora/6 horas respectivamente.
  Las fuentes OSINT externas (AbuseIPDB, VirusTotal, etc.) se consultan en el momento
  del analisis. El mapa muestra las ultimas 24 horas de actividad.</p>
</div>

<div class="card">
  <h3>¿Que hacer si una IP aparece como CRITICAL en el mapa?</h3>
  <p>1. Verifica si esa IP ha intentado conectarse a tus sistemas (revisa logs de firewall).
  2. Bloquea la IP en tu WAF/firewall si hay actividad sospechosa.
  3. Usa el modulo de analisis para obtener contexto completo (malware asociado, ASN, historial).
  4. Genera un informe PDF para documentar el hallazgo.</p>
</div>

<!-- ══ FOOTER ══ -->
<div class="footer">
  ThreatRadar OSINT v{version} &mdash; Manual de Usuario<br/>
  Generado el {date_str} &mdash; threatradar.viajeinteligencia.com<br/>
  Uso exclusivo autorizado &mdash; Confidencial<br/>
  Para soporte: consulta la documentacion en GitHub o el panel de ayuda en la plataforma.
</div>

</div>
</body>
</html>"""

def main():
    parser = argparse.ArgumentParser(description='ThreatRadar Manual Generator')
    parser.add_argument('--output', default='dist/manual-threatradar-v2.pdf')
    args = parser.parse_args()

    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)

    html = build_html()
    html_path = out.with_suffix('.html')

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)

    try:
        from weasyprint import HTML
        HTML(filename=str(html_path)).write_pdf(str(out))
        size = out.stat().st_size // 1024
        print(f'[OK] Manual PDF: {out} ({size} KB)')
        html_path.unlink()
    except Exception as e:
        print(f'[WARN] WeasyPrint error: {e}')
        print(f'[OK] HTML disponible: {html_path}')

if __name__ == '__main__':
    main()
