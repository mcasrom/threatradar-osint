import React from 'react';

interface SecurityFaqProps {
  id?: string;
}

export const FAQs: React.FC<SecurityFaqProps> = ({ id }) => {
  const faqs = [
    {
      q: '¿Cómo funciona ThreatRadar OSINT?',
      a: 'ThreatRadar OSINT consolida herramientas OSINT de código abierto (Nmap, DNSRecon, theHarvester, Nuclei, etc.) en una interfaz unificada. Ejecuta escaneos reales contra objetivos autorizados, genera informes con IA Gemini y despacha reportes por email/webhooks.'
    },
    {
      q: '¿Cómo funciona el Motor Premium IA?',
      a: 'El motor se integra con Google Gemini 3.5 Flash. Analiza la organización e infraestructura declarada, genera queries para Shodan/LeakIX, y retorna tácticas de contingencia. Requiere GEMINI_API_KEY configurada en .env.'
    },
    {
      q: '¿Es posible automatizar los reportes?',
      a: 'Sí. Configure frecuencias diarias, semanales o mensuales. Los reportes se envían por SMTP (configurable) o webhooks a Discord/Slack/Telegram.'
    },
    {
      q: '¿Qué herramientas OSINT incluye?',
      a: '18 módulos: Nmap (puertos, vulns, OS), DNSRecon, DNSenum, theHarvester, WHOIS, Dig, SSLScan, Nikto, Subfinder, HTTPX, Nuclei, Amass, Shodan CLI, Masscan, WAFW00F, y más. Todos ejecutan comandos reales.'
    },
    {
      q: '¿Cómo protejo mi servidor?',
      a: 'Todas las API keys se almacenan en .env (ignorado por git). El servidor usa Helmet.js, rate limiting, validación de inputs, y CORS configurado. Los comandos OSINT sanitizan targets para prevenir inyección.'
    }
  ];

  return (
    <div id={id || "faqs-container"} className="space-y-4">
      <h3 className="text-xl font-semibold text-brand-cyan font-sans tracking-tight">Preguntas Frecuentes (FAQs)</h3>
      <div className="grid md:grid-cols-2 gap-4">
        {faqs.map((faq, index) => (
          <div key={index} className="p-4 bg-brand-panel border border-brand-border rounded-lg">
            <h4 className="text-sm font-medium text-white font-sans">{faq.q}</h4>
            <p className="mt-2 text-xs text-zinc-400 font-sans leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const About: React.FC = () => {
  return (
    <div id="about-container" className="p-6 bg-brand-panel border border-brand-border rounded-lg space-y-4">
      <h3 className="text-xl font-semibold text-brand-cyan font-sans tracking-tight">Sobre la Plataforma</h3>
      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
        ThreatRadar OSINT es una plataforma profesional de ciberseguridad diseñada para SOC y analistas de inteligencia. 
        Consolida herramientas OSINT de código abierto en una interfaz unificada con mapa de amenazas geolocalizado, 
        motor de análisis IA, y sistema de reportes automatizados.
      </p>
      <div className="grid md:grid-cols-3 gap-4 pt-2">
        <div className="p-3 bg-brand-header border border-brand-border rounded">
          <div className="text-brand-cyan font-mono text-xs font-bold">18+</div>
          <div className="text-[10px] text-zinc-500 mt-1">Módulos OSINT</div>
        </div>
        <div className="p-3 bg-brand-header border border-brand-border rounded">
          <div className="text-brand-green font-mono text-xs font-bold">Gemini 3.5</div>
          <div className="text-[10px] text-zinc-500 mt-1">Motor IA</div>
        </div>
        <div className="p-3 bg-brand-header border border-brand-border rounded">
          <div className="text-brand-red font-mono text-xs font-bold">Real-time</div>
          <div className="text-[10px] text-zinc-500 mt-1">Ejecución Nativa</div>
        </div>
      </div>
    </div>
  );
};

export const Methodology: React.FC = () => {
  return (
    <div id="methodology-container" className="p-6 bg-brand-panel border border-brand-border rounded-lg space-y-4">
      <h3 className="text-xl font-semibold text-brand-green font-sans tracking-tight">Metodología de Inteligencia</h3>
      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
        Operaciones basadas en el ciclo OSINT:
      </p>
      <div className="space-y-3 font-sans text-xs">
        <div className="flex gap-3">
          <span className="text-brand-green font-mono font-bold">01/</span>
          <div>
            <strong className="text-white block">Planificación:</strong>
            <span className="text-zinc-400">Definición de targets, activos web y firmas de red expuestas.</span>
          </div>
        </div>
        <div className="flex gap-3">
          <span className="text-brand-green font-mono font-bold">02/</span>
          <div>
            <strong className="text-white block">Recolección:</strong>
            <span className="text-zinc-400">Escaneos reales con Nmap, DNSRecon, theHarvester, Shodan, Nuclei.</span>
          </div>
        </div>
        <div className="flex gap-3">
          <span className="text-brand-green font-mono font-bold">03/</span>
          <div>
            <strong className="text-white block">Análisis IA:</strong>
            <span className="text-zinc-400">Conversión de resultados en informes estructurados con Gemini.</span>
          </div>
        </div>
        <div className="flex gap-3">
          <span className="text-brand-green font-mono font-bold">04/</span>
          <div>
            <strong className="text-white block">Despacho:</strong>
            <span className="text-zinc-400">Distribución por email/webhooks a equipos SOC.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Sources: React.FC = () => {
  const osintFeeds = [
    { name: 'Nmap', description: 'Escaneo de puertos, servicios y vulnerabilidades', status: 'Nativo' },
    { name: 'DNSRecon / DNSenum', description: 'Enumeración DNS y subdominios', status: 'Nativo' },
    { name: 'theHarvester', description: 'Recolección de emails y subdominios OSINT', status: 'Nativo' },
    { name: 'Shodan API', description: 'Indexador de dispositivos expuestos (requiere API key)', status: 'Opcional' },
    { name: 'AbuseIPDB', description: 'Reputación de IPs (requiere API key)', status: 'Opcional' },
    { name: 'VirusTotal', description: 'Análisis de malware y URLs (requiere API key)', status: 'Opcional' },
    { name: 'Nuclei', description: 'Escaneo de vulnerabilidades por templates', status: 'Nativo' },
    { name: 'Google Gemini', description: 'Motor IA para informes tácticos (requiere API key)', status: 'Opcional' }
  ];

  return (
    <div id="sources-container" className="p-6 bg-brand-panel border border-brand-border rounded-lg space-y-4">
      <h3 className="text-xl font-semibold text-zinc-300 font-sans tracking-tight">Fuentes de Datos y Feeds</h3>
      <div className="space-y-2">
        {osintFeeds.map((feed, idx) => (
          <div key={idx} className="flex justify-between items-center p-3 bg-brand-header border border-brand-border rounded">
            <div>
              <span className="text-white font-sans text-xs font-medium block">{feed.name}</span>
              <span className="text-[10px] text-zinc-500 font-sans block">{feed.description}</span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
              feed.status === 'Nativo' 
                ? 'text-brand-green bg-brand-green/10 border border-brand-green/30' 
                : 'text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/30'
            }`}>
              {feed.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
