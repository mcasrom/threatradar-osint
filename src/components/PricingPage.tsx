import React from 'react';
import { Shield, Zap, Building2, Check, X } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    period: 'siempre gratis',
    icon: Shield,
    borderColor: 'border-zinc-700',
    bgColor: 'bg-zinc-900/30',
    badgeColor: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    iconColor: 'text-zinc-400',
    features: [
      { text: '3 scans OSINT / día', ok: true },
      { text: 'Score de amenaza (0-100)', ok: true },
      { text: 'País, ISP, geolocalización', ok: true },
      { text: 'Mapa de amenazas en tiempo real', ok: true },
      { text: 'Historial 7 días', ok: true },
      { text: 'Todas las fuentes OSINT', ok: false },
      { text: 'Módulos CLI (nmap, nikto, subfinder…)', ok: false },
      { text: 'Informes IA (Groq/Gemini)', ok: false },
      { text: 'WAF Recommendations', ok: false },
      { text: 'Despacho automático email', ok: false },
      { text: 'Telegram alerts', ok: false },
      { text: 'API access + webhooks', ok: false },
    ],
    cta: 'Empezar gratis',
    ctaStyle: 'border border-zinc-600 text-zinc-300 hover:bg-zinc-800',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '4,99',
    priceYear: '19,99',
    period: 'mes',
    periodYear: 'año',
    icon: Zap,
    borderColor: 'border-brand-cyan/50',
    bgColor: 'bg-brand-cyan/5',
    badgeColor: 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30',
    iconColor: 'text-brand-cyan',
    badge: 'Más popular',
    features: [
      { text: 'Scans OSINT ilimitados', ok: true },
      { text: 'Score de amenaza (0-100)', ok: true },
      { text: 'País, ISP, geolocalización', ok: true },
      { text: 'Mapa de amenazas en tiempo real', ok: true },
      { text: 'Historial 90 días', ok: true },
      { text: 'Todas las fuentes OSINT reales', ok: true },
      { text: 'Módulos CLI (nmap, nikto, subfinder, httpx, wafw00f, theHarvester, dnsrecon…)', ok: true },
      { text: 'Informes IA (Groq/Gemini)', ok: true },
      { text: 'WAF Recommendations', ok: true },
      { text: 'Despacho automático email', ok: true },
      { text: 'Telegram alerts', ok: false },
      { text: 'API access + webhooks', ok: false },
    ],
    cta: 'Activar Pro',
    ctaStyle: 'bg-brand-cyan text-brand-bg font-bold hover:bg-brand-cyan/90',
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '19,99',
    period: 'año',
    icon: Building2,
    borderColor: 'border-purple-500/40',
    bgColor: 'bg-purple-500/5',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    iconColor: 'text-purple-400',
    features: [
      { text: 'Scans OSINT ilimitados', ok: true },
      { text: 'Score de amenaza (0-100)', ok: true },
      { text: 'País, ISP, geolocalización', ok: true },
      { text: 'Mapa de amenazas en tiempo real', ok: true },
      { text: 'Historial 365 días', ok: true },
      { text: 'Todas las fuentes OSINT reales', ok: true },
      { text: 'Módulos CLI completos', ok: true },
      { text: 'Informes IA (Groq/Gemini)', ok: true },
      { text: 'WAF Recommendations', ok: true },
      { text: 'Despacho automático email', ok: true },
      { text: 'Telegram alerts', ok: true },
      { text: 'API access + webhooks', ok: true },
    ],
    cta: 'Activar Enterprise',
    ctaStyle: 'border border-purple-500/40 text-purple-400 hover:bg-purple-500/10',
    highlight: false,
  },
];

interface PricingPageProps {
  onNavigateToAuth?: () => void;
  onContactEnterprise?: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigateToAuth, onContactEnterprise }) => {
  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-white font-mono tracking-wider">
          PLANES Y PRECIOS
        </h2>
        <p className="text-zinc-400 text-sm font-mono">
          Inteligencia OSINT real. Sin datos simulados. Sin Shodan ficticio.
        </p>
        <div className="inline-flex items-center gap-2 text-[10px] font-mono text-brand-cyan/70 bg-brand-cyan/5 border border-brand-cyan/20 rounded px-3 py-1">
          ✓ Fuentes verificadas: AbuseIPDB · OTX · ThreatFox · GreyNoise · VirusTotal · crt.sh · InternetDB · URLHaus
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-lg border ${plan.borderColor} ${plan.bgColor} p-5 space-y-4 ${
                plan.highlight ? 'shadow-[0_0_24px_rgba(0,242,255,0.12)]' : ''
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-mono px-3 py-0.5 rounded-full border ${plan.badgeColor}`}>
                  {plan.badge}
                </div>
              )}

              {/* Plan name & price */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Icon size={16} className={plan.iconColor} />
                  <span className="text-sm font-bold font-mono text-white">{plan.name}</span>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-bold text-white font-mono">€{plan.price}</span>
                  <span className="text-zinc-500 text-xs font-mono mb-0.5">/{plan.period}</span>
                </div>
                {(plan as any).priceYear && (
                  <div className="text-[10px] font-mono text-zinc-500">
                    o €{(plan as any).priceYear}/{(plan as any).periodYear} — ahorra 60%
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-1.5 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    {f.ok
                      ? <Check size={11} className="text-brand-green mt-0.5 shrink-0" />
                      : <X size={11} className="text-zinc-700 mt-0.5 shrink-0" />
                    }
                    <span className={`text-[11px] font-mono ${f.ok ? 'text-zinc-300' : 'text-zinc-600'}`}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={plan.id === 'enterprise' ? onContactEnterprise : onNavigateToAuth}
                className={`w-full py-2 rounded text-xs font-mono transition ${plan.ctaStyle}`}
              >
                {plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <p className="text-center text-[10px] font-mono text-zinc-600">
        Sin contratos. Cancela cuando quieras. Pago seguro via Stripe.
      </p>
    </div>
  );
};
