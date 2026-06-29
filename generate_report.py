#!/usr/bin/env python3
"""
ThreatRadar OSINT — Professional Security Assessment Report Generator
Sprint 27 — Genera PDF ejecutivo completo desde datos reales + tools CLI
Uso: python3 generate_report.py --target <domain_or_ip> --output /tmp/report.pdf
"""

import argparse
import subprocess
import json
import sqlite3
import sys
import os
import re
import math
from datetime import datetime
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────
DB_PATH   = Path(__file__).parent / 'data' / 'threatradar.db'
GO_BIN    = '/home/deploy/go/bin'
LOCAL_BIN = '/home/deploy/.local/bin'
TOOL_PATHS = {
    'nmap':          'nmap',
    'theHarvester':  f'{LOCAL_BIN}/theHarvester',
    'subfinder':     f'{GO_BIN}/subfinder',
    'httpx':         f'{GO_BIN}/httpx',
    'wafw00f':       f'{GO_BIN}/wafw00f',
    'sslyze':        'python3 -m sslyze',
    'dig':           'dig',
    'whois':         'whois',
    'nuclei':        f'{GO_BIN}/nuclei',
}

COLORS = {
    'CRITICAL': '#dc2626',
    'HIGH':     '#ea580c',
    'MEDIUM':   '#d97706',
    'LOW':      '#16a34a',
    'INFO':     '#0891b2',
}

# ── Tool runners ──────────────────────────────────────────────────────────
def run(cmd, timeout=45):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return r.stdout + r.stderr
    except subprocess.TimeoutExpired:
        return '[TIMEOUT]'
    except Exception as e:
        return f'[ERROR] {e}'

def is_ip(target):
    return bool(re.match(r'^\d+\.\d+\.\d+\.\d+$', target))

# ── Recon functions ───────────────────────────────────────────────────────
def scan_ports(target):
    out = run(f'nmap -sV -sC --open -T4 -p 21,22,23,25,53,80,443,445,3306,3389,8080,8443 {target} 2>&1')
    ports = []
    services = []
    for line in out.splitlines():
        m = re.match(r'(\d+/\w+)\s+(\w+)\s+(\S+)\s*(.*)', line)
        if m and m.group(2) == 'open':
            ports.append({'port': m.group(1), 'state': m.group(2), 'service': m.group(3), 'version': m.group(4).strip()})
            services.append(m.group(3))
    return ports, services, out

def scan_dns(target):
    if is_ip(target): return {}, ''
    out = run(f'dig {target} ANY +short 2>&1')
    mx  = run(f'dig {target} MX +short 2>&1')
    ns  = run(f'dig {target} NS +short 2>&1')
    txt = run(f'dig {target} TXT +short 2>&1')
    return {'any': out, 'mx': mx, 'ns': ns, 'txt': txt}, out+mx+ns+txt

def scan_subdomains(target):
    if is_ip(target): return []
    out = run(f'{GO_BIN}/subfinder -d {target} -silent 2>&1', timeout=60)
    subs = [l.strip() for l in out.splitlines() if l.strip() and '.' in l and '[' not in l]
    return subs[:20]

def scan_ssl(target):
    host = target if is_ip(target) else target
    out = run(f'python3 -m sslyze {host}:443 --json - 2>&1', timeout=30)
    issues = []
    if 'VULNERABLE' in out: issues.append('Vulnerabilidad SSL detectada')
    if 'TLSv1.0' in out or 'TLSv1 ' in out: issues.append('TLS 1.0 habilitado (obsoleto)')
    if 'TLSv1.1' in out: issues.append('TLS 1.1 habilitado (obsoleto)')
    if 'certificate' in out.lower() and 'expired' in out.lower(): issues.append('Certificado expirado')
    return issues, out

def scan_waf(target):
    if is_ip(target): return 'No aplicable (IP directa)', ''
    url = f'https://{target}'
    out = run(f'{GO_BIN}/wafw00f {url} 2>&1', timeout=20)
    for line in out.splitlines():
        if 'is behind' in line.lower() or 'protected by' in line.lower():
            return line.strip(), out
    return 'No WAF detectado', out

def scan_harvester(target):
    if is_ip(target): return []
    out = run(f'{LOCAL_BIN}/theHarvester -d {target} -b crtsh,duckduckgo -l 50 2>&1', timeout=60)
    emails = list(set(re.findall(r'[\w.\-+]+@[\w.\-]+\.\w+', out)))
    return emails[:10]

def scan_whois(target):
    out = run(f'whois {target} 2>&1', timeout=15)
    info = {}
    for line in out.splitlines():
        for key in ['Registrar:', 'Creation Date:', 'Expiry Date:', 'Registrant Organization:', 'Name Server:']:
            if line.strip().startswith(key):
                info[key.rstrip(':')] = line.split(':', 1)[-1].strip()
                break
    return info, out

# ── SQLite context ────────────────────────────────────────────────────────
def get_db_context(target):
    ctx = {}
    if not DB_PATH.exists(): return ctx
    try:
        conn = sqlite3.connect(str(DB_PATH))
        c = conn.cursor()
        c.execute('SELECT COUNT(*) FROM threat_map')
        ctx['c2_total'] = c.fetchone()[0]
        c.execute('SELECT COUNT(*) FROM urlhaus_feed')
        ctx['urlhaus_total'] = c.fetchone()[0]
        # Check if target IP is in threat_map
        if is_ip(target):
            c.execute('SELECT threat_type, malware, source, first_seen FROM threat_map WHERE ip=? LIMIT 3', (target,))
            rows = c.fetchall()
            if rows:
                ctx['target_in_db'] = rows
        c.execute('SELECT org, COUNT(*) as n FROM threat_map GROUP BY org ORDER BY n DESC LIMIT 5')
        ctx['top_asns'] = c.fetchall()
        c.execute('SELECT country, COUNT(*) as n FROM threat_map GROUP BY country ORDER BY n DESC LIMIT 5')
        ctx['top_countries'] = c.fetchall()
        conn.close()
    except Exception as e:
        ctx['db_error'] = str(e)
    return ctx

# ── Risk scoring ──────────────────────────────────────────────────────────
def compute_risk(ports, ssl_issues, subs, emails, waf, target_in_db):
    scores = {
        'Exposicion Red':    min(100, len(ports) * 12),
        'SSL/TLS':           min(100, len(ssl_issues) * 25),
        'Subdominios':       min(100, len(subs) * 5),
        'Exposicion Email':  min(100, len(emails) * 15),
        'Proteccion WAF':    0 if 'No WAF' in waf else 100,
        'Reputacion IP':     100 if target_in_db else 10,
        'Servicios Criticos':min(100, sum(1 for p in ports if p['service'] in ['telnet','ftp','smb','rdp']) * 35),
        'Superficie OSINT':  min(100, (len(subs) + len(emails)) * 3),
    }
    # Invertir WAF (tener WAF es BUENO, sin WAF es riesgo)
    scores['Proteccion WAF'] = 100 - scores['Proteccion WAF']
    global_score = int(sum(scores.values()) / len(scores))
    if global_score >= 70:   level = 'CRITICAL'
    elif global_score >= 50: level = 'HIGH'
    elif global_score >= 30: level = 'MEDIUM'
    else:                    level = 'LOW'
    return scores, global_score, level

def build_findings(ports, ssl_issues, subs, emails, waf, db_ctx):
    findings = []
    # Puertos peligrosos
    dangerous = {'telnet': 'CRITICAL', 'ftp': 'HIGH', 'smb': 'CRITICAL', 'rdp': 'HIGH', 'mysql': 'HIGH'}
    for p in ports:
        svc = p['service'].lower()
        if svc in dangerous:
            findings.append({
                'severity': dangerous[svc],
                'title': f"Servicio peligroso expuesto: {p['service'].upper()} ({p['port']})",
                'detail': f"Versión: {p['version'] or 'desconocida'}. Servicio crítico accesible públicamente.",
                'fix': f"Deshabilitar o restringir acceso a {p['service'].upper()} mediante firewall. Permitir solo IPs de confianza."
            })
    # SSL
    for issue in ssl_issues:
        findings.append({
            'severity': 'HIGH',
            'title': f'Configuración SSL/TLS débil: {issue}',
            'detail': 'Protocolo obsoleto o configuración insegura detectada en la capa de transporte.',
            'fix': 'Deshabilitar TLS 1.0/1.1. Forzar TLS 1.2+. Renovar certificado si expirado.'
        })
    # Sin WAF
    if 'No WAF' in waf:
        findings.append({
            'severity': 'MEDIUM',
            'title': 'Sin protección WAF detectada',
            'detail': 'No se detectó ningún Web Application Firewall activo frente al objetivo.',
            'fix': 'Implementar WAF (Cloudflare, AWS WAF, ModSecurity). Configurar reglas OWASP Top 10.'
        })
    # Emails expuestos
    if emails:
        findings.append({
            'severity': 'MEDIUM',
            'title': f'{len(emails)} email(s) expuestos públicamente',
            'detail': f'Emails encontrados: {", ".join(emails[:5])}. Vector de phishing/spear phishing.',
            'fix': 'Ofuscar emails en web pública. Implementar SPF, DKIM, DMARC. Formación anti-phishing.'
        })
    # Target en threat DB
    if db_ctx.get('target_in_db'):
        for row in db_ctx['target_in_db']:
            findings.append({
                'severity': 'CRITICAL',
                'title': f'IP objetivo en base de datos de amenazas ThreatRadar',
                'detail': f'Tipo: {row[0]} | Malware: {row[1]} | Fuente: {row[2]} | Detectado: {row[3]}',
                'fix': 'Aislar inmediatamente. Investigar compromisos. Notificar al SOC. Revisar logs de acceso.'
            })
    # Muchos subdominios
    if len(subs) > 10:
        findings.append({
            'severity': 'LOW',
            'title': f'Superficie de ataque amplia: {len(subs)} subdominios detectados',
            'detail': 'Gran número de subdominios aumenta la superficie de ataque potencial.',
            'fix': 'Auditar subdominios activos. Eliminar subdominios no utilizados. Implementar wildcard cert.'
        })
    # Ordenar por severidad
    order = {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3, 'INFO': 4}
    findings.sort(key=lambda x: order.get(x['severity'], 5))
    return findings

# ── SVG Radar Chart ───────────────────────────────────────────────────────
def radar_svg(scores: dict) -> str:
    labels = list(scores.keys())
    values = [scores[l] / 100 for l in labels]
    n = len(labels)
    cx, cy, r = 200, 200, 140
    angles = [math.pi/2 + 2*math.pi*i/n for i in range(n)]  # start top

    def pt(angle, radius):
        return cx + radius*math.cos(angle), cy - radius*math.sin(angle)

    # Grid rings
    rings = ''
    for pct in [0.25, 0.5, 0.75, 1.0]:
        pts = [f'{pt(a, r*pct)[0]:.1f},{pt(a, r*pct)[1]:.1f}' for a in angles]
        rings += f'<polygon points="{" ".join(pts)}" fill="none" stroke="#1e3a5f" stroke-width="0.8"/>\n'

    # Axes
    axes = ''
    for a in angles:
        x2, y2 = pt(a, r)
        axes += f'<line x1="{cx}" y1="{cy}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#1e3a5f" stroke-width="0.8"/>\n'

    # Data polygon
    data_pts = [f'{pt(angles[i], r*values[i])[0]:.1f},{pt(angles[i], r*values[i])[1]:.1f}' for i in range(n)]
    data = f'<polygon points="{" ".join(data_pts)}" fill="#ff2d5533" stroke="#ff2d55" stroke-width="2"/>\n'

    # Dots
    dots = ''
    for i in range(n):
        x, y = pt(angles[i], r*values[i])
        dots += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="4" fill="#ff2d55"/>\n'

    # Labels
    lbls = ''
    for i, label in enumerate(labels):
        lx, ly = pt(angles[i], r + 22)
        anchor = 'middle'
        if lx < cx - 10: anchor = 'end'
        elif lx > cx + 10: anchor = 'start'
        short = label[:12]
        pct_val = int(values[i]*100)
        color = '#dc2626' if pct_val >= 70 else '#d97706' if pct_val >= 40 else '#16a34a'
        lbls += f'<text x="{lx:.1f}" y="{ly:.1f}" text-anchor="{anchor}" font-size="9" fill="{color}" font-family="monospace">{short}</text>\n'
        lbls += f'<text x="{lx:.1f}" y="{ly+11:.1f}" text-anchor="{anchor}" font-size="8" fill="#94a3b8" font-family="monospace">{pct_val}%</text>\n'

    return f'''<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" style="background:#050d1a;border-radius:8px">
{rings}{axes}{data}{dots}{lbls}
<text x="200" y="380" text-anchor="middle" font-size="10" fill="#334155" font-family="monospace">THREATRADAR RISK RADAR</text>
</svg>'''

# ── HTML Report ───────────────────────────────────────────────────────────
def build_html(target, ports, ssl_issues, subs, emails, waf, whois_info,
               dns_info, scores, global_score, risk_level, findings, db_ctx, radar) -> str:

    now = datetime.now()
    report_id = f'TR-{now.strftime("%Y%m%d-%H%M%S")}'
    risk_color = COLORS.get(risk_level, '#64748b')

    # Semáforo visual
    semaphore = ''
    for lvl, col in [('CRITICAL','#dc2626'),('HIGH','#ea580c'),('MEDIUM','#d97706'),('LOW','#16a34a')]:
        active = 'opacity:1;box-shadow:0 0 12px ' + col if lvl == risk_level else 'opacity:0.15'
        semaphore += f'<div style="width:32px;height:32px;border-radius:50%;background:{col};{active};margin:3px"></div>'

    # Findings HTML
    findings_html = ''
    if findings:
        for f in findings:
            fc = COLORS.get(f['severity'], '#64748b')
            findings_html += f'''
            <div style="border-left:3px solid {fc};padding:12px 16px;margin-bottom:10px;background:#0a1628;border-radius:0 6px 6px 0">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                    <span style="background:{fc};color:white;font-size:9px;padding:2px 7px;border-radius:3px;font-weight:bold">{f['severity']}</span>
                    <span style="color:#e2e8f0;font-size:12px;font-weight:600">{f['title']}</span>
                </div>
                <p style="color:#94a3b8;font-size:11px;margin:4px 0">{f['detail']}</p>
                <div style="margin-top:6px;padding:6px 10px;background:#0f1f35;border-radius:4px">
                    <span style="color:#22d3ee;font-size:10px">&#x1F527; ACCION: </span>
                    <span style="color:#cbd5e1;font-size:10px">{f['fix']}</span>
                </div>
            </div>'''
    else:
        findings_html = '<p style="color:#16a34a;font-size:12px">No se detectaron vulnerabilidades significativas.</p>'

    # Ports table
    ports_html = ''
    if ports:
        rows = ''
        for p in ports:
            svc_color = '#dc2626' if p['service'] in ['telnet','smb','rdp'] else '#94a3b8'
            rows += f'<tr><td style="color:#00f2ff">{p["port"]}</td><td style="color:#16a34a">OPEN</td><td style="color:{svc_color}">{p["service"]}</td><td style="color:#64748b;font-size:10px">{p["version"][:40] if p["version"] else "—"}</td></tr>'
        ports_html = f'''<table style="width:100%;border-collapse:collapse;font-family:monospace;font-size:11px">
            <tr style="color:#475569;border-bottom:1px solid #1e293b"><th style="text-align:left;padding:6px">PUERTO</th><th style="text-align:left;padding:6px">ESTADO</th><th style="text-align:left;padding:6px">SERVICIO</th><th style="text-align:left;padding:6px">VERSION</th></tr>
            {rows}</table>'''
    else:
        ports_html = '<p style="color:#475569;font-size:11px;font-family:monospace">No se encontraron puertos abiertos en el rango analizado.</p>'

    # Subdominios
    subs_html = ''
    if subs:
        subs_html = ''.join(f'<span style="display:inline-block;background:#0f2744;border:1px solid #1e3a5f;color:#94a3b8;font-size:10px;padding:3px 8px;border-radius:3px;margin:2px;font-family:monospace">{s}</span>' for s in subs)
    else:
        subs_html = '<span style="color:#475569;font-size:11px">No se encontraron subdominios.</span>'

    # Emails
    emails_html = ''
    if emails:
        emails_html = ''.join(f'<div style="font-family:monospace;font-size:11px;color:#fbbf24;padding:3px 0">{e}</div>' for e in emails)
    else:
        emails_html = '<span style="color:#475569;font-size:11px">No se encontraron emails expuestos.</span>'

    # WHOIS
    whois_html = ''
    for k, v in whois_info.items():
        whois_html += f'<div style="display:flex;gap:8px;padding:4px 0;border-bottom:1px solid #0f2744"><span style="color:#475569;font-size:10px;font-family:monospace;min-width:180px">{k}</span><span style="color:#94a3b8;font-size:10px;font-family:monospace">{v[:60]}</span></div>'

    # DB context
    db_html = ''
    if db_ctx.get('c2_total'):
        db_html = f'''
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:8px">
            <div style="background:#0a1628;border:1px solid #1e3a5f;border-radius:6px;padding:12px 20px;text-align:center">
                <div style="color:#dc2626;font-size:22px;font-weight:bold;font-family:monospace">{db_ctx["c2_total"]}</div>
                <div style="color:#475569;font-size:10px;font-family:monospace">C2s rastreados</div>
            </div>
            <div style="background:#0a1628;border:1px solid #1e3a5f;border-radius:6px;padding:12px 20px;text-align:center">
                <div style="color:#d97706;font-size:22px;font-weight:bold;font-family:monospace">{db_ctx["urlhaus_total"]}</div>
                <div style="color:#475569;font-size:10px;font-family:monospace">URLs malware</div>
            </div>
        </div>'''
        if db_ctx.get('target_in_db'):
            db_html += f'<div style="margin-top:10px;padding:10px;background:#2d0a0a;border:1px solid #dc2626;border-radius:6px;color:#fca5a5;font-size:11px;font-family:monospace">&#x26A0; ALERTA: El objetivo figura en la base de datos de amenazas ThreatRadar</div>'

    return f'''<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<style>
  * {{ margin:0;padding:0;box-sizing:border-box }}
  body {{ background:#050d1a;color:#e2e8f0;font-family:Arial,sans-serif;font-size:12px;line-height:1.5 }}
  .page {{ padding:40px;max-width:900px;margin:0 auto }}
  h1 {{ color:#00f2ff;font-family:monospace;font-size:22px;letter-spacing:2px }}
  h2 {{ color:#00f2ff;font-family:monospace;font-size:13px;letter-spacing:1px;text-transform:uppercase;
        border-bottom:1px solid #1e3a5f;padding-bottom:8px;margin:28px 0 14px }}
  h3 {{ color:#94a3b8;font-family:monospace;font-size:11px;margin-bottom:8px }}
  .card {{ background:#0a1628;border:1px solid #1e3a5f;border-radius:8px;padding:20px;margin-bottom:16px }}
  .badge {{ display:inline-block;padding:3px 10px;border-radius:4px;font-size:10px;font-weight:bold;font-family:monospace }}
  .meta {{ color:#475569;font-size:10px;font-family:monospace }}
  table td, table th {{ padding:6px 10px;border-bottom:1px solid #0f2744 }}
  @page {{ margin:20px;size:A4 }}
</style>
</head>
<body>
<div class="page">

<!-- PORTADA -->
<div style="text-align:center;padding:40px 0 30px;border-bottom:2px solid #1e3a5f;margin-bottom:30px">
  <div style="font-family:monospace;font-size:11px;color:#00f2ff;letter-spacing:3px;margin-bottom:8px">THREATRADAR OSINT</div>
  <h1>SECURITY ASSESSMENT REPORT</h1>
  <div style="margin:16px 0;font-family:monospace;font-size:13px;color:#94a3b8">
    Objetivo: <span style="color:#fbbf24">{target}</span>
  </div>
  <div class="meta">ID: {report_id} &nbsp;|&nbsp; {now.strftime('%d %B %Y — %H:%M UTC')} &nbsp;|&nbsp; CONFIDENCIAL</div>
  <div style="margin-top:20px;display:inline-flex;gap:6px;align-items:center">
    <span class="meta">NIVEL DE RIESGO GLOBAL:</span>
    <span class="badge" style="background:{risk_color};color:white;font-size:13px;padding:5px 18px">{risk_level}</span>
    <span style="color:{risk_color};font-size:22px;font-weight:bold;font-family:monospace">{global_score}/100</span>
  </div>
  <div style="display:flex;justify-content:center;margin-top:14px">{semaphore}</div>
</div>

<!-- RESUMEN EJECUTIVO -->
<h2>1. Resumen Ejecutivo</h2>
<div class="card">
  <p style="font-size:12px;color:#cbd5e1;line-height:1.8">
    Se ha realizado un análisis de seguridad automatizado sobre el objetivo <strong style="color:#fbbf24">{target}</strong>
    con fecha {now.strftime('%d/%m/%Y')}. El análisis cubre reconocimiento de puertos y servicios, enumeración DNS,
    detección de subdominios, análisis SSL/TLS, detección de WAF, recolección OSINT (emails, hosts)
    y correlación con la base de datos de amenazas ThreatRadar en tiempo real.
  </p>
  <p style="margin-top:10px;font-size:12px;color:#cbd5e1">
    Se han identificado <strong style="color:{risk_color}">{len(findings)} hallazgos</strong>:
    {sum(1 for f in findings if f["severity"]=="CRITICAL")} críticos,
    {sum(1 for f in findings if f["severity"]=="HIGH")} altos,
    {sum(1 for f in findings if f["severity"]=="MEDIUM")} medios,
    {sum(1 for f in findings if f["severity"]=="LOW")} bajos.
  </p>
  {db_html}
</div>

<!-- RADAR CHART -->
<h2>2. Mapa de Riesgo — Radar de Exposicion</h2>
<div class="card" style="text-align:center">
  {radar}
  <p style="color:#334155;font-size:10px;font-family:monospace;margin-top:8px">
    Mayor area = mayor exposicion/riesgo. Objetivo: minimizar el area del poligono rojo.
  </p>
</div>

<!-- SUPERFICIE DE ATAQUE -->
<h2>3. Superficie de Ataque</h2>

<div class="card">
  <h3>Puertos y Servicios ({len(ports)} encontrados)</h3>
  {ports_html}
</div>

<div class="card">
  <h3>Subdominios ({len(subs)} encontrados)</h3>
  {subs_html}
</div>

<div class="card">
  <h3>Emails Expuestos ({len(emails)} encontrados)</h3>
  {emails_html}
</div>

<div class="card">
  <h3>WAF / Proteccion Web</h3>
  <span style="font-family:monospace;font-size:11px;color:{'#16a34a' if 'No WAF' not in waf else '#d97706'}">{waf}</span>
</div>

<!-- SSL -->
<div class="card">
  <h3>SSL/TLS ({len(ssl_issues)} problemas)</h3>
  {''.join(f"<div style='color:#d97706;font-size:11px;font-family:monospace;padding:3px 0'>&#x26A0; {i}</div>" for i in ssl_issues) if ssl_issues else '<span style="color:#16a34a;font-size:11px">Configuracion SSL correcta o no analizable.</span>'}
</div>

<!-- WHOIS -->
{f'<div class="card"><h3>Informacion WHOIS</h3>{whois_html}</div>' if whois_info else ''}

<!-- HALLAZGOS -->
<h2>4. Hallazgos y Vulnerabilidades</h2>
<div class="card">
  {findings_html}
</div>

<!-- RECOMENDACIONES -->
<h2>5. Recomendaciones Prioritarias</h2>
<div class="card">
  {''.join(f"""
  <div style="display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #0f2744">
    <span style="min-width:24px;height:24px;background:{COLORS.get(f['severity'],'#475569')};color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;font-family:monospace;flex-shrink:0">{i+1}</span>
    <div>
      <div style="color:#e2e8f0;font-size:11px;font-weight:600;margin-bottom:3px">{f['title']}</div>
      <div style="color:#64748b;font-size:10px;font-family:monospace">{f['fix']}</div>
    </div>
  </div>""" for i, f in enumerate(findings)) if findings else '<p style="color:#16a34a;font-size:11px">Sin acciones urgentes requeridas.</p>'}
</div>

<!-- FOOTER -->
<div style="margin-top:40px;padding-top:20px;border-top:1px solid #1e3a5f;text-align:center">
  <div style="color:#1e3a5f;font-size:9px;font-family:monospace;line-height:1.8">
    THREATRADAR OSINT &mdash; threatradar.viajeinteligencia.com<br>
    Informe generado automaticamente el {now.strftime('%d/%m/%Y a las %H:%M UTC')}<br>
    ID: {report_id} &mdash; USO EXCLUSIVO AUTORIZADO &mdash; CONFIDENCIAL<br>
    Este informe solo debe analizarse sobre sistemas propios o con autorizacion expresa por escrito.
  </div>
</div>

</div>
</body>
</html>'''

# ── Main ──────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description='ThreatRadar OSINT — Security Report Generator')
    parser.add_argument('--target', required=True, help='Dominio o IP objetivo')
    parser.add_argument('--output', default='/tmp/threatradar_report.pdf', help='Ruta PDF de salida')
    parser.add_argument('--html-only', action='store_true', help='Generar solo HTML (sin PDF)')
    args = parser.parse_args()

    target = args.target.strip().lower().replace('https://','').replace('http://','').rstrip('/')

    print(f'[ThreatRadar] Iniciando analisis sobre: {target}')
    print(f'[ThreatRadar] Informe: {args.output}')
    print()

    print('[1/8] Escaneo de puertos (nmap)...')
    ports, services, _ = scan_ports(target)
    print(f'      {len(ports)} puertos abiertos')

    print('[2/8] Reconocimiento DNS...')
    dns_info, _ = scan_dns(target)

    print('[3/8] Enumeracion de subdominios (subfinder)...')
    subs = scan_subdomains(target)
    print(f'      {len(subs)} subdominios')

    print('[4/8] Analisis SSL/TLS (sslyze)...')
    ssl_issues, _ = scan_ssl(target)
    print(f'      {len(ssl_issues)} problemas SSL')

    print('[5/8] Deteccion WAF (wafw00f)...')
    waf, _ = scan_waf(target)
    print(f'      {waf[:60]}')

    print('[6/8] OSINT emails/hosts (theHarvester)...')
    emails = scan_harvester(target)
    print(f'      {len(emails)} emails encontrados')

    print('[7/8] WHOIS...')
    whois_info, _ = scan_whois(target)

    print('[8/8] Correlacion base de datos ThreatRadar...')
    db_ctx = get_db_context(target)

    print()
    print('[*] Calculando scores y generando informe...')
    scores, global_score, risk_level = compute_risk(
        ports, ssl_issues, subs, emails, waf, db_ctx.get('target_in_db'))
    findings = build_findings(ports, ssl_issues, subs, emails, waf, db_ctx)
    radar    = radar_svg(scores)
    html     = build_html(target, ports, ssl_issues, subs, emails, waf,
                          whois_info, dns_info, scores, global_score,
                          risk_level, findings, db_ctx, radar)

    # HTML temporal
    html_path = args.output.replace('.pdf', '.html')
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)

    if args.html_only:
        print(f'[OK] HTML generado: {html_path}')
        return

    # PDF con WeasyPrint
    try:
        from weasyprint import HTML, CSS
        HTML(filename=html_path).write_pdf(args.output)
        size_kb = Path(args.output).stat().st_size // 1024
        print(f'[OK] PDF generado: {args.output} ({size_kb} KB)')
        print(f'[OK] Hallazgos: {len(findings)} | Score: {global_score}/100 | Riesgo: {risk_level}')
    except ImportError:
        print(f'[WARN] WeasyPrint no disponible. HTML guardado en: {html_path}')
    except Exception as e:
        print(f'[ERROR] PDF: {e}')
        print(f'[OK] HTML disponible: {html_path}')

if __name__ == '__main__':
    main()
