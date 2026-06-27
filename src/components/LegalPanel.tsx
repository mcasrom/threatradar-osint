import React, { useState } from 'react';
import { Shield, AlertTriangle, Scale, Server, Eye, Ban, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

const SECTIONS = [
  {
    id: 'tos',
    icon: Scale,
    title: 'Términos de Servicio',
    color: 'text-brand-cyan',
    border: 'border-brand-cyan/30',
    content: [
      {
        heading: '1. Aceptación de los términos',
        text: 'El uso de ThreatRadar OSINT implica la aceptación íntegra de estos términos. Si no los aceptas, no debes usar el servicio. Estos términos se rigen por la legislación española y europea aplicable.'
      },
      {
        heading: '2. Uso permitido',
        text: 'ThreatRadar OSINT está diseñado exclusivamente para:\n• Análisis defensivo de infraestructura propia\n• Investigación de amenazas sobre IPs/dominios de tu titularidad\n• Auditorías de seguridad con autorización escrita del propietario\n• Educación e investigación en ciberseguridad\n• Inteligencia de fuentes abiertas (OSINT) con fines legítimos'
      },
      {
        heading: '3. Uso prohibido',
        text: 'Queda expresamente prohibido:\n• Escanear o analizar sistemas sin autorización del propietario\n• Usar los resultados para planificar o ejecutar ataques\n• Eludir medidas de seguridad de terceros\n• Automatizar consultas masivas sin acuerdo previo\n• Revender o redistribuir datos obtenidos sin autorización\n• Usar el servicio para actividades ilegales bajo cualquier jurisdicción'
      },
      {
        heading: '4. Limitación de responsabilidad',
        text: 'ThreatRadar OSINT agrega datos de fuentes públicas (AbuseIPDB, VirusTotal, ThreatFox, etc.). No garantizamos la exactitud, completitud o vigencia de los datos. El usuario es el único responsable de las decisiones tomadas basándose en los resultados. No nos hacemos responsables de daños directos, indirectos o consecuentes derivados del uso del servicio.'
      },
      {
        heading: '5. Planes y facturación',
        text: 'Los planes de pago se facturan mensualmente vía Stripe. Puedes cancelar en cualquier momento; el acceso se mantiene hasta fin del período facturado. No se emiten reembolsos por períodos parciales. Los precios pueden cambiar con 30 días de preaviso.'
      },
      {
        heading: '6. Modificaciones',
        text: 'Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios materiales se notificarán por email con al menos 15 días de antelación. El uso continuado del servicio tras la entrada en vigor de los cambios implica su aceptación.'
      }
    ]
  },
  {
    id: 'hetzner',
    icon: Server,
    title: 'Límites de infraestructura (Hetzner)',
    color: 'text-yellow-400',
    border: 'border-yellow-400/30',
    content: [
      {
        heading: 'Política de uso aceptable de Hetzner',
        text: 'ThreatRadar OSINT opera en servidores de Hetzner Online GmbH (Alemania). Debemos cumplir su AUP (Acceptable Use Policy), lo que impone las siguientes restricciones técnicas en el servicio:'
      },
      {
        heading: 'Restricciones de herramientas de escaneo activo',
        text: '• nmap: restringido a IPs privadas (RFC 1918) o a la IP pública del propio usuario autenticado\n• masscan: deshabilitado para uso externo — solo uso interno de mantenimiento\n• nikto: permitido únicamente contra dominios/IPs de titularidad acreditada del usuario\n• traceroute/dig/whois: sin restricciones — herramientas pasivas de consulta\n• dnsrecon: permitido, consultas DNS pasivas\n• nuclei: templates de detección solo, nunca de explotación'
      },
      {
        heading: 'Volumen de tráfico',
        text: 'Los planes limitan el número de consultas API para evitar generar tráfico saliente masivo desde los servidores de Hetzner:\n• Free: 3 análisis/día\n• Pro: 100 análisis/día\n• Enterprise: 500 análisis/día\nSuperado el límite, las consultas se encolan para el día siguiente.'
      },
      {
        heading: 'Prohibiciones absolutas en infraestructura Hetzner',
        text: '• Escaneo de rangos IP externos no autorizados\n• Ataques de denegación de servicio (DDoS) o similares\n• Envío masivo de emails (spam)\n• Hosting de contenido ilegal\n• Minería de criptomonedas\nEl incumplimiento puede resultar en la suspensión inmediata del servidor por Hetzner, lo que afectaría a todos los usuarios del servicio.'
      }
    ]
  },
  {
    id: 'privacy',
    icon: Eye,
    title: 'Privacidad y datos',
    color: 'text-green-400',
    border: 'border-green-400/30',
    content: [
      {
        heading: 'Datos que recopilamos',
        text: '• Email y contraseña (hash bcrypt) para autenticación\n• IPs analizadas y timestamps de consultas (historial de scans)\n• Plan de suscripción y datos de facturación (gestionados por Stripe)\n• Logs de acceso del servidor Nginx (IP, timestamp, endpoint)'
      },
      {
        heading: 'Datos que NO recopilamos',
        text: '• No vendemos datos a terceros\n• No usamos cookies de seguimiento publicitario\n• No compartimos resultados OSINT de usuarios con otras partes\n• No almacenamos datos de tarjeta de crédito (gestión íntegra por Stripe)'
      },
      {
        heading: 'Retención de datos',
        text: '• Free: historial de scans 7 días\n• Pro: historial de scans 90 días\n• Enterprise: historial de scans 365 días\nCuenta inactiva >12 meses: datos eliminados con 30 días de preaviso por email.'
      },
      {
        heading: 'RGPD — Derechos del usuario',
        text: 'Como usuario en la UE tienes derecho a:\n• Acceso: solicitar todos tus datos — endpoint GET /api/user/export\n• Rectificación: corregir datos incorrectos\n• Supresión: eliminar tu cuenta y todos tus datos\n• Portabilidad: exportar tus datos en formato JSON\nPara ejercer estos derechos: threatradar-osint@viajeinteligencia.com'
      },
      {
        heading: 'Base legal del tratamiento',
        text: 'Tratamos tus datos bajo las siguientes bases legales (RGPD Art. 6):\n• Ejecución de contrato: para prestarte el servicio\n• Interés legítimo: seguridad del sistema y prevención de fraude\n• Consentimiento: comunicaciones de marketing (opt-in explícito)'
      }
    ]
  },
  {
    id: 'methodology',
    icon: Shield,
    title: 'Metodología OSINT',
    color: 'text-purple-400',
    border: 'border-purple-400/30',
    content: [
      {
        heading: 'Fuentes de inteligencia integradas',
        text: '• InternetDB (Shodan): puertos abiertos, servicios, CPEs — datos pasivos\n• AbuseIPDB: reportes de abuso de la comunidad, score 0-100\n• VirusTotal: análisis de 70+ motores antivirus y reputación\n• GreyNoise: clasificación de ruido de internet vs amenaza real\n• AlienVault OTX: pulsos de inteligencia de amenazas colaborativa\n• ThreatFox (abuse.ch): IOCs de malware activo, C2 servers\n• URLHaus (abuse.ch): URLs de distribución de malware activas\n• crt.sh: certificados TLS y subdominios expuestos\n• IPInfo: geolocalización y datos ASN'
      },
      {
        heading: 'Cálculo del ThreatScore (0-100)',
        text: 'El score compuesto se calcula ponderando:\n• AbuseIPDB score (peso 40%): reputación de abuso histórico\n• VirusTotal detecciones (peso 30%): motores que marcan la IP como maliciosa\n• OTX pulses (peso 20%): número de feeds de inteligencia que la mencionan\n• ThreatFox IOCs (peso 10%): presencia en feeds de malware activo\n\nUmbral CRÍTICO ≥80 · ALTO 60-79 · MEDIO 30-59 · BAJO <30'
      },
      {
        heading: 'Why Engine — conclusiones automáticas',
        text: 'El motor de conclusiones analiza los datos OSINT agregados y genera:\n• Resumen ejecutivo de la amenaza en lenguaje natural\n• Evidencia específica que justifica el score\n• Nivel de riesgo contextualizado\n• Nivel de confianza basado en la cobertura de fuentes\nEl análisis IA usa Gemini (Google) con fallback a Groq/Llama para garantizar disponibilidad.'
      },
      {
        heading: 'Limitaciones y advertencias',
        text: '• Los datos OSINT son indicativos, no concluyentes\n• Una IP con score alto puede ser un falso positivo (ej: Tor exit nodes legítimos)\n• Los datos tienen latencia: pueden reflejar el estado de hace horas o días\n• No realizar acciones bloqueantes automáticas basadas únicamente en el score\n• Siempre contrastar con contexto operacional propio antes de actuar'
      }
    ]
  },
  {
    id: 'prohibited',
    icon: Ban,
    title: 'Conductas prohibidas y consecuencias',
    color: 'text-red-400',
    border: 'border-red-400/30',
    content: [
      {
        heading: 'Detección de abuso',
        text: 'Monitorizamos activamente patrones de uso abusivo:\n• Rate limiting por usuario y por IP\n• Detección de consultas automatizadas masivas\n• Alertas ante patrones de escaneo sistemático\n• Logs de auditoría de todas las consultas API'
      },
      {
        heading: 'Consecuencias del incumplimiento',
        text: '• Aviso: primera infracción leve — notificación por email\n• Suspensión temporal: infracción grave o reincidencia — 30 días\n• Cancelación permanente: infracción muy grave — sin reembolso\n• Reporte a autoridades: actividades que constituyan delito bajo la LO 1/2015 (Código Penal) o Directiva NIS2\n\nEn España, el acceso no autorizado a sistemas informáticos está tipificado en el Art. 197 bis CP con penas de hasta 2 años de prisión.'
      },
      {
        heading: 'Jurisdicción',
        text: 'Estos términos se rigen por la ley española. Para cualquier disputa, las partes se someten a los juzgados y tribunales de Murcia (España), con renuncia expresa a cualquier otro fuero que pudiera corresponderles.'
      }
    ]
  }
];

export function LegalPanel() {
  const [openSection, setOpenSection] = useState<string | null>('tos');

  return (
    <div className="space-y-3 max-w-3xl mx-auto">

      <div className="bg-brand-panel border border-brand-border rounded-lg p-4">
        <div className="flex items-center gap-3 mb-1">
          <Scale size={18} className="text-brand-cyan" />
          <h2 className="text-sm font-bold text-white font-mono tracking-wider">LEGAL & TÉRMINOS DE SERVICIO</h2>
          <span className="text-[9px] bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 rounded font-mono px-2 py-0.5">v1.0 — jun 2026</span>
        </div>
        <p className="text-[11px] text-zinc-400 font-mono">
          Marco legal, límites de uso, privacidad y metodología de ThreatRadar OSINT.
          Última actualización: 27 de junio de 2026.
        </p>
      </div>

      {SECTIONS.map(({ id, icon: Icon, title, color, border, content }) => {
        const open = openSection === id;
        return (
          <div key={id} className={`bg-brand-panel border ${border} rounded-lg overflow-hidden`}>
            <button
              onClick={() => setOpenSection(open ? null : id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-brand-bg/40 transition"
            >
              <div className="flex items-center gap-3">
                <Icon size={15} className={color} />
                <span className={`text-[12px] font-bold font-mono ${color}`}>{title}</span>
              </div>
              {open
                ? <ChevronUp size={14} className="text-zinc-500" />
                : <ChevronDown size={14} className="text-zinc-500" />}
            </button>

            {open && (
              <div className="px-4 pb-4 space-y-4 border-t border-brand-border/40 pt-3">
                {content.map(({ heading, text }, i) => (
                  <div key={i}>
                    <div className={`text-[11px] font-bold font-mono ${color} mb-1.5 flex items-center gap-1.5`}>
                      <CheckCircle size={10} /> {heading}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono leading-relaxed whitespace-pre-line pl-4">
                      {text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="text-[10px] text-zinc-600 font-mono text-center py-2">
        ThreatRadar OSINT · SIEG ecosystem · threatradar-osint@viajeinteligencia.com · Murcia, España
      </div>
    </div>
  );
}
