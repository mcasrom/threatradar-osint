#!/usr/bin/env python3
"""
Sprint 11 - Patch server.ts
1. Reemplaza computeThreatScore con algoritmo spec del wayahead
2. Mejora endpoint /api/osint/analyze: prompt 5 dimensiones + devuelve threatScore
"""

import sys

SERVER_PATH = '/home/miguelc/threatradar-osint/server.ts'  # ajusta si es diferente

# ── 1. NUEVA computeThreatScore ─────────────────────────────────────────────
OLD_COMPUTE = '''function computeThreatScore(osintData: any): { score: number; level: string; factors: string[] } {
  let score = 0;
  const factors: string[] = [];
  const highRiskCountries = ['CN', 'RU', 'KP', 'IR', 'SY', 'CU'];

  const abuse = osintData?.abuseipdb?.data;
  if (abuse) {
    if (abuse.abuseConfidenceScore > 75) { score += 35; factors.push("AbuseIPDB: confianza abuso critica (" + abuse.abuseConfidenceScore + "%)"); }
    else if (abuse.abuseConfidenceScore > 50) { score += 25; factors.push("AbuseIPDB: confianza abuso alta (" + abuse.abuseConfidenceScore + "%)"); }
    else if (abuse.abuseConfidenceScore > 20) { score += 10; factors.push("AbuseIPDB: abuso moderado (" + abuse.abuseConfidenceScore + "%)"); }
    if (abuse.totalReports > 100) { score += 10; factors.push("AbuseIPDB: " + abuse.totalReports + " reportes totales"); }
    if (abuse.isTor) { score += 20; factors.push("AbuseIPDB: nodo TOR detectado"); }
  }

  const gn = osintData?.greynoise;
  if (gn) {
    if (gn.noise === true) { score += 25; factors.push("GreyNoise: IP escaneando internet activamente (noise=true)"); }
    if (gn.riot === false && gn.noise === true) { score += 10; factors.push("GreyNoise: no es infraestructura conocida legitima"); }
    if (gn.classification === 'malicious') { score += 30; factors.push("GreyNoise: clasificada como MALICIOSA"); }
  }

  const vt = osintData?.virustotal?.data?.attributes;
  if (vt) {
    if (vt.reputation < -10) { score += 25; factors.push("VirusTotal: reputacion muy negativa (" + vt.reputation + ")"); }
    else if (vt.reputation < -5) { score += 15; factors.push("VirusTotal: reputacion negativa (" + vt.reputation + ")"); }
    const stats = vt.last_analysis_stats;
    if (stats && stats.malicious > 0) { score += 20; factors.push("VirusTotal: " + stats.malicious + " motores detectan malware"); }
  }

  const country = osintData?.abuseipdb?.data?.countryCode || osintData?.ipinfo?.country;
  if (country && highRiskCountries.includes(country)) {
    score += 15;
    factors.push("Pais de alto riesgo: " + country);
  }

  const shodan = osintData?.shodan;
  if (shodan && !shodan.error) {
    if (shodan.ports && shodan.ports.length > 10) { score += 10; factors.push("Shodan: " + shodan.ports.length + " puertos abiertos"); }
    if (shodan.vulns && Object.keys(shodan.vulns).length > 0) { score += 25; factors.push("Shodan: " + Object.keys(shodan.vulns).length + " vulnerabilidades conocidas (CVEs)"); }
  }

  score = Math.min(100, score);
  let level = 'BAJO';
  if (score >= 75) level = 'CRITICO';
  else if (score >= 50) level = 'ALTO';
  else if (score >= 25) level = 'MEDIO';

  return { score, level, factors };
}'''

NEW_COMPUTE = '''// ── ThreatRadar Risk Score ────────────────────────────────────────────────
// Spec: wayahead Sprint 11 — algoritmo propio combinando 5 fuentes
function computeThreatScore(osintData: any): {
  score: number;
  level: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO';
  factors: string[];
  mitigationCommands: { label: string; cmd: string }[];
} {
  let score = 0;
  const factors: string[] = [];
  const HIGH_RISK_COUNTRIES = ['CN', 'RU', 'KP', 'IR', 'SY', 'CU', 'VE', 'BY'];

  // ── Factor 1: AbuseIPDB (max 30 pts según spec) ───────────────────────
  const abuse = osintData?.abuseipdb?.data;
  if (abuse) {
    if (abuse.abuseConfidenceScore > 50) {
      score += 30;
      factors.push(`AbuseIPDB: confianza de abuso ${abuse.abuseConfidenceScore}% (>50% → +30pts)`);
    } else if (abuse.abuseConfidenceScore > 20) {
      score += 10;
      factors.push(`AbuseIPDB: abuso moderado ${abuse.abuseConfidenceScore}%`);
    }
    if (abuse.isTor) { score += 15; factors.push('AbuseIPDB: nodo TOR activo detectado'); }
    if (abuse.totalReports > 100) { score += 5; factors.push(`AbuseIPDB: ${abuse.totalReports} reportes acumulados`); }
  }

  // ── Factor 2: GreyNoise noise=true (max 25 pts) ───────────────────────
  const gn = osintData?.greynoise;
  if (gn && !gn.error) {
    if (gn.noise === true) {
      score += 25;
      factors.push('GreyNoise: noise=true — IP escaneando internet activamente (+25pts)');
    }
    if (gn.riot === false) {
      score += 10;
      factors.push('GreyNoise: riot=false — no es infraestructura legítima conocida (+10pts)');
    }
    if (gn.classification === 'malicious') {
      score += 20;
      factors.push('GreyNoise: clasificación MALICIOSA explícita');
    }
  }

  // ── Factor 3: VirusTotal reputation < -5 (max 20 pts) ────────────────
  const vt = osintData?.virustotal?.data?.attributes;
  if (vt) {
    if (vt.reputation < -5) {
      score += 20;
      factors.push(`VirusTotal: reputación ${vt.reputation} (<-5 → +20pts)`);
    }
    const stats = vt.last_analysis_stats;
    if (stats?.malicious > 0) {
      score += Math.min(15, stats.malicious * 3);
      factors.push(`VirusTotal: ${stats.malicious} motores AV detectan actividad maliciosa`);
    }
  }

  // ── Factor 4: País de alta amenaza (15 pts) ───────────────────────────
  const country = osintData?.abuseipdb?.data?.countryCode
    || osintData?.ipinfo?.country
    || osintData?.shodan?.country_code;
  if (country && HIGH_RISK_COUNTRIES.includes(country)) {
    score += 15;
    factors.push(`Origen de alto riesgo geopolítico: ${country} (+15pts)`);
  }

  // ── Factor 5: GreyNoise riot=false (ya contado arriba como +10) ───────
  // ── Shodan: infraestructura expuesta ──────────────────────────────────
  const shodan = osintData?.shodan;
  if (shodan && !shodan.error) {
    if (shodan.vulns && Object.keys(shodan.vulns).length > 0) {
      score += 25;
      factors.push(`Shodan: ${Object.keys(shodan.vulns).length} CVEs conocidos en puertos expuestos`);
    }
    if (shodan.ports?.length > 10) {
      score += 10;
      factors.push(`Shodan: superficie de ataque amplia — ${shodan.ports.length} puertos abiertos`);
    }
    // Botnet inference: puertos C2 comunes
    const C2_PORTS = [4444, 1337, 8080, 8443, 6667, 6666, 31337, 12345];
    const c2Hits = (shodan.ports || []).filter((p: number) => C2_PORTS.includes(p));
    if (c2Hits.length > 0) {
      score += 20;
      factors.push(`Botnet/C2 inference: puertos ${c2Hits.join(', ')} asociados a C2/RAT`);
    }
  }

  score = Math.min(100, score);
  let level: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO' = 'BAJO';
  if (score >= 75) level = 'CRITICO';
  else if (score >= 50) level = 'ALTO';
  else if (score >= 25) level = 'MEDIO';

  // ── Comandos de mitigación según nivel ───────────────────────────────
  const ip = osintData?.ip || '<IP>';
  const mitigationCommands: { label: string; cmd: string }[] = [
    {
      label: 'iptables — DROP entrada',
      cmd: `iptables -I INPUT -s ${ip} -j DROP`
    },
    {
      label: 'iptables — DROP salida',
      cmd: `iptables -I OUTPUT -d ${ip} -j DROP`
    },
    {
      label: 'fail2ban — ban manual',
      cmd: `fail2ban-client set sshd banip ${ip}`
    },
    {
      label: 'fail2ban — verificar estado',
      cmd: `fail2ban-client status sshd | grep ${ip}`
    },
    {
      label: 'Guardar reglas iptables',
      cmd: `iptables-save > /etc/iptables/rules.v4`
    },
  ];

  if (level === 'CRITICO' || level === 'ALTO') {
    mitigationCommands.push(
      {
        label: 'SIEM Splunk — query IOC',
        cmd: `index=* src_ip="${ip}" OR dest_ip="${ip}" | stats count by sourcetype, src_ip, dest_ip | sort -count`
      },
      {
        label: 'ELK — query Kibana',
        cmd: `{"query":{"bool":{"should":[{"term":{"source.ip":"${ip}"}},{"term":{"destination.ip":"${ip}"}}]}}}`
      }
    );
  }

  return { score, level, factors, mitigationCommands };
}'''

# ── 2. NUEVO PROMPT 5 DIMENSIONES + devolver threatScore ────────────────────
OLD_ENDPOINT = '''app.post('/api/osint/analyze', authMiddleware, async (req: any, res) => {
  const { osintData } = req.body;
  if (!osintData || !osintData.ip) return res.status(400).json({ error: 'osintData requerido' });

  const prompt = `Eres un analista de ciberseguridad experto. Analiza estos resultados OSINT para la IP ${osintData.ip} y genera un informe de inteligencia de amenazas en español.

DATOS OSINT:
${JSON.stringify(osintData, null, 2)}

Genera un informe estructurado con estas secciones:
1. RESUMEN EJECUTIVO — riesgo general (CRITICO/ALTO/MEDIO/BAJO) y puntuacion 0-100
2. HALLAZGOS POR FUENTE — analiza cada fuente disponible (Shodan, AbuseIPDB, VirusTotal, GreyNoise, IPInfo)
3. INDICADORES DE COMPROMISO — IPs, puertos, servicios o patrones sospechosos detectados
4. CONTEXTO DE AMENAZA — tipo de actor, motivacion probable, infraestructura asociada
5. RECOMENDACIONES — acciones concretas de mitigacion y bloqueo

Se tecnico, preciso y conciso. Usa markdown.`;

  // Intentar Gemini primero, fallback a Groq
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: { systemInstruction: 'Eres un analista OSINT militar. Responde siempre en espanol con precision tecnica.' }
      });
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || response.text || '';
      return res.json({ analysis: text, ip: osintData.ip, timestamp: new Date().toISOString(), engine: 'gemini' });
    } catch (geminiErr: any) {
      console.warn('Gemini failed, falling back to Groq:', geminiErr.message?.slice(0, 100));
    }
  }

  // Fallback Groq
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Eres un analista OSINT experto. Responde siempre en espanol con precision tecnica.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2048,
        temperature: 0.3
      });
      const text = completion.choices?.[0]?.message?.content || '';
      return res.json({ analysis: text, ip: osintData.ip, timestamp: new Date().toISOString(), engine: 'groq' });
    } catch (groqErr: any) {
      return res.status(500).json({ error: 'Error en Groq', detail: groqErr.message });
    }
  }

  res.status(503).json({ error: 'No hay motor IA disponible. Configura GEMINI_API_KEY o GROQ_API_KEY.' });
});'''

NEW_ENDPOINT = '''app.post('/api/osint/analyze', authMiddleware, async (req: any, res) => {
  const { osintData } = req.body;
  if (!osintData || !osintData.ip) return res.status(400).json({ error: 'osintData requerido' });

  // Calcular ThreatScore antes del análisis IA
  const threatScore = computeThreatScore(osintData);

  // Construir resumen de fuentes disponibles para el prompt
  const sourceSummary = [
    osintData.shodan && !osintData.shodan.error
      ? `SHODAN: ${osintData.shodan.ports?.length || 0} puertos, org="${osintData.shodan.org}", vulns=${Object.keys(osintData.shodan.vulns || {}).join(', ') || 'ninguna'}`
      : 'SHODAN: no disponible',
    osintData.abuseipdb?.data
      ? `ABUSEIPDB: score=${osintData.abuseipdb.data.abuseConfidenceScore}%, reports=${osintData.abuseipdb.data.totalReports}, isTor=${osintData.abuseipdb.data.isTor}`
      : 'ABUSEIPDB: no disponible',
    osintData.greynoise && !osintData.greynoise.error
      ? `GREYNOISE: noise=${osintData.greynoise.noise}, riot=${osintData.greynoise.riot}, classification=${osintData.greynoise.classification || 'unknown'}`
      : 'GREYNOISE: no disponible',
    osintData.virustotal?.data?.attributes
      ? `VIRUSTOTAL: reputation=${osintData.virustotal.data.attributes.reputation}, malicious=${osintData.virustotal.data.attributes.last_analysis_stats?.malicious || 0}`
      : 'VIRUSTOTAL: no disponible',
    osintData.ipinfo
      ? `IPINFO: org="${osintData.ipinfo.org}", country=${osintData.ipinfo.country}, city=${osintData.ipinfo.city}`
      : 'IPINFO: no disponible',
  ].join('\\n');

  const prompt = `Eres un analista de inteligencia de amenazas (CTI) de nivel senior. Analiza la IP ${osintData.ip} con los datos OSINT proporcionados y genera un informe técnico en español.

RIESGO CALCULADO: ${threatScore.level} (${threatScore.score}/100)
FACTORES DETECTADOS: ${threatScore.factors.join(' | ')}

FUENTES OSINT DISPONIBLES:
${sourceSummary}

DATOS COMPLETOS:
${JSON.stringify(osintData, null, 2).slice(0, 6000)}

Genera el informe con EXACTAMENTE estas 5 secciones en markdown:

## 1. BOTNET FINGERPRINT
Analiza si esta IP pertenece a infraestructura de botnet o C2. Busca patrones Mirai (telnet/SSH brute, puertos 23/2323), Emotet (HTTPS no estándar, puertos 8080/8443/449), Cobalt Strike (beacon en 443/80 con jitter), u otras familias. Indica ASN, rangos de red conocidos por hosting de C2, y si los puertos abiertos coinciden con perfiles de malware conocidos. Si no hay datos suficientes, indica qué herramienta adicional se necesitaría.

## 2. THREAT ACTOR ATTRIBUTION
Cruza ASN, organización, país, rangos IP y comportamiento con grupos APT conocidos. Considera:
- APT28/Fancy Bear (RU): spearphishing, ports 443/80, ASNs rusos
- Lazarus Group (KP): cryptomining, puertos no estándar, hosting anónimo
- APT41 (CN): supply chain, puertos altos efímeros
- Grupos iranís APT33/34: infraestructura VPS barata
Si no hay atribución clara, indica "No atribuible con datos actuales" y explica por qué.

## 3. INDICADORES DE COMPROMISO (IOCs)
Lista estructurada de IOCs encontrados:
- IPs y rangos relacionados
- Puertos y protocolos sospechosos
- CVEs activos si Shodan reporta vulnerabilidades
- Hashes o firmas si VirusTotal los reporta
- Patrones de comportamiento (frecuencia de escaneo, categorías de abuso)

## 4. NMAP INFERENCE (sin ejecución activa)
Basándote en los puertos Shodan y banners disponibles, infiere el perfil de servicios:
- Sistema operativo probable (TTL, banners, stack TCP)
- Servicios corriendo (versiones si hay banner grabbing en Shodan)
- Vectores de ataque probables desde los servicios expuestos
- Indica claramente que es inferencia pasiva, no escaneo activo

## 5. ACCIONES DE MITIGACIÓN
Proporciona comandos CONCRETOS y ejecutables, no genéricos:
- Regla iptables específica para esta IP
- Comando fail2ban para ban inmediato
- Query SIEM (Splunk o ELK) para correlacionar esta IP en logs históricos
- Si hay CVEs: enlace directo NVD y comando de verificación
- Recomendación de threat hunting: qué más buscar en la red interna`;

  // Intentar Gemini primero, fallback a Groq
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: { systemInstruction: 'Eres un analista CTI senior. Responde siempre en español con precisión técnica. No añadas disclaimers. Sé directo y accionable.' }
      });
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || response.text || '';
      return res.json({ analysis: text, threatScore, ip: osintData.ip, timestamp: new Date().toISOString(), engine: 'gemini' });
    } catch (geminiErr: any) {
      console.warn('Gemini failed, falling back to Groq:', geminiErr.message?.slice(0, 100));
    }
  }

  // Fallback Groq
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Eres un analista CTI senior especializado en threat intelligence. Responde SIEMPRE en español. Sé técnico, preciso y accionable. No añadas disclaimers legales ni advertencias genéricas.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 3000,
        temperature: 0.2
      });
      const text = completion.choices?.[0]?.message?.content || '';
      return res.json({ analysis: text, threatScore, ip: osintData.ip, timestamp: new Date().toISOString(), engine: 'groq' });
    } catch (groqErr: any) {
      return res.status(500).json({ error: 'Error en Groq', detail: groqErr.message });
    }
  }

  res.status(503).json({ error: 'No hay motor IA disponible. Configura GEMINI_API_KEY o GROQ_API_KEY.' });
});'''

# ── Aplicar patches ──────────────────────────────────────────────────────────
try:
    with open(SERVER_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
except FileNotFoundError:
    print(f"ERROR: No se encuentra {SERVER_PATH}")
    print("Ajusta SERVER_PATH en la línea 10 del script.")
    sys.exit(1)

if OLD_COMPUTE not in content:
    print("ERROR: No se encontró el bloque computeThreatScore original.")
    print("Puede que ya esté aplicado el patch, o el archivo cambió.")
    sys.exit(1)

content = content.replace(OLD_COMPUTE, NEW_COMPUTE)
print("✓ computeThreatScore reemplazada")

if OLD_ENDPOINT not in content:
    print("ERROR: No se encontró el bloque /api/osint/analyze original.")
    sys.exit(1)

content = content.replace(OLD_ENDPOINT, NEW_ENDPOINT)
print("✓ /api/osint/analyze mejorado con prompt 5 dimensiones + threatScore")

with open(SERVER_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\n✅ server.ts actualizado correctamente en {SERVER_PATH}")
print("   - computeThreatScore: algoritmo spec wayahead Sprint 11")
print("   - /api/osint/analyze: prompt 5 dimensiones (botnet/APT/IOC/nmap/mitigation)")
print("   - Respuesta incluye { analysis, threatScore, ip, timestamp, engine }")
print("   - Groq model: llama-3.3-70b-versatile (más capaz para CTI)")
