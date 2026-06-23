import React from 'react';
import { Shield, Zap, Building2, Check, X } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    period: 'siempre gratis',
    icon: Shield,
    color: 'brand-green',
    borderColor: 'border-brand-green/30',
    bgColor: 'bg-brand-green/5',
    badgeColor: 'bg-brand-green/20 text-brand-green border-brand-green/30',
    features: [
      { text: '10 scans OSINT / mes', ok: true },
      { text: 'Shodan + AbuseIPDB', ok: true },
      { text: 'Mapa de amenazas en tiempo real', ok: true },
      { text: 'Alert Simulator', ok: true },
      { text: 'VirusTotal + Hunter.io', ok: false },
      { text: 'GreyNoise + IPInfo', ok: false },
      { text: 'Informes IA (Gemini)', ok: false },
      { text: 'Despacho automático email', ok: false },
      { text: 'API access', ok: false },
    ],
    cta: 'Empezar gratis',
    ctaStyle: 'border border-brand-green/40 text-brand-green hover:bg-brand-green/10',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '29',
    period: 'mes',
    icon: Zap,
    color: 'brand-cyan',
    borderColor: 'border-brand-cyan/50',
    bgColor: 'bg-brand-cyan/5',
    badgeColor: 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30',
    features: [
      { text: 'Scans OSINT ilimitados', ok: true },
      { text: 'Shodan + AbuseIPDB', ok: true },
      { text: 'Mapa de amenazas en tiempo real', ok: true },
      { text: 'Alert Simulator', ok: true },
      { text: 'VirusTotal + Hunter.io', ok: true },
      { text: 'GreyNoise + IPInfo', ok: true },
      { text: 'Informes IA (Gemini)', ok: true },
      { text: 'Despacho automático email', ok: true },
      { text: 'API access', ok: false },
    ],
    cta: 'Activar Pro',
    ctaStyle: 'bg-brand-cyan text-brand-bg font-bold hover:opacity-90 shadow-lg shadow-brand-cyan/20',
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '99',
    period: 'mes',
    icon: Building2,
    color: 'brand-yellow',
    borderColor: 'border-brand-yellow/30',
    bgColor: 'bg-brand-yellow/5',
    badgeColor: 'bg-brand-yellow/20 text-brand-yellow border-brand-yellow/30',
    features: [
      { text: 'Scans OSINT ilimitados', ok: true },
      { text: 'Shodan + AbuseIPDB', ok: true },
      { text: 'Mapa de amenazas en tiempo real', ok: true },
      { text: 'Alert Simulator', ok: true },
      { text: 'VirusTotal + Hunter.io', ok: true },
      { text: 'GreyNoise + IPInfo', ok: true },
      { text: 'Informes IA (Gemini)', ok: true },
      { text: 'Despacho automático email', ok: true },
      { text: 'API access + webhooks + prioridad', ok: true },
    ],
    cta: 'Contactar ventas',
    ctaStyle: 'border border-brand-yellow/40 text-brand-yellow hover:bg-brand-yellow/10',
    highlight: false,
  },
];

interface PricingPageProps {
  onNavigateToAuth?: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigateToAuth }) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 py-6">
        <span className="text-[10px] font-mono text-brand-cyan tracking-widest uppercase border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-1 rounded-full">
          Planes y Precios
        </span>
        <h2 className="text-2xl font-bold text-white font-sans mt-3">
          Inteligencia OSINT para cada equipo
        </h2>
        <p className="text-sm text-zinc-400 max-w-xl mx-auto">
          Desde análisis individual hasta operaciones enterprise. Todas las fuentes OSINT reales, sin datos simulados.
        </p>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <div
              key={plan.id}
              className={`relative rounded-xl border ${plan.borderColor} ${plan.bgColor} p-6 flex flex-col gap-5 ${
                plan.highlight ? 'ring-1 ring-brand-cyan/40 shadow-xl shadow-brand-cyan/10' : ''
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[9px] font-bold font-mono bg-brand-cyan text-brand-bg px-3 py-1 rounded-full uppercase tracking-wider">
                    Más popular
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="space-y-2">
                <div className={`inline-flex items-center gap-2 text-xs font-bold border rounded px-2 py-1 ${plan.badgeColor}`}>
                  <Icon size={12} />
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-bold text-white">€{plan.price}</span>
                  <span className="text-xs text-zinc-500 font-mono">/{plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs">
                    {f.ok
                      ? <Check size={12} className="text-brand-green shrink-0" />
                      : <X size={12} className="text-zinc-600 shrink-0" />
                    }
                    <span className={f.ok ? 'text-zinc-300' : 'text-zinc-600'}>{f.text}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={onNavigateToAuth}
                className={`w-full py-2.5 rounded-lg text-xs font-semibold transition ${plan.ctaStyle}`}
              >
                {plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom note */}
      <div className="text-center text-[10px] text-zinc-500 font-mono pb-4">
        Sin contratos. Cancela cuando quieras. Datos OSINT reales verificados.
      </div>
    </div>
  );
};
