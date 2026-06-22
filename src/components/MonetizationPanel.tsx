import React, { useState } from 'react';
import { Download, Terminal, Settings, CreditCard, Layers, ExternalLink, ShieldCheck } from 'lucide-react';

export const MonetizationPanel: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | 'enterprise'>('premium');
  const [isSimulatingSub, setIsSimulatingSub] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState<string>('mcasrom@gmail.com');

  const pricingModels = [
    {
      id: 'basic' as const,
      name: 'Freemium Standard',
      price: 'Free',
      period: 'para siempre',
      description: 'Acceso al mapa general básico y telemetría de red con límites de actualización.',
      benefits: [
        'Mapa en vivo (Leaflet Standard)',
        'Alertas generales aleatorias',
        'Hasta 2 escaneos Nmap diarios',
        'Consola OSINT visual estándar'
      ],
      badge: 'Básico'
    },
    {
      id: 'premium' as const,
      name: 'Cyber Sentinel PRO',
      price: '49 €',
      period: 'al mes',
      description: 'La experiencia completa con IA para análisis profundos de superficie de ataque Shodan.',
      benefits: [
        'Análisis ilimitado Gemini 3.5',
        'Exportador de Clips YouTube',
        'Secuencias automatizadas a correo/webhooks',
        'Simulador completo de inyección',
        'Descarga de la Guía de Usuario'
      ],
      badge: 'Más Popular',
      color: 'border-blue-505 bg-blue-952/10'
    },
    {
      id: 'enterprise' as const,
      name: 'SOC Multi-Tenant',
      price: '299 €',
      period: 'al mes',
      description: 'Configuración personalizada con Docker y SQLite persistente para infraestructuras masivas.',
      benefits: [
        'Despliegue multizona Hetzner/Vercel',
        'Soporte directo 1-to-1 con Ingenieros',
        'Webhooks redundantes e ilimitados',
        'Garantía SLA del 99.99%',
        'Firmas personalizables en reportes'
      ],
      badge: 'Empresas'
    }
  ];

  const handleCheckoutSim = async () => {
    setIsSimulatingSub(true);
    setCheckoutResult(null);
    try {
      const response = await fetch('/api/billing/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: selectedPlan.toUpperCase(),
          email: emailInput
        })
      });
      const data = await response.json();
      if (data.success) {
        setCheckoutResult(data.checkoutUrl);
      } else {
        setCheckoutResult('Error al configurar pasarela de pago.');
      }
    } catch {
      setCheckoutResult('No se pudo conectar con el backend de ThreatRadar.');
    } finally {
      setIsSimulatingSub(false);
    }
  };

  return (
    <div id="pricing-billing-panel" className="bg-brand-panel border border-brand-border p-6 rounded-lg space-y-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-brand-cyan tracking-tight flex items-center gap-2">
            <Layers size={18} /> MODELO DE MONETIZACIÓN Y PAGOS INTELIGENTES
          </h3>
          <p className="text-zinc-500 text-xs mt-1">
            Usa el simulador integrado para procesar pagos seguros en la plataforma Vercel/Fly.io usando Stripe.
          </p>
        </div>
        
        {/* Email target for simulation */}
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="Introduce tu correo SOC"
            className="bg-[#0b121f] w-full md:w-56 border border-brand-border rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-brand-cyan font-mono"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {pricingModels.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`cursor-pointer rounded-lg p-4 border transition flex flex-col justify-between ${
              selectedPlan === plan.id
                ? 'bg-brand-cyan/10 border-brand-cyan shadow-[0_0_15px_rgba(0,242,255,0.15)]'
                : 'bg-[#0b121f] border-brand-border hover:border-brand-cyan/40'
            }`}
          >
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold font-mono text-zinc-500 tracking-wide uppercase">{plan.badge}</span>
                {selectedPlan === plan.id && <span className="w-2.5 h-2.5 rounded-full bg-brand-cyan animate-pulse" />}
              </div>
              <h4 className="text-sm font-bold text-white">{plan.name}</h4>
              <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">{plan.description}</p>
              
              <div className="my-3 flex items-baseline gap-1.5 border-b border-brand-border pb-3">
                <span className="text-xl font-mono text-white font-bold">{plan.price}</span>
                <span className="text-[10px] text-zinc-500">{plan.period}</span>
              </div>

              <ul className="space-y-1.5">
                {plan.benefits.map((benefit, bIdx) => (
                  <li key={bIdx} className="text-[10px] text-zinc-300 flex items-center gap-1.5 font-sans">
                    <ShieldCheck size={12} className="text-brand-green flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Trigger checkout simulation */}
      <div className="bg-[#0b121f] border border-brand-border p-4 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="space-y-1 text-center md:text-left">
          <span className="text-xs font-bold text-white">
            Comprar suscripción para Plan: <span className="text-brand-cyan font-mono font-bold uppercase">{selectedPlan}</span>
          </span>
          <p className="text-[10px] text-zinc-400">
            Se generará una firma de checkout simulada de Stripe vinculada a {emailInput}.
          </p>
        </div>

        <button
          onClick={handleCheckoutSim}
          disabled={isSimulatingSub}
          className="w-full md:w-auto bg-brand-cyan hover:opacity-95 text-black text-xs font-bold px-5 py-2 rounded-md flex justify-center items-center gap-2 transition cursor-pointer"
        >
          <CreditCard size={14} />
          {isSimulatingSub ? 'Inicializando Pasarela...' : 'Simular Pago Stripe'}
        </button>
      </div>

      {checkoutResult && (
        <div className="p-3 bg-brand-cyan/15 border border-brand-cyan/40 rounded text-[10px] font-mono text-brand-cyan flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span>{checkoutResult.startsWith('http') ? '✔️ Pasarela configurada exitosamente.' : checkoutResult}</span>
          {checkoutResult.startsWith('http') && (
            <a
              href={checkoutResult}
              target="_blank"
              rel="noopener noreferrer"
              className="text-black bg-brand-cyan hover:opacity-90 px-3 py-1 rounded flex items-center gap-1 font-sans font-bold transition"
            >
              Completar Simulación <ExternalLink size={10} />
            </a>
          )}
        </div>
      )}
    </div>
  );
};
