import React, { useState, useEffect } from 'react';
import { Mail, Clock, RefreshCw, Send, CheckCircle, Terminal, FileText, AlertTriangle } from 'lucide-react';
import { LogReport } from '../types';

export const AutoReportsManager: React.FC = () => {
  const [reports, setReports] = useState<LogReport[]>([]);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [emailTo, setEmailTo] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilationProgress, setCompilationProgress] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports/auto-generate');
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error('Error fetching auto reports:', err);
    }
  };

  const handleGenerateReport = async () => {
    setIsCompiling(true);
    setCompilationProgress('Inicializando logs raw de honeypots...');
    try {
      setTimeout(() => {
        setCompilationProgress('Mapeando IPs maliciosas con Shodan database...');
      }, 1000);
      
      setTimeout(() => {
        setCompilationProgress('Traduciendo vectores a lenguaje natural (Gemini)...');
      }, 2000);

      const response = await fetch('/api/reports/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period,
          emailTo,
          webhookUrl
        })
      });
      const data = await response.json();
      if (data.success) {
        setCompilationProgress(data.notificationMessage);
        fetchReports();
      } else {
        setCompilationProgress('Fallo de compilación en el servidor.');
      }
    } catch {
      setCompilationProgress('Fallo de conexión.');
    } finally {
      setTimeout(() => {
        setIsCompiling(false);
      }, 3500);
    }
  };  return (
    <div id="automatic-dispatch-reports-panel" className="bg-brand-panel border border-brand-border p-5 rounded-lg space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-brand-border pb-2">
        <div>
          <h3 className="text-sm font-bold text-brand-cyan tracking-wider flex items-center gap-1.5">
            <Mail size={16} /> REPORTES AUTOMÁTICOS CYBER DISPATCH (DIARIOS / SEMANALES / MENSUALES)
          </h3>
          <p className="text-[10px] text-zinc-500">
            Reciba informes detallados de anomalías directamente en su bandeja de entrada o canal de Discord.
          </p>
        </div>
      </div>

      {/* Inputs Form */}
      <div className="grid sm:grid-cols-3 gap-3 bg-[#0b121f] p-4 rounded-lg border border-brand-border">
        <div className="space-y-1">
          <label className="text-[9px] text-zinc-500 font-mono block font-bold">FRECUENCIA DE DESPACHO</label>
          <select
            value={period}
            onChange={(e: any) => setPeriod(e.target.value)}
            className="w-full bg-[#05070a]/80 border border-brand-border rounded p-1.5 text-xs text-white focus:outline-none focus:border-brand-cyan font-sans"
          >
            <option value="daily">Diario (Resumen de Guardia)</option>
            <option value="weekly">Semanal (Análisis Shodan)</option>
            <option value="monthly">Mensual (Compliance Técnico)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] text-zinc-500 font-mono block font-bold">ENVIAR A EMAIL CORPORATIVO</label>
          <input
            type="email"
            value={emailTo}
            placeholder="tu@email.com"
            onChange={(e) => setEmailTo(e.target.value)}
            className="w-full bg-[#05070a]/80 border border-brand-border rounded p-1.5 text-xs text-white focus:outline-none focus:border-brand-cyan font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] text-zinc-500 font-mono block font-bold">WEBHOOK INTEGRATION (DISCORD/SLACK)</label>
          <input
            type="url"
            value={webhookUrl}
            placeholder="https://discord.com/api/webhooks/..."
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="w-full bg-[#05070a]/80 border border-brand-border rounded p-1.5 text-xs text-white focus:outline-none focus:border-brand-cyan font-mono"
          />
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={isCompiling}
          className="sm:col-span-3 bg-brand-cyan hover:opacity-90 font-bold text-xs text-black py-2 px-4 rounded transition flex justify-center items-center gap-2 cursor-pointer"
        >
          <Clock size={14} />
          {isCompiling ? 'Compilando Inteligencia...' : 'Compilar & Despachar Log Ahora'}
        </button>
      </div>

      {/* Progress logs */}
      {compilationProgress && (
        <div className="p-3 bg-brand-cyan/15 border border-brand-cyan/45 rounded text-[10px] font-mono text-brand-cyan flex items-center gap-2">
          <Terminal size={12} className="animate-pulse" />
          <span>{compilationProgress}</span>
        </div>
      )}

      {/* History table list of sent dispatches */}
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
                  <th className="p-2 font-bold text-brand-red">RIESGOS CRÍTICOS</th>
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
  );
};
