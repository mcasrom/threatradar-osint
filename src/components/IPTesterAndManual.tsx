import React, { useState, useEffect } from 'react';
import { ThreatAlert } from '../types';
import { Globe, MapPin, Terminal, HelpCircle, ArrowRight, CheckCircle2, ShieldAlert, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';

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
      const res = await fetch('http://ip-api.com/json/');
      if (!res.ok) throw new Error('Respuesta del servidor de geolocalización no válida.');
      const data = await res.json();
      
      if (data && data.query) {
        setCustomIp(data.query);
        setResolvedGeo(data);
        if (!quiet) {
          addLog(`¡Exito! IP Detectada: ${data.query} (${data.org || 'ISP Desconocido'})`);
          addLog(`Ubicación: ${data.city}, ${data.country} [${data.lat}, ${data.lon}]`);
        }
        setStatusMessage({
          type: 'success',
          text: `IP autodetectada y geolocalizada: ${data.query} (${data.country})`
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
      const res = await fetch(`http://ip-api.com/json/${customIp}`);
      const data = await res.json();

      if (data && data.status === "success" && data.lat !== undefined) {
        setResolvedGeo(data);
        addLog(`IP resuelta para: ${data.country || 'Desconocido'}. Lat: ${data.lat}, Lng: ${data.lon}`);
        
        // Trigger high-fidelity threat alert originating from resolved IP targeting Central SOC
        const injectedAlert: ThreatAlert = {
          id: `ALT-USER-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          sourceIp: data.ip || customIp,
          destinationIp: '185.112.144.15', // Europe SOC
          sourcePort: Math.floor(Math.random() * 45000) + 12000,
          destinationPort: 443,
          country: data.country || 'Origen de Prueba',
          countryCode: data.country_code || 'TS',
          severity: 'CRITICAL',
          attackType: 'Handshake Táctico OSINT (Prueba de Usuario)',
          payload: `Inyección de sonda manual desde IP del operador militar. Geodatos: Lat=${data.lat} Lng=${data.lon}. Proveedor: ${data.org || 'Local ISP'}`,
          latitude: Number(data.lat),
          longitude: Number(data.lon),
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

  const handleOsintFull = async () => {
    if (!customIp) {
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
      const res = await fetch(`/api/osint/ip-full/${customIp}`, {
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
      addLog(`Análisis OSINT completo para ${customIp} — ${Object.keys(data).filter(k => data[k] && !data[k].error && k !== 'ip' && k !== 'timestamp').length} fuentes con datos.`);
    } catch (err: any) {
      setOsintError(err.message);
    } finally {
      setOsintLoading(false);
    }
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
              INYECTAR MI IP Y TEST EN MAPA GEOGRÁFICO
            </h4>
            <span className="text-[9px] bg-brand-cyan/20 text-brand-cyan font-mono px-2 py-0.5 border border-brand-cyan/35 rounded">
              MODO INTERACTIVO
            </span>
          </div>

          <p className="text-zinc-400 text-xs font-sans leading-relaxed">
            ¿Deseas probar tu propia dirección de enlace pública? Introduce tu IP o haz clic en autodetección para ubicar tu nodo en el mapamundi táctico y lanzar una simulación dedicada de contingencia.
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

      {/* Manual de Operación y Manual del Usuario Visible */}
      <div className="bg-brand-panel border border-brand-border p-5 rounded-lg space-y-4 shadow-2xl relative flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex justify-between items-center pb-2 border-b border-brand-border/60">
            <h4 className="text-sm font-bold font-sans text-brand-cyan tracking-wider flex items-center gap-2">
              <BookOpen size={16} />
              📖 MANUAL DE OPERACIÓN Y PRUEBAS TÁCTICAS
            </h4>
            <span className="text-[8px] border border-brand-border px-1.5 py-0.5 rounded text-zinc-500 font-mono">SOC HANDBOOK</span>
          </div>

          <p className="text-zinc-400 text-xs font-sans leading-relaxed">
            Siga esta guía rápida paso a paso para testear toda la suite cibernética y ver los flujos de red integrados en tiempo real:
          </p>

          <div className="space-y-2 pt-2.5 text-xs text-zinc-300 font-sans">
            <div className="flex items-start gap-2.5">
              <span className="bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/35 text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-bold font-mono mt-0.5 shrink-0">1</span>
              <div>
                <strong className="text-white block font-semibold">Testear Visualización de Mapa</strong>
                <span className="text-[11px] text-zinc-400 block leading-tight">Use la tarjeta izquierda ("Inyectar Mi IP") para registrar su IP o cualquier nodo público. Verá un láser trazarse directo al SOC Central europeo.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/35 text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-bold font-mono mt-0.5 shrink-0">2</span>
              <div>
                <strong className="text-white block font-semibold">Simular Amenazas en Tiempo Real</strong>
                <span className="text-[11px] text-zinc-400 block leading-tight">En la sección debajo del mapa, haga clic en "Secuencias Completa SOC" o lance payloads específicos para simular ataques tipo DDoS, Log4j o SQLi.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/35 text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-bold font-mono mt-0.5 shrink-0">3</span>
              <div>
                <strong className="text-white block font-semibold">Auditar con los Módulos OSINT Activos</strong>
                <span className="text-[11px] text-zinc-400 block leading-tight">Vaya a la pestaña "Plugins /modules/osint", introduzca su IP objetivos en la consola interactiva tipo terminal Bash, y ejecute un escaneo Nmap simulado.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/35 text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-bold font-mono mt-0.5 shrink-0">4</span>
              <div>
                <strong className="text-white block font-semibold">Generar Reporte IA Premium</strong>
                <span className="text-[11px] text-zinc-400 block leading-tight">Introduzca su organización y su perfil de infraestructura en la pestaña "Motor Premium IA" para que Gemini formule remediaciones y queries específicas de Shodan.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-brand-border/40 text-[9px] font-mono text-zinc-500 flex justify-between items-center">
          <span>Estándar: RFC 1918 & OSINT Framework v3.1</span>
          <span className="text-brand-cyan animate-pulse">● CONECTADO AL SOC CENTRAL</span>
        </div>
      </div>

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
            onClick={handleOsintFull}
            disabled={osintLoading || !customIp}
            className="ml-auto px-4 py-2 bg-gradient-to-r from-brand-cyan/30 to-brand-green/30 hover:from-brand-cyan/40 hover:to-brand-green/40 border border-brand-cyan/45 text-white font-bold text-xs rounded transition flex items-center gap-2 disabled:opacity-50 active:scale-95"
          >
            {osintLoading ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            {osintLoading ? 'Analizando...' : 'Lanzar Análisis OSINT'}
          </button>
        </div>

        {osintError && (
          <div className="bg-red-950/30 border border-red-700/40 rounded p-2 text-[10px] text-red-400 font-mono flex items-center gap-2">
            <AlertCircle size={12} />
            {osintError}
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
    </div>
  );
};
