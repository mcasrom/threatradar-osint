import React, { useState, useEffect } from 'react';
import { Mail, Clock, RefreshCw, Send, CheckCircle, Terminal, FileText, AlertTriangle, Shield, Download, Loader } from 'lucide-react';
import { LogReport } from '../types';

// ── PDF Assessment Panel ──────────────────────────────────────────────────
const PdfAssessmentPanel: React.FC = () => {
  const [target, setTarget]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [progress, setProgress]   = useState('');
  const [error, setError]         = useState('');
  const [done, setDone]           = useState(false);

  const STEPS = [
    'Iniciando reconocimiento de puertos (nmap)...',
    'Enumerando subdominios (subfinder)...',
    'Analizando SSL/TLS (sslyze)...',
    'Detectando WAF (wafw00f)...',
    'Recopilando OSINT — emails y hosts (theHarvester)...',
    'Consultando WHOIS...',
    'Correlacionando con base de datos ThreatRadar...',
    'Generando radar de riesgo y hallazgos...',
    'Compilando PDF profesional (WeasyPrint)...',
  ];

  const generate = async () => {
    if (!target.trim()) return;
    setLoading(true); setError(''); setDone(false); setProgress(STEPS[0]);

    // Simular progreso mientras el backend trabaja (~60-90s)
    let step = 0;
    const interval = setInterval(() => {
      step = Math.min(step + 1, STEPS.length - 1);
      setProgress(STEPS[step]);
    }, 9000);

    try {
      const token = localStorage.getItem('tr_token');
      const res = await fetch('/api/reports/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ target: target.trim() }),
      });

      clearInterval(interval);

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Error ${res.status}`);
      }

      // Descargar PDF
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `ThreatRadar_${target.trim()}_${new Date().toISOString().slice(0,10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setProgress('Informe PDF descargado correctamente.');
      setDone(true);
    } catch (e: any) {
      clearInterval(interval);
      setError(e.message || 'Error generando informe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-brand-panel border border-brand-border rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-brand-border pb-3">
        <Shield size={15} className="text-brand-cyan" />
        <div>
          <h3 className="text-[11px] font-bold text-brand-cyan font-mono tracking-wider">
            SECURITY ASSESSMENT REPORT — PDF PROFESIONAL
          </h3>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
            Informe ejecutivo completo: superficie de ataque, hallazgos, radar de riesgo y recomendaciones accionables.
          </p>
        </div>
        <span className="ml-auto text-[9px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded font-mono px-2 py-0.5 shrink-0">
          PRO / ENTERPRISE
        </span>
      </div>

      {/* Qué incluye */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { icon: '🔍', label: 'Nmap · SSL · WAF · DNS' },
          { icon: '🌐', label: 'Subfinder · theHarvester' },
          { icon: '📊', label: 'Radar riesgo 8 dimensiones' },
          { icon: '📋', label: 'Hallazgos CRITICAL→LOW' },
        ].map(({ icon, label }) => (
          <div key={label} className="bg-brand-bg border border-brand-border rounded p-2 text-center">
            <div className="text-base mb-1">{icon}</div>
            <div className="text-[9px] text-zinc-400 font-mono leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* Input + botón */}
      <div className="flex gap-2">
        <input
          type="text"
          value={target}
          onChange={e => { setTarget(e.target.value); setDone(false); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && generate()}
          placeholder="dominio.com  o  192.168.1.1"
          disabled={loading}
          className="flex-1 bg-brand-bg border border-brand-border rounded px-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-brand-cyan disabled:opacity-50"
        />
        <button
          onClick={generate}
          disabled={loading || !target.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-brand-cyan text-brand-bg text-xs font-bold font-mono rounded hover:opacity-90 disabled:opacity-40 transition shrink-0">
          {loading
            ? <><Loader size={12} className="animate-spin" /> ANALIZANDO</>
            : done
            ? <><CheckCircle size={12} /> DESCARGAR DE NUEVO</>
            : <><Download size={12} /> GENERAR PDF</>}
        </button>
      </div>

      {/* Progreso */}
      {loading && (
        <div className="p-3 bg-brand-cyan/10 border border-brand-cyan/30 rounded">
          <div className="flex items-center gap-2 mb-2">
            <Terminal size={11} className="text-brand-cyan animate-pulse" />
            <span className="text-[10px] text-brand-cyan font-mono">{progress}</span>
          </div>
          <div className="h-1 bg-brand-bg rounded-full overflow-hidden">
            <div className="h-full bg-brand-cyan rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
          <p className="text-[9px] text-zinc-600 font-mono mt-2">
            El analisis completo tarda 60-120 segundos dependiendo del objetivo.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs font-mono">
          <AlertTriangle size={12} />
          {error}
        </div>
      )}

      {/* Exito */}
      {done && !loading && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded text-green-400 text-xs font-mono">
          <CheckCircle size={12} />
          PDF descargado: <span className="text-brand-cyan">ThreatRadar_{target}_{new Date().toISOString().slice(0,10)}.pdf</span>
        </div>
      )}

      {/* Aviso legal */}
      <p className="text-[8px] text-zinc-700 font-mono border-t border-brand-border/30 pt-2">
        Usar exclusivamente sobre sistemas propios o con autorizacion expresa por escrito. ThreatRadar OSINT no se responsabiliza del uso indebido.
      </p>
    </div>
  );
};

// ── Auto Reports Manager ──────────────────────────────────────────────────
export const AutoReportsManager: React.FC = () => {
  const [reports, setReports]                   = useState<LogReport[]>([]);
  const [period, setPeriod]                     = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [emailTo, setEmailTo]                   = useState('');
  const [webhookUrl, setWebhookUrl]             = useState('');
  const [isCompiling, setIsCompiling]           = useState(false);
  const [compilationProgress, setCompilationProgress] = useState<string | null>(null);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      const res  = await fetch('/api/reports/auto-generate');
      const data = await res.json();
      setReports(data);
    } catch {}
  };

  const handleGenerateReport = async () => {
    setIsCompiling(true);
    setCompilationProgress('Inicializando logs raw de honeypots...');
    try {
      setTimeout(() => setCompilationProgress('Mapeando IPs maliciosas con ThreatRadar database...'), 1000);
      setTimeout(() => setCompilationProgress('Traduciendo vectores a lenguaje natural (Gemini/Groq)...'), 2000);

      const response = await fetch('/api/reports/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, emailTo, webhookUrl }),
      });
      const data = await response.json();
      if (data.success) {
        setCompilationProgress(data.notificationMessage);
        fetchReports();
      } else {
        setCompilationProgress('Fallo de compilacion en el servidor.');
      }
    } catch {
      setCompilationProgress('Fallo de conexion.');
    } finally {
      setTimeout(() => setIsCompiling(false), 3500);
    }
  };

  return (
    <div className="space-y-5">

      {/* ── PDF Assessment (nuevo) ── */}
      <PdfAssessmentPanel />

      {/* ── Auto Dispatch (existente) ── */}
      <div id="automatic-dispatch-reports-panel" className="bg-brand-panel border border-brand-border p-5 rounded-lg space-y-4 font-sans">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-brand-border pb-2">
          <div>
            <h3 className="text-sm font-bold text-brand-cyan tracking-wider flex items-center gap-1.5">
              <Mail size={16} /> REPORTES AUTOMATICOS CYBER DISPATCH (DIARIOS / SEMANALES / MENSUALES)
            </h3>
            <p className="text-[10px] text-zinc-500">
              Reciba informes detallados de anomalias directamente en su bandeja de entrada o canal de Discord.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 bg-[#0b121f] p-4 rounded-lg border border-brand-border">
          <div className="space-y-1">
            <label className="text-[9px] text-zinc-500 font-mono block font-bold">FRECUENCIA DE DESPACHO</label>
            <select
              value={period}
              onChange={(e: any) => setPeriod(e.target.value)}
              className="w-full bg-[#05070a]/80 border border-brand-border rounded p-1.5 text-xs text-white focus:outline-none focus:border-brand-cyan font-sans">
              <option value="daily">Diario (Resumen de Guardia)</option>
              <option value="weekly">Semanal (Analisis ThreatRadar)</option>
              <option value="monthly">Mensual (Compliance Tecnico)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] text-zinc-500 font-mono block font-bold">ENVIAR A EMAIL CORPORATIVO</label>
            <input
              type="email" value={emailTo} placeholder="tu@email.com"
              onChange={e => setEmailTo(e.target.value)}
              className="w-full bg-[#05070a]/80 border border-brand-border rounded p-1.5 text-xs text-white focus:outline-none focus:border-brand-cyan font-mono" />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] text-zinc-500 font-mono block font-bold">WEBHOOK (DISCORD/SLACK)</label>
            <input
              type="url" value={webhookUrl} placeholder="https://discord.com/api/webhooks/..."
              onChange={e => setWebhookUrl(e.target.value)}
              className="w-full bg-[#05070a]/80 border border-brand-border rounded p-1.5 text-xs text-white focus:outline-none focus:border-brand-cyan font-mono" />
          </div>

          <button
            onClick={handleGenerateReport} disabled={isCompiling}
            className="sm:col-span-3 bg-brand-cyan hover:opacity-90 font-bold text-xs text-black py-2 px-4 rounded transition flex justify-center items-center gap-2 cursor-pointer">
            <Clock size={14} />
            {isCompiling ? 'Compilando Inteligencia...' : 'Compilar & Despachar Log Ahora'}
          </button>
        </div>

        {compilationProgress && (
          <div className="p-3 bg-brand-cyan/15 border border-brand-cyan/45 rounded text-[10px] font-mono text-brand-cyan flex items-center gap-2">
            <Terminal size={12} className="animate-pulse" />
            <span>{compilationProgress}</span>
          </div>
        )}

        {reports.length > 0 && (
          <div className="space-y-2">
            <span className="block text-[10px] text-zinc-500 font-mono">REGISTRO DE INFORME SEGUIMIENTO DISPATCH (BASE LOCAL)</span>
            <div className="overflow-x-auto border border-brand-border rounded bg-[#05070a]/90">
              <table className="w-full text-left text-[10px] font-mono">
                <thead className="bg-[#0b121f]/90 text-zinc-400 border-b border-brand-border">
                  <tr>
                    <th className="p-2">ID_INFORME</th>
                    <th className="p-2">COMPILADO</th>
                    <th className="p-2">CICLO</th>
                    <th className="p-2">ALERTAS TRAZADAS</th>
                    <th className="p-2 font-bold text-brand-red">RIESGOS CRITICOS</th>
                    <th className="p-2 text-right">DISPATCH DEST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border text-zinc-300">
                  {reports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-[#0b121f]">
                      <td className="p-2 text-brand-cyan font-bold">{rep.id}</td>
                      <td className="p-2">{rep.date}</td>
                      <td className="p-2 uppercase">{rep.period}</td>
                      <td className="p-2">{rep.totalAlerts}</td>
                      <td className="p-2 font-bold text-brand-red">{rep.criticalCount}</td>
                      <td className="p-2 text-right text-zinc-500">{emailTo || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
