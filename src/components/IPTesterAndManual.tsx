import React, { useState, useEffect } from 'react';

import { ThreatAlert } from '../types';
import ReactMarkdown from 'react-markdown';
import { Globe, MapPin, Terminal, HelpCircle, ArrowRight, CheckCircle2, ShieldAlert, BookOpen, AlertCircle, RefreshCw, Zap, Copy, FileDown, Shield, Activity } from 'lucide-react';

interface IPTesterProps {
  onTriggerAlert: (alert: ThreatAlert) => void;
}

export const IPTesterAndManual: React.FC<IPTesterProps> = ({ onTriggerAlert }) => {
  const [customIp, setCustomIp] = useState<string>('');
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [detectionLogs, setDetectionLogs] = useState<string[]>([]);
  const [resolvedGeo, setResolvedGeo] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [osintResult, setOsintResult] = useState<any>(null);
  const [osintLoading, setOsintLoading] = useState(false);
  const [osintError, setOsintError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [threatScore, setThreatScore] = useState<{
    score: number;
    level: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO';
    factors: string[];
    mitigationCommands: { label: string; cmd: string }[];
    conclusion?: { summary: string; evidence: string; risk: string; confidence: string };
  } | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Auto-detect IP on mount
  useEffect(() => {
    detectMyIp(true);
  }, []);

  const addLog = (msg: string) => {
    setDetectionLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-6));
  };

  const detectMyIp = async (quiet = false) => {
    setIsDetecting(true);
    if (!quiet) addLog('Iniciando handshake con servidores de resolución de IP públicos...');
    try {
      const res = await fetch('/api/geoip/');
      if (!res.ok) throw new Error('Respuesta del servidor de geolocalización no válida.');
      const data = await res.json();
      
      if (data && data.ip) {
        setCustomIp(data.ip);
        setResolvedGeo(data);
        if (!quiet) {
          addLog(`¡Exito! IP Detectada: ${data.ip} (${data.org || 'ISP Desconocido'})`);
          addLog(`Ubicación: ${data.city}, ${data.country} [${data.latitude}, ${data.longitude}]`);
        }
        setStatusMessage({
          type: 'success',
          text: `IP autodetectada y geolocalizada: ${data.ip} (${data.country})`
        });
      } else {
        throw new Error('Formato de datos devuelto no soportado');
      }
    } catch (err: any) {
      if (!quiet) {
        addLog('Reintentando con proveedor de respaldo...');
      }
      try {
        const fallbackRes = await fetch('https://api.ipify.org?format=json');
        const fallbackData = await fallbackRes.json();
        if (fallbackData && fallbackData.ip) {
          setCustomIp(fallbackData.ip);
          setStatusMessage({
            type: 'info',
            text: `IP autodetectada: ${fallbackData.ip} (Coordenadas aproximadas estimadas).`
          });
        }
      } catch (fallbackErr) {
        if (!quiet) addLog('No se pudo autodetectar la IP pública. Usando IP local simulada de pruebas.');
        setCustomIp('185.112.144.15');
      }
    } finally {
      setIsDetecting(false);
    }
  };

  const handleResolveAndInject = async () => {
    if (!customIp) {
      setStatusMessage({ type: 'error', text: 'Por favor, introduzca una dirección IP válida.' });
      return;
    }

    addLog(`Resolviendo coordenadas tácticas para IP: ${customIp}...`);
    setIsDetecting(true);

    try {
      // Fetch geodata for specified IP
      const res = await fetch(`/api/geoip/${customIp}`);
      const data = await res.json();

      if (data && data.ip && data.latitudeitude !== undefined) {
        setResolvedGeo(data);
        addLog(`IP resuelta para: ${data.country || 'Desconocido'}. Lat: ${data.latitude}, Lng: ${data.longitude}`);
        
        // Trigger high-fidelity threat alert originating from resolved IP targeting Central SOC
        const injectedAlert: ThreatAlert = {
          id: `ALT-USER-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          sourceIp: data.query || customIp,
          destinationIp: '185.112.144.15', // Europe SOC
          sourcePort: Math.floor(Math.random() * 45000) + 12000,
          destinationPort: 443,
          country: data.country || 'Origen de Prueba',
          countryCode: data.country_code || 'TS',
          severity: 'CRITICAL',
          attackType: 'Handshake Táctico OSINT (Prueba de Usuario)',
          payload: `Inyección de sonda manual desde IP del operador militar. Geodatos: Lat=${data.latitude} Lng=${data.longitude}. Proveedor: ${data.org || 'Local ISP'}`,
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
          intensity: 100
        };

        onTriggerAlert(injectedAlert);
        setStatusMessage({
          type: 'success',
          text: `¡Firma de red inyectada! Rastree el arco luminoso desde ${data.country} hasta Europa SOC.`
        });
        addLog('Vector cargado con éxito en el mapa geográfico.');
      } else {
        // IP specified manually failed or returned error, generate fallback close coordinate
        addLog(`La IP especificada no retornó coordenadas directas. Simulando ubicación intermedia...`);
        
        // Generate coordinates (Spain / Europe fallback area or similar)
        const mockLat = 40.4168 + (Math.random() - 0.5) * 5;
        const mockLng = -3.7038 + (Math.random() - 0.5) * 5;

        const injectedAlert: ThreatAlert = {
          id: `ALT-USER-FALLBACK-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          sourceIp: customIp,
          destinationIp: '185.112.144.15',
          sourcePort: 55001,
          destinationPort: 22,
          country: 'Nodo Analítico Personalizado',
          countryCode: 'ES',
          severity: 'HIGH',
          attackType: 'OSINT Probe Injected',
          payload: `IP manual inyectada en canal pasivo. Coordenadas aproximadas estimadas en Lat=${mockLat.toFixed(2)}, Lng=${mockLng.toFixed(2)}`,
          latitude: mockLat,
          longitude: mockLng,
          intensity: 90
        };

        onTriggerAlert(injectedAlert);
        setStatusMessage({
          type: 'success',
          text: `Inyectado con coordenadas de pruebas estimadas para: ${customIp}`
        });
      }
    } catch (err) {
      addLog('Error resolviendo proveedor. Generando coordenadas de pruebas tácticas...');
      const mockLat = 35.0 + (Math.random() - 0.5) * 10;
      const mockLng = -10.0 + (Math.random() - 0.5) * 10;
      
      const injectedAlert: ThreatAlert = {
        id: `ALT-USER-ERR-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        sourceIp: customIp,
        destinationIp: '185.112.144.15',
        sourcePort: 49200,
        destinationPort: 80,
        country: 'Sonda de Red Simulada',
        countryCode: 'XX',
        severity: 'MEDIUM',
        attackType: 'Sonda Forzada Satelital',
        payload: `Error resolviendo DNS. Forzando coordenada arbitraria: [${mockLat.toFixed(4)}, ${mockLng.toFixed(4)}]`,
        latitude: mockLat,
        longitude: mockLng,
        intensity: 80
      };
      
      onTriggerAlert(injectedAlert);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleAiAnalysis = async () => {
    if (!osintResult) return;
    const token = localStorage.getItem('tr_token');
    if (!token) { setAiError('Debes iniciar sesión.'); return; }
    setAiLoading(true);
    setAiAnalysis(null);
    setAiError(null);
    try {
      // Truncar payload para evitar limite de tokens en Groq
      const trimmedData = {
        ip: osintResult.ip,
        timestamp: osintResult.timestamp,
        shodan: osintResult.shodan,
        abuseipdb: osintResult.abuseipdb,
        greynoise: osintResult.greynoise,
        ipinfo: osintResult.ipinfo,
        virustotal: osintResult.virustotal ? {
          data: {
            id: osintResult.virustotal?.data?.id,
            attributes: {
              last_analysis_stats: osintResult.virustotal?.data?.attributes?.last_analysis_stats,
              reputation: osintResult.virustotal?.data?.attributes?.reputation,
              country: osintResult.virustotal?.data?.attributes?.country,
              as_owner: osintResult.virustotal?.data?.attributes?.as_owner,
            }
          }
        } : null
      };
      const res = await fetch('/api/osint/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ osintData: trimmedData })
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setAiAnalysis(data.analysis);
      if (data.threatScore) setThreatScore(data.threatScore);
      addLog(`Análisis IA completado para ${osintResult.ip} — Score: ${data.threatScore?.score ?? '?'}/100 [${data.threatScore?.level ?? '?'}]`);
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // __HANDLEOSINTFULL_PARAM_FIXED__
  const handleOsintFull = async (overrideIp?: string) => {
    const targetIp = overrideIp || customIp;
    if (!targetIp) {
      setOsintError('Introduce una IP primero (usa Detectar o escribe una).');
      return;
    }
    const token = localStorage.getItem('tr_token');
    if (!token) {
      setOsintError('Debes iniciar sesión para usar el análisis OSINT completo.');
      return;
    }
    setOsintLoading(true);
    setOsintResult(null);
    setOsintError(null);
    try {
      const res = await fetch(`/api/osint/ip-full/${targetIp}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
      if (res.status === 429) {
        const d = await res.json();
        throw new Error(d.error || 'Límite de scans alcanzado. Actualiza tu plan.');
      }
      if (!res.ok) throw new Error(`Error ${res.status} del servidor.`);
      const data = await res.json();
      setOsintResult(data);
      addLog(`Análisis OSINT completo para ${targetIp} — ${Object.keys(data).filter(k => data[k] && !data[k].error && k !== 'ip' && k !== 'timestamp').length} fuentes con datos.`);
    } catch (err: any) {
      setOsintError(err.message);
    } finally {
      setOsintLoading(false);
    }
  };

  const copyCmd = async (cmd: string) => {
    try {
      await navigator.clipboard.writeText(cmd);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = cmd;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const exportPdf = () => {
    const ip = osintResult?.ip || 'unknown';
    const ts = threatScore;
    const analysis = aiAnalysis || '';
    const levelColor = ts ? ({ CRITICO: '#ef4444', ALTO: '#f97316', MEDIO: '#eab308', BAJO: '#22c55e' }[ts.level] || '#888') : '#888';
    const html = [
      '<!DOCTYPE html><html><head><meta charset="utf-8">',
      '<title>ThreatRadar Report ' + ip + '</title>',
      '<style>body{font-family:monospace;background:#0a0e1a;color:#c9d1d9;padding:2rem}',
      'h1{color:#00e5ff}h2{color:#00e5ff;border-bottom:1px solid #1e2d3d;padding-bottom:4px}',
      '.badge{display:inline-block;padding:4px 12px;border-radius:4px;font-weight:bold;background:' + levelColor + '22;color:' + levelColor + ';border:1px solid ' + levelColor + '}',
      '.score{font-size:2rem;font-weight:bold;color:' + levelColor + '}',
      '.factor{font-size:.8rem;color:#8b949e;margin:2px 0}',
      '.cmd{background:#0d1117;border:1px solid #30363d;padding:6px 10px;border-radius:4px;font-size:.75rem;margin:4px 0;white-space:pre-wrap}',
      'pre{white-space:pre-wrap;word-break:break-all;font-size:.8rem}</style></head><body>',
      '<h1>ThreatRadar OSINT Report</h1>',
      '<p style="color:#8b949e;font-size:.75rem">IP: <strong style="color:#fff">' + ip + '</strong> | ' + new Date().toISOString() + '</p>',
    ].join('');
    const scoreHtml = ts ? [
      '<h2>Risk Score</h2>',
      '<div><span class="score">' + ts.score + '</span>/100 <span class="badge">' + ts.level + '</span></div>',
      '<h2>Factores</h2>',
      ts.factors.map((f: string) => '<div class="factor">- ' + f + '</div>').join(''),
      '<h2>Comandos de Mitigacion</h2>',
      ts.mitigationCommands.map((m: {label:string;cmd:string}) => '<div><div style="color:#8b949e;font-size:.7rem">' + m.label + '</div><div class="cmd">' + m.cmd + '</div></div>').join(''),
    ].join('') : '';
    const escapedAnalysis = analysis.split('<').join('&lt;').split('>').join('&gt;'); const analysisHtml = '<h2>Informe IA</h2><pre>' + escapedAnalysis + '</pre></body></html>';
    const w = window.open('', '_blank');
    if (w) { w.document.write(html + scoreHtml + analysisHtml); w.document.close(); w.print(); }
  };

  const renderOsintSource = (label: string, data: any, color: string) => {
    if (!data) return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded p-2">
        <span className="text-[9px] font-mono text-zinc-600">{label}: API key no configurada</span>
      </div>
    );
    if (data.error) return (
      <div className="bg-red-950/30 border border-red-900/40 rounded p-2">
        <span className="text-[9px] font-mono text-red-400">{label}: {data.error}</span>
      </div>
    );
    return (
      <div className={`bg-zinc-900/60 border ${color} rounded p-2.5 space-y-1`}>
        <div className="text-[9px] font-mono font-bold text-zinc-300 border-b border-zinc-800 pb-1 mb-1">{label}</div>
        <pre className="text-[8px] font-mono text-zinc-400 whitespace-pre-wrap break-all max-h-28 overflow-y-auto">
          {JSON.stringify(data, null, 2).slice(0, 600)}{JSON.stringify(data).length > 600 ? '...' : ''}
        </pre>
      </div>
    );
  };

  return (
    <div id="ip-tester-interactive-suite" className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      
      {/* Interactive Geolocation Injector Card */}
      <div className="bg-brand-panel border border-brand-border p-5 rounded-lg space-y-4 flex flex-col justify-between shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cyan/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="space-y-2">
          <div className="flex justify-between items-center pb-2 border-b border-brand-border/60">
            <h4 className="text-sm font-bold font-sans text-brand-cyan tracking-wider flex items-center gap-2">
              <Globe size={16} className="animate-pulse" />
              GEOLOCALIZAR MI IP EN EL MAPA
            </h4>
            <span className="text-[9px] bg-brand-cyan/20 text-brand-cyan font-mono px-2 py-0.5 border border-brand-cyan/35 rounded">
              LIVE
            </span>
          </div>

          <p className="text-zinc-400 text-xs font-sans leading-relaxed">
            Detecta tu IP pública y visualízala en el mapa de amenazas en tiempo real junto a los C2s rastreados.
          </p>

          <div className="space-y-2.5 pt-2">
            <div>
              <label className="block text-[10px] text-zinc-500 font-mono mb-1">DIRECCIÓN IP DE PRUEBAS (TU OPERADOR O PROVEEEDOR)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej. 82.113.44.120"
                  value={customIp}
                  onChange={(e) => setCustomIp(e.target.value)}
                  className="flex-1 bg-[#070b13] border border-brand-border rounded p-2 text-xs text-white mt-1 font-mono focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => detectMyIp(false)}
                  disabled={isDetecting}
                  className="bg-brand-header hover:bg-brand-border border border-brand-border text-xs px-3 rounded self-end h-9 font-sans font-bold flex items-center gap-1 text-zinc-300 transition"
                >
                  <RefreshCw size={12} className={isDetecting ? 'animate-spin' : ''} />
                  Detectar
                </button>
              </div>
            </div>

            <button
              onClick={handleResolveAndInject}
              disabled={isDetecting || !customIp}
              className="w-full py-2.5 bg-gradient-to-r from-brand-cyan/30 to-brand-green/30 hover:from-brand-cyan/40 hover:to-brand-green/40 border border-brand-cyan/45 text-white font-sans font-bold text-xs rounded transition flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
            >
              <MapPin size={14} className="text-brand-cyan" />
              Geolocalizar e Inyectar en Mapa Virtual
            </button>
          </div>
        </div>

        {/* Real-time telemetry connection log */}
        <div className="bg-[#05070a]/90 border border-brand-border/60 p-3 rounded font-mono text-[9px] text-brand-cyan h-24 overflow-y-auto mt-4 space-y-0.5">
          <div className="text-[8px] text-zinc-500 font-bold border-b border-brand-border/40 pb-0.5 mb-1 flex justify-between">
            <span>REGISTROS TÁCTICOS DE TELEMETRÍA</span>
            <span>OSINT ENGINE: ACTIVE</span>
          </div>
          {detectionLogs.length === 0 ? (
            <span className="text-zinc-600 block italic">Listo para handshakes de coordenadas...</span>
          ) : (
            detectionLogs.map((log, i) => <div key={i}>{log}</div>)
          )}
        </div>

        {/* State toast message */}
        {statusMessage && (
          <div className={`mt-3 p-2 border rounded text-[10px] font-sans flex items-center gap-1.5 transition-all ${
            statusMessage.type === 'success' ? 'bg-brand-green/10 text-brand-green border-brand-green/40' :
            statusMessage.type === 'error' ? 'bg-brand-red/10 text-brand-red border-brand-red/40' :
            'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/40'
          }`}>
            <AlertCircle size={12} />
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* OSINT Full Analysis Card */}
      <div className="mt-5 bg-brand-panel border border-brand-cyan/30 p-5 rounded-lg shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-brand-border/60">
          <h4 className="text-sm font-bold font-sans text-brand-cyan tracking-wider flex items-center gap-2">
            <ShieldAlert size={16} />
            ANÁLISIS OSINT COMPLETO — DATOS REALES
          </h4>
          <span className="text-[9px] bg-brand-cyan/20 text-brand-cyan font-mono px-2 py-0.5 border border-brand-cyan/35 rounded">
            MULTI-SOURCE INTEL
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 font-mono">IP objetivo:</span>
          <span className="text-xs text-white font-mono bg-zinc-900 border border-zinc-700 px-2 py-1 rounded">
            {customIp || '— sin IP —'}
          </span>
          <button
            onClick={() => handleOsintFull()}
            disabled={osintLoading || !customIp}
            className="ml-auto px-4 py-2 bg-gradient-to-r from-brand-cyan/30 to-brand-green/30 hover:from-brand-cyan/40 hover:to-brand-green/40 border border-brand-cyan/45 text-white font-bold text-xs rounded transition flex items-center gap-2 disabled:opacity-50 active:scale-95"
          >
            {osintLoading ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            {osintLoading ? 'Analizando...' : 'Lanzar Análisis OSINT'}
          </button>
{/* __TEST_PRIVATE_BUTTON_REMOVED__ */}
        </div>

        {osintError && (
          <div className="bg-red-950/30 border border-red-700/40 rounded p-2 text-[10px] text-red-400 font-mono flex items-center gap-2">
            <AlertCircle size={12} />
            {osintError}
          </div>
        )}

        {/* __PRIVATE_IP_CARD_INSTALLED__ */}
        {osintResult && osintResult.private_ip_detected && (
          <div className="bg-blue-950/20 border border-blue-700/40 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-blue-400">
              <AlertCircle size={16} />
              <span className="text-xs font-mono font-bold">IP PRIVADA DETECTADA</span>
            </div>
            <p className="text-[11px] text-zinc-300 font-mono leading-relaxed">
              {osintResult.message}
            </p>
            <p className="text-[10px] text-zinc-500 font-mono">
              {osintResult.guidance}
            </p>
            {osintResult.your_public_ip && (
              <div className="bg-[#04080f] border border-blue-700/30 rounded p-3 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-[9px] text-zinc-500 font-mono">TU IP PÚBLICA REAL</div>
                  <div className="text-sm text-blue-400 font-mono font-bold">{osintResult.your_public_ip}</div>
                  {osintResult.your_location && (
                    <div className="text-[10px] text-zinc-500 font-mono">
                      {[osintResult.your_location.city, osintResult.your_location.country].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setCustomIp(osintResult.your_public_ip);
                    handleOsintFull(osintResult.your_public_ip);
                  }}
                  className="px-3 py-2 rounded bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600/30 transition text-[10px] font-mono font-bold whitespace-nowrap"
                >
                  Analizar mi IP pública →
                </button>
              </div>
            )}
            {!osintResult.your_public_ip && (
              <p className="text-[10px] text-yellow-600 font-mono">
                {osintResult.suggestion}
              </p>
            )}
          </div>
        )}
        {osintResult && (
          <div className="space-y-2">
            <div className="text-[9px] font-mono text-zinc-500 border-b border-zinc-800 pb-1">
              Scan completado: {new Date(osintResult.timestamp).toLocaleString()} — IP: {osintResult.ip}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {renderOsintSource('SHODAN', osintResult.shodan, 'border-orange-700/40')}
              {renderOsintSource('ABUSEIPDB', osintResult.abuseipdb, 'border-red-700/40')}
              {renderOsintSource('VIRUSTOTAL', osintResult.virustotal, 'border-yellow-700/40')}
              {renderOsintSource('GREYNOISE', osintResult.greynoise, 'border-blue-700/40')}
              {renderOsintSource('IPINFO', osintResult.ipinfo, 'border-green-700/40')}
            </div>
          </div>
        )}

        {!osintResult && !osintLoading && !osintError && (
          <div className="text-center py-6 text-zinc-600 text-xs font-mono">
            Introduce una IP arriba y pulsa "Lanzar Análisis OSINT" para consultar Shodan, AbuseIPDB, VirusTotal, GreyNoise e IPInfo en tiempo real.
          </div>
        )}
      </div>

      {/* ThreatRadar Risk Score Badge */}
      {threatScore && (
        <div className="bg-brand-panel border border-brand-border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-brand-border/60">
            <h4 className="text-sm font-bold font-sans text-brand-cyan tracking-wider flex items-center gap-2">
              <Shield size={16} />
              THREATRADAR RISK SCORE
            </h4>
            <button onClick={exportPdf} className="flex items-center gap-1.5 text-[10px] font-mono px-3 py-1.5 rounded border border-brand-border hover:border-brand-cyan/50 text-zinc-400 hover:text-brand-cyan transition">
              <FileDown size={12} />
              Exportar PDF
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className={`text-5xl font-bold font-mono ${threatScore.level === 'CRITICO' ? 'text-red-400' : threatScore.level === 'ALTO' ? 'text-orange-400' : threatScore.level === 'MEDIO' ? 'text-yellow-400' : 'text-green-400'}`}>
              {threatScore.score}<span className="text-lg text-zinc-500">/100</span>
            </div>
            <div className={`px-4 py-2 rounded border font-bold text-sm font-mono tracking-widest ${threatScore.level === 'CRITICO' ? 'bg-red-950/40 border-red-500 text-red-400' : threatScore.level === 'ALTO' ? 'bg-orange-950/40 border-orange-500 text-orange-400' : threatScore.level === 'MEDIO' ? 'bg-yellow-950/40 border-yellow-500 text-yellow-400' : 'bg-green-950/40 border-green-500 text-green-400'}`}>
              {threatScore.level}
            </div>
          </div>
          {threatScore.factors.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-zinc-500 font-bold">FACTORES DETECTADOS</div>
              {threatScore.factors.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] font-mono text-zinc-300">
                  <Activity size={10} className="mt-0.5 text-brand-cyan shrink-0" />{f}
                </div>
              ))}
            </div>
          )}
          {threatScore.conclusion && (
            <div className="bg-[#0a1628] border border-brand-cyan/30 rounded p-3 space-y-1">
              <div className="text-[10px] font-mono text-brand-cyan font-bold">CONCLUSIÓN INTELIGENCIA</div>
              <div className="text-[11px] font-mono text-white">{threatScore.conclusion.summary}</div>
              <div className="text-[10px] font-mono text-zinc-400">Evidencia: {threatScore.conclusion.evidence}</div>
              <div className="flex gap-3 mt-1">
                <span className="text-[9px] font-mono text-zinc-500">RIESGO: <span className="text-red-400">{threatScore.conclusion.risk}</span></span>
                <span className="text-[9px] font-mono text-zinc-500">CONFIANZA: <span className="text-brand-cyan">{threatScore.conclusion.confidence}</span></span>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-zinc-500 font-bold border-t border-brand-border/40 pt-3">COMANDOS DE MITIGACION</div>
            <div className="grid grid-cols-1 gap-2">
              {threatScore.mitigationCommands.map((item, i) => (
                <div key={i} className="bg-[#05070a] border border-brand-border/60 rounded p-2.5">
                  <div className="text-[9px] font-mono text-zinc-500 mb-1">{item.label}</div>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-[10px] font-mono text-green-300 flex-1 break-all">{item.cmd}</code>
                    <button onClick={() => copyCmd(item.cmd)} className={`shrink-0 p-1.5 rounded border transition text-[9px] font-mono flex items-center gap-1 ${copiedCmd === item.cmd ? 'border-green-500 text-green-400 bg-green-950/30' : 'border-brand-border text-zinc-500 hover:border-brand-cyan hover:text-brand-cyan'}`}>
                      <Copy size={10} />{copiedCmd === item.cmd ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Panel */}
      {osintResult && (
        <div className="mt-5 bg-brand-panel border border-brand-cyan/20 p-5 rounded-lg shadow-2xl space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-brand-border/60">
            <h4 className="text-sm font-bold font-sans text-brand-cyan tracking-wider flex items-center gap-2">
              <Zap size={16} className="text-brand-cyan" />
              INFORME DE INTELIGENCIA IA — GEMINI
            </h4>
            <button
              onClick={handleAiAnalysis}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-brand-cyan/30 to-brand-green/30 hover:from-brand-cyan/40 hover:to-brand-green/40 border border-brand-cyan/45 text-white font-bold text-xs rounded transition disabled:opacity-50 active:scale-95"
            >
              {aiLoading ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
              {aiLoading ? 'Analizando con IA...' : 'Generar Informe IA'}
            </button>
          </div>

          {aiError && (
            <div className="bg-red-950/30 border border-red-700/40 rounded p-2 text-[10px] text-red-400 font-mono flex items-center gap-2">
              <AlertCircle size={12} />
              {aiError}
            </div>
          )}

          {!aiAnalysis && !aiLoading && !aiError && (
            <div className="text-center py-4 text-zinc-600 text-xs font-mono">
              Pulsa "Generar Informe IA" para que Gemini analice los resultados OSINT y genere un informe de amenazas.
            </div>
          )}

          {aiAnalysis && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded p-4 text-xs text-zinc-300 font-sans leading-relaxed max-h-96 overflow-y-auto markdown-osint">
              <ReactMarkdown
                components={{
                  h1: ({children}) => <h1 className="text-white font-bold text-sm mt-4 mb-2 border-b border-zinc-700 pb-1">{children}</h1>,
                  h2: ({children}) => <h2 className="text-white font-bold text-xs mt-4 mb-1 border-b border-zinc-700 pb-1">{children}</h2>,
                  h3: ({children}) => <h3 className="text-brand-cyan font-bold text-[11px] mt-3 mb-1">{children}</h3>,
                  h4: ({children}) => <h4 className="text-brand-green font-bold text-[11px] mt-2 mb-1">{children}</h4>,
                  p: ({children}) => <p className="text-zinc-400 mb-2 leading-relaxed">{children}</p>,
                  ul: ({children}) => <ul className="space-y-1 mb-2 ml-2">{children}</ul>,
                  ol: ({children}) => <ol className="space-y-1 mb-2 ml-4 list-decimal">{children}</ol>,
                  li: ({children}) => <li className="flex gap-2 text-zinc-300"><span className="text-brand-cyan shrink-0 mt-0.5">•</span><span>{children}</span></li>,
                  code: ({inline, children}: any) => {
                    if (inline) return <code className="bg-[#0d1117] text-green-300 px-1.5 py-0.5 rounded text-[10px] font-mono">{children}</code>;
                    return <pre className="bg-[#0d1117] border border-brand-border rounded p-3 text-[10px] font-mono text-green-300 overflow-x-auto my-2 whitespace-pre-wrap"><code>{children}</code></pre>;
                  },
                  strong: ({children}: any) => <strong className="text-white font-bold">{children}</strong>,
                  em: ({children}: any) => <em className="text-zinc-300 italic">{children}</em>,
                  hr: () => { return <hr className="border-zinc-700 my-3" />; },
                  blockquote: ({children}: any) => <blockquote className="border-l-2 border-brand-cyan pl-3 text-zinc-400 italic my-2">{children}</blockquote>,
                  a: ({href, children}: any) => { return <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-cyan hover:underline">{children}</a>; },
                }}
              >
                {aiAnalysis}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
  );
};
