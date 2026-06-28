import React, { useState, useEffect } from 'react';
import { MonetizationPanel } from './MonetizationPanel';
import { ShieldCheck, Zap, BarChart2, ArrowUpCircle, RefreshCw, AlertCircle, Crown, Users } from 'lucide-react';

interface UserDashboardProps {
  onNavigateToPricing: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ onNavigateToPricing }) => {
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('tr_user') || 'null');
      setUser(u);
    } catch {}
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('tr_token');
    if (!token) {
      setError('No has iniciado sesión.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/user/usage', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setUsage(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const planColor: Record<string, string> = {
    free: 'text-zinc-400 border-zinc-600',
    pro: 'text-brand-cyan border-brand-cyan',
    enterprise: 'text-yellow-400 border-yellow-500'
  };

  const planIcon: Record<string, React.ReactNode> = {
    free: <ShieldCheck size={18} className="text-zinc-400" />,
    pro: <Zap size={18} className="text-brand-cyan" />,
    enterprise: <Crown size={18} className="text-yellow-400" />
  };

  const plan = usage?.plan || user?.plan || 'free';
  const scansUsed = usage?.scansUsed ?? 0;
  const scansLimit = usage?.scansLimit === -1 ? null : usage?.scansLimit;
  const pct = scansLimit ? Math.min(100, Math.round((scansUsed / scansLimit) * 100)) : 0;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-brand-border">
        <h2 className="text-sm font-bold font-sans text-white tracking-wider flex items-center gap-2">
          <Users size={16} className="text-brand-cyan" />
          DASHBOARD DE USUARIO
        </h2>
        <button onClick={fetchUsage} className="text-[10px] font-mono text-zinc-500 hover:text-brand-cyan flex items-center gap-1 transition">
          <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-700/40 rounded p-3 text-xs text-red-400 font-mono flex items-center gap-2">
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      {/* Plan card */}
      <div className={`bg-brand-panel border rounded-lg p-5 flex items-center justify-between ${planColor[plan] || 'border-zinc-700'}`}>
        <div className="flex items-center gap-3">
          {planIcon[plan]}
          <div>
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Plan actual</div>
            <div className={`text-xl font-bold font-sans uppercase ${planColor[plan]?.split(' ')[0]}`}>
              {plan}
            </div>
            {user?.email && (
              <div className="text-[10px] font-mono text-zinc-600 mt-0.5">{user.email}</div>
            )}
          </div>
        </div>
        {plan !== 'enterprise' && (
          <button
            onClick={onNavigateToPricing}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-brand-cyan/30 to-brand-green/30 hover:from-brand-cyan/40 hover:to-brand-green/40 border border-brand-cyan/45 text-white font-bold text-xs rounded transition active:scale-95"
          >
            <ArrowUpCircle size={13} />
            {plan === 'free' ? 'Actualizar a Pro' : 'Ver Enterprise'}
          </button>
        )}
      </div>

      {/* Scans usage */}
      <div className="bg-brand-panel border border-brand-border rounded-lg p-5 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold font-sans text-white flex items-center gap-2">
            <BarChart2 size={14} className="text-brand-cyan" />
            SCANS ESTE MES
          </h3>
          {loading && <RefreshCw size={10} className="animate-spin text-zinc-500" />}
        </div>

        {scansLimit ? (
          <>
            <div className="flex justify-between text-[10px] font-mono text-zinc-400">
              <span>{scansUsed} usados</span>
              <span>{scansLimit} límite mensual</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-brand-cyan'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="text-[9px] font-mono text-zinc-600 text-right">{pct}% utilizado</div>
            {pct >= 90 && (
              <div className="bg-red-950/30 border border-red-700/40 rounded p-2 text-[10px] text-red-400 font-mono flex items-center gap-2">
                <AlertCircle size={10} />
                Límite casi alcanzado — considera actualizar tu plan.
              </div>
            )}
          </>
        ) : (
          <div className="text-xs font-mono text-brand-cyan flex items-center gap-2">
            <Zap size={12} />
            Scans ilimitados ({scansUsed} realizados este mes)
          </div>
        )}
      </div>

      {/* Plan features */}
      <div className="bg-brand-panel border border-brand-border rounded-lg p-5 space-y-3">
        <h3 className="text-xs font-bold font-sans text-white">FUENTES OSINT DISPONIBLES EN TU PLAN</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {['Shodan', 'AbuseIPDB', 'VirusTotal', 'Hunter.io', 'GreyNoise', 'IPInfo'].map(source => {
            const available = plan !== 'free' || ['Shodan', 'AbuseIPDB'].includes(source);
            return (
              <div key={source} className={`flex items-center gap-2 text-[10px] font-mono p-2 rounded border ${available ? 'border-brand-cyan/30 text-brand-cyan bg-brand-cyan/5' : 'border-zinc-800 text-zinc-600 bg-zinc-900/30'}`}>
                <span className={available ? 'text-brand-green' : 'text-zinc-700'}>
                  {available ? '✓' : '✗'}
                </span>
                {source}
                {!available && <span className="ml-auto text-[8px] text-zinc-600">PRO</span>}
              </div>
            );
          })}
        </div>
        {plan === 'free' && (
          <button onClick={onNavigateToPricing} className="w-full mt-2 py-2 border border-brand-cyan/30 text-brand-cyan text-[10px] font-mono rounded hover:bg-brand-cyan/10 transition">
            Ver todas las fuentes disponibles en Pro →
          </button>
        )}
      </div>

    </div>
  );
};
