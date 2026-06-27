import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface SecurityFaqProps {
  id?: string;
}

export const FAQs: React.FC<SecurityFaqProps> = ({ id }) => {
  const [open, setOpen] = useState<number | null>(null);

  const faqs = [
    {
      q: '¿Qué hace exactamente ThreatRadar OSINT?',
      a: 'ThreatRadar OSINT es una plataforma de inteligencia defensiva. Introduces una IP o dominio y el sistema consulta en paralelo 9 fuentes OSINT reales (AbuseIPDB, VirusTotal, ThreatFox, GreyNoise, OTX, InternetDB, crt.sh, IPInfo, URLHaus) para generar un score de amenaza 0-100 con análisis IA automático. No almacena tus búsquedas más allá del período de retención de tu plan.'
    },
    {
      q: '¿Qué IPs puedo analizar legalmente?',
      a: 'Puedes analizar: (1) IPs de tu propia infraestructura, (2) IPs públicas de terceros usando exclusivamente fuentes OSINT pasivas (sin escaneo activo), (3) IPs privadas RFC 1918 (192.168.x.x, 10.x.x.x, 172.16-31.x.x) con las herramientas activas (nmap, nikto) solo si tienes autorización del propietario de la red. IPv6 está soportado en las consultas OSINT pasivas. Las herramientas de escaneo activo (nmap, nikto, masscan) están restringidas por ToS a redes privadas o IP propia.'
    },
    {
      q: '¿Qué es el ThreatScore y cómo se calcula?',
      a: 'El ThreatScore (0-100) es un score compuesto que pondera: AbuseIPDB (40%) + VirusTotal detecciones maliciosas (30%) + OTX pulses (20%) + ThreatFox IOCs (10%). Umbrales: BAJO <30 · MEDIO 30-59 · ALTO 60-79 · CRÍTICO ≥80. El Why Engine genera automáticamente una conclusión en lenguaje natural explicando los factores que determinan el score.'
    },
    {
      q: '¿Qué es el historial rotacional premium?',
      a: 'Los usuarios Pro y Enterprise mantienen un historial de todos sus análisis con retención diferenciada: Free 7 días · Pro 90 días · Enterprise 365 días. El historial es rotacional — los análisis más antiguos se eliminan automáticamente al superar el límite. Puedes ver la evolución del score de una IP a lo largo del tiempo y comparar análisis pasados.'
    },
    {
      q: '¿Qué diferencia hay entre análisis pasivo y activo?',
      a: 'Pasivo: consulta bases de datos externas sin enviar tráfico al objetivo (AbuseIPDB, VirusTotal, ThreatFox, OTX, InternetDB). El objetivo nunca sabe que fue consultado. Activo: envía tráfico real al objetivo (nmap, nikto, dnsrecon). Requiere autorización expresa. ThreatRadar usa pasivo por defecto; las herramientas activas están en el módulo OSINT separado.'
    },
    {
      q: '¿Cómo funciona el Motor IA?',
      a: 'Usa Google Gemini con fallback automático a Groq/Llama-3.1 cuando Gemini alcanza su quota. El motor recibe los datos OSINT agregados y genera: resumen ejecutivo, evidencia específica, nivel de riesgo y confianza, comandos de mitigación. El análisis IA se genera automáticamente tras cada análisis OSINT completo.'
    },
    {
      q: '¿Puedo recibir alertas automáticas?',
      a: 'Sí. Las alertas se envían por Telegram (@ThreatRadar_Osint) y email (via Resend) cuando el score supera umbral HIGH (≥70) o CRITICAL (≥85). Los informes automáticos pueden programarse diariamente, semanalmente o mensualmente desde el módulo Despacho Automático.'
    },
    {
      q: '¿Mis datos están seguros?',
      a: 'Las contraseñas se almacenan con hash bcrypt. Las API keys en variables de entorno (.env), nunca en código. Comunicaciones cifradas TLS. Rate limiting por usuario. No vendemos datos a terceros. Los datos de pago los gestiona íntegramente Stripe — nunca tocamos números de tarjeta.'
    }
  ];

  return (
    <div id={id || 'faqs-container'} className="space-y-2">
      <h3 className="text-sm font-bold text-brand-cyan font-mono tracking-wider mb-3">PREGUNTAS FRECUENTES</h3>
      {faqs.map((faq, i) => (
        <div key={i} className="bg-brand-panel border border-brand-border rounded-lg overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex justify-between items-center px-4 py-3 text-left hover:bg-brand-bg/40 transition"
          >
            <span className="text-[12px] font-sans font-medium text-white">{faq.q}</span>
            {open === i
              ? <ChevronUp size={13} className="text-zinc-500 shrink-0 ml-2" />
              : <ChevronDown size={13} className="text-zinc-500 shrink-0 ml-2" />}
          </button>
          {open === i && (
            <div className="px-4 pb-4 text-[11px] text-zinc-400 font-sans leading-relaxed border-t border-brand-border/40 pt-3">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export const About: React.FC = () => {
  return (
    <div id="about-container" className="p-5 bg-brand-panel border border-brand-border rounded-lg space-y-4">
      <h3 className="text-sm font-bold text-brand-cyan font-mono tracking-wider">SOBRE LA PLATAFORMA</h3>
      <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
        ThreatRadar OSINT es una plataforma de inteligencia de amenazas defensiva para analistas de seguridad,
        equipos SOC y profesionales IT. Agrega datos de 9 fuentes OSINT reales en tiempo real, genera scores
        de amenaza compuestos y produce análisis IA automáticos. Opera sobre infraestructura propia (Hetzner,
        Alemania) con cumplimiento RGPD y bajo la política de uso aceptable de Hetzner.
      </p>
      <div className="grid grid-cols-2 gap-2 pt-1">
        {[
          { val: '9', label: 'Fuentes OSINT reales', color: 'text-brand-cyan' },
          { val: '3.500+', label: 'C2s rastreados live', color: 'text-red-400' },
          { val: '0-100', label: 'ThreatScore compuesto', color: 'text-yellow-400' },
          { val: 'Gemini+Groq', label: 'Motor IA con fallback', color: 'text-brand-green' },
        ].map(({ val, label, color }) => (
          <div key={label} className="p-3 bg-brand-bg border border-brand-border rounded">
            <div className={`font-mono text-sm font-bold ${color}`}>{val}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Methodology: React.FC = () => {
  return (
    <div id="methodology-container" className="p-5 bg-brand-panel border border-brand-border rounded-lg space-y-4">
      <h3 className="text-sm font-bold text-brand-green font-mono tracking-wider">METODOLOGÍA OSINT</h3>

      <div className="space-y-3 text-[11px] font-sans">
        {[
          {
            n: '01', title: 'Identificación del objetivo',
            desc: 'IP (v4 o v6) o dominio. El sistema valida el formato y comprueba que no sea RFC 1918 para análisis pasivo público.'
          },
          {
            n: '02', title: 'Consulta paralela de fuentes',
            desc: 'Se lanzan 9 consultas simultáneas: InternetDB, AbuseIPDB, VirusTotal, GreyNoise, OTX, ThreatFox, URLHaus, crt.sh, IPInfo. Tiempo medio: <2 segundos.'
          },
          {
            n: '03', title: 'Cálculo ThreatScore',
            desc: 'Score compuesto 0-100 ponderando reputación, detecciones AV, pulsos de inteligencia e IOCs activos. El Why Engine genera conclusión automática.'
          },
          {
            n: '04', title: 'Análisis IA',
            desc: 'Gemini (fallback Groq/Llama-3.1) analiza los datos agregados y genera informe estructurado con evidencia, riesgo, confianza y comandos de mitigación.'
          },
          {
            n: '05', title: 'Alertas y despacho',
            desc: 'Score HIGH/CRITICAL dispara alerta Telegram y email automáticos. Informes programables diarios/semanales/mensuales. Historial rotacional por plan.'
          },
        ].map(({ n, title, desc }) => (
          <div key={n} className="flex gap-3">
            <span className="text-brand-green font-mono font-bold shrink-0">{n}/</span>
            <div>
              <strong className="text-white block mb-0.5">{title}</strong>
              <span className="text-zinc-400 leading-relaxed">{desc}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-brand-border/40 pt-3">
        <div className="text-[10px] font-mono text-zinc-500 font-bold mb-2">IPs ANALIZABLES — NORMATIVA</div>
        <div className="space-y-1.5 text-[10px] font-mono">
          <div className="flex items-start gap-2">
            <CheckCircle size={10} className="text-green-400 shrink-0 mt-0.5" />
            <span className="text-zinc-300">IPs públicas cualquier origen — análisis <strong className="text-green-400">pasivo OSINT</strong> (sin tráfico al objetivo)</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle size={10} className="text-green-400 shrink-0 mt-0.5" />
            <span className="text-zinc-300">IPv6 — soportado en todas las fuentes OSINT pasivas</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle size={10} className="text-green-400 shrink-0 mt-0.5" />
            <span className="text-zinc-300">IPs propias / infraestructura propia — análisis activo y pasivo</span>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle size={10} className="text-yellow-400 shrink-0 mt-0.5" />
            <span className="text-zinc-400">IPs privadas RFC 1918 — herramientas activas solo con autorización del propietario de red</span>
          </div>
          <div className="flex items-start gap-2">
            <XCircle size={10} className="text-red-400 shrink-0 mt-0.5" />
            <span className="text-zinc-600">IPs de terceros sin autorización — escaneo activo <strong className="text-red-400">prohibido</strong> (Art. 197 bis CP)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Sources: React.FC = () => {
  const feeds = [
    { name: 'InternetDB (Shodan)',   desc: 'Puertos abiertos, servicios, CPEs — datos pasivos',           status: 'activo',    type: 'pasivo'  },
    { name: 'AbuseIPDB',            desc: 'Score de abuso 0-100, reportes de la comunidad',               status: 'activo',    type: 'pasivo'  },
    { name: 'VirusTotal',           desc: '70+ motores AV, reputación, detecciones maliciosas',           status: 'activo',    type: 'pasivo'  },
    { name: 'GreyNoise',            desc: 'Clasificación ruido de internet vs amenaza real',               status: 'activo',    type: 'pasivo'  },
    { name: 'AlienVault OTX',       desc: 'Pulsos de inteligencia colaborativa, reputación',              status: 'activo',    type: 'pasivo'  },
    { name: 'ThreatFox (abuse.ch)', desc: 'IOCs malware activo, C2 servers, familias de malware',         status: 'activo',    type: 'pasivo'  },
    { name: 'URLHaus (abuse.ch)',   desc: 'URLs distribución malware activas, actualización cada 6h',     status: 'activo',    type: 'pasivo'  },
    { name: 'crt.sh',               desc: 'Certificados TLS, subdominios expuestos',                      status: 'activo',    type: 'pasivo'  },
    { name: 'IPInfo',               desc: 'Geolocalización, ASN, ISP, coordenadas',                       status: 'activo',    type: 'pasivo'  },
    { name: 'nmap',                 desc: 'Escaneo puertos, detección OS y servicios',                    status: 'activo',    type: 'activo'  },
    { name: 'dnsrecon v1.1.5',      desc: 'Enumeración DNS, zone transfer, subdominios',                  status: 'activo',    type: 'activo'  },
    { name: 'nikto',                desc: 'Vulnerabilidades web, configuraciones inseguras',              status: 'activo',    type: 'activo'  },
    { name: 'whois / dig',          desc: 'Registros WHOIS y consultas DNS detalladas',                   status: 'activo',    type: 'activo'  },
    { name: 'traceroute',           desc: 'Trazado de ruta de red, identificación de hops',               status: 'activo',    type: 'activo'  },
    { name: 'masscan',              desc: 'Escaneo ultra-rápido — solo redes privadas autorizadas',       status: 'activo',    type: 'activo'  },
    { name: 'subfinder',            desc: 'Descubrimiento pasivo de subdominios',                         status: 'activo',    type: 'activo'  },
    { name: 'httpx',                desc: 'Detección servidores web, tecnologías, status codes',          status: 'activo',    type: 'activo'  },
    { name: 'wafw00f',              desc: 'Detección y fingerprinting de WAF',                            status: 'activo',    type: 'activo'  },
    { name: 'nuclei',               desc: 'Escaneo vulnerabilidades por templates CVE',                   status: 'pendiente', type: 'activo'  },
    { name: 'amass',                desc: 'Mapeo superficie de ataque y descubrimiento activos',          status: 'pendiente', type: 'activo'  },
    { name: 'theHarvester',         desc: 'Recolección emails, subdominios desde motores de búsqueda',   status: 'pendiente', type: 'activo'  },
    { name: 'Google Gemini',        desc: 'Motor IA análisis (fallback Groq/Llama-3.1)',                  status: 'activo',    type: 'ia'      },
  ];

  const pasivas  = feeds.filter(f => f.type === 'pasivo');
  const activas  = feeds.filter(f => f.type === 'activo');
  const ia       = feeds.filter(f => f.type === 'ia');

  const FeedRow = ({ f }: { f: typeof feeds[0] }) => (
    <div className="flex justify-between items-center p-2.5 bg-brand-bg border border-brand-border rounded">
      <div>
        <span className="text-white font-sans text-[11px] font-medium block">{f.name}</span>
        <span className="text-[10px] text-zinc-500 font-sans">{f.desc}</span>
      </div>
      <span className={`text-[9px] font-mono px-2 py-0.5 rounded shrink-0 ml-2 ${
        f.status === 'activo'
          ? 'text-green-400 bg-green-400/10 border border-green-400/30'
          : 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/30'
      }`}>
        {f.status === 'activo' ? '● ACTIVO' : '○ PENDIENTE'}
      </span>
    </div>
  );

  return (
    <div id="sources-container" className="p-5 bg-brand-panel border border-brand-border rounded-lg space-y-4">
      <h3 className="text-sm font-bold text-zinc-300 font-mono tracking-wider">FUENTES Y HERRAMIENTAS</h3>

      <div>
        <div className="text-[10px] font-mono text-brand-cyan font-bold mb-2">OSINT PASIVO — 9 fuentes (sin tráfico al objetivo)</div>
        <div className="space-y-1.5">{pasivas.map((f, i) => <FeedRow key={i} f={f} />)}</div>
      </div>

      <div>
        <div className="text-[10px] font-mono text-yellow-400 font-bold mb-2">HERRAMIENTAS ACTIVAS — requieren autorización</div>
        <div className="space-y-1.5">{activas.map((f, i) => <FeedRow key={i} f={f} />)}</div>
      </div>

      <div>
        <div className="text-[10px] font-mono text-purple-400 font-bold mb-2">MOTOR IA</div>
        <div className="space-y-1.5">{ia.map((f, i) => <FeedRow key={i} f={f} />)}</div>
      </div>
    </div>
  );
};
