import { useState } from 'react';
import { Shield, LogIn, UserPlus, LogOut, Activity } from 'lucide-react';

interface AuthPanelProps {
  onAuthChange?: (user: any, token: string | null) => void;
}

export const AuthPanel: React.FC<AuthPanelProps> = ({ onAuthChange }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(() => {
    try { return JSON.parse(localStorage.getItem('tr_user') || 'null'); } catch { return null; }
  });
  const [usage, setUsage] = useState<any>(null);

  const token = localStorage.getItem('tr_token');

  const fetchUsage = async (tok: string) => {
    try {
      const res = await fetch('/api/user/usage', { headers: { Authorization: `Bearer ${tok}` } });
      const data = await res.json();
      setUsage(data);
    } catch {}
  };

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem('tr_token', data.token);
      localStorage.setItem('tr_user', JSON.stringify(data.user));
      setUser(data.user);
      fetchUsage(data.token);
      onAuthChange?.(data.user, data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tr_token');
    localStorage.removeItem('tr_user');
    setUser(null); setUsage(null);
    onAuthChange?.(null, null);
  };

  if (user) {
    return (
      <div className="bg-brand-panel border border-brand-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-brand-cyan" />
            <span className="text-xs font-mono text-brand-cyan font-bold">SESIÓN ACTIVA</span>
          </div>
          <button onClick={handleLogout} className="text-[10px] font-mono text-zinc-400 hover:text-brand-red flex items-center gap-1">
            <LogOut size={12} /> Salir
          </button>
        </div>
        <div className="text-[11px] font-mono space-y-1">
          <div className="flex justify-between"><span className="text-zinc-400">Email:</span><span className="text-white">{user.email}</span></div>
          <div className="flex justify-between"><span className="text-zinc-400">Plan:</span>
            <span className={`font-bold ${user.plan === 'free' ? 'text-zinc-300' : 'text-brand-cyan'}`}>{user.plan.toUpperCase()}</span>
          </div>
          {usage && (
            <>
              <div className="flex justify-between"><span className="text-zinc-400">Scans este mes:</span>
                <span className={usage.scansLimit !== -1 && usage.scansUsed >= usage.scansLimit ? 'text-brand-red' : 'text-brand-green'}>
                  {usage.scansUsed} / {usage.scansLimit === -1 ? '∞' : usage.scansLimit}
                </span>
              </div>
              {user.plan === 'free' && (
                <div className="mt-2 pt-2 border-t border-brand-border">
                  <button
                    onClick={() => fetch('/api/billing/setup', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('tr_token')}` },
                      body: JSON.stringify({ planName: 'PREMIUM' })
                    }).then(r => r.json()).then(d => d.checkoutUrl && window.open(d.checkoutUrl, '_blank'))}
                    className="w-full text-[10px] font-mono bg-brand-cyan/20 hover:bg-brand-cyan/30 border border-brand-cyan/40 text-brand-cyan rounded px-3 py-1.5 transition">
                    ⚡ UPGRADE A PRO
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-panel border border-brand-border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-brand-border">
        <Shield size={16} className="text-brand-cyan" />
        <span className="text-xs font-mono text-brand-cyan font-bold">ACCESO SOC</span>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setMode('login')}
          className={`flex-1 text-[10px] font-mono py-1 rounded border transition ${mode === 'login' ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan' : 'border-brand-border text-zinc-400'}`}>
          <LogIn size={10} className="inline mr-1" />LOGIN
        </button>
        <button onClick={() => setMode('register')}
          className={`flex-1 text-[10px] font-mono py-1 rounded border transition ${mode === 'register' ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan' : 'border-brand-border text-zinc-400'}`}>
          <UserPlus size={10} className="inline mr-1" />REGISTRO
        </button>
      </div>
      <input type="email" placeholder="email@dominio.com" value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full bg-brand-bg border border-brand-border rounded px-3 py-2 text-[11px] font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-brand-cyan" />
      <input type="password" placeholder="contraseña" value={password}
        onChange={e => setPassword(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        className="w-full bg-brand-bg border border-brand-border rounded px-3 py-2 text-[11px] font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-brand-cyan" />
      {error && <p className="text-[10px] text-brand-red font-mono">{error}</p>}
      <button onClick={handleSubmit} disabled={loading}
        className="w-full bg-brand-cyan/20 hover:bg-brand-cyan/30 border border-brand-cyan/40 text-brand-cyan text-[11px] font-mono rounded py-2 transition disabled:opacity-50">
        {loading ? 'Procesando...' : mode === 'login' ? 'INICIAR SESIÓN' : 'CREAR CUENTA'}
      </button>
    </div>
  );
};
