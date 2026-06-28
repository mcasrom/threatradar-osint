import React, { useState, useEffect } from 'react';
import { SimplifiedVectorMap } from './components/SimplifiedVectorMap';
import { AlertSimulator } from './components/AlertSimulator';
import { IPTesterAndManual } from './components/IPTesterAndManual';
import { OSINTModulesManager } from './components/OSINTModulesManager';
import { PremiumAIChat } from './components/PremiumAIChat';
import { AutoReportsManager } from './components/AutoReportsManager';
import { MonetizationPanel } from './components/MonetizationPanel';
import { FAQs, About, Methodology, Sources } from './components/StaticInfo';
import { AuthPanel } from './components/AuthPanel';
import { AuditPanel } from './components/AuditPanel';
import { LegalPanel } from './components/LegalPanel';
import { ScanHistoryPanel } from './components/ScanHistoryPanel';
import { PricingPage } from './components/PricingPage';
import { UserDashboard } from './components/UserDashboard';
import { ThreatAlert } from './types';
import {
  Shield,
  Activity,
  Zap,
  Globe,
  Monitor,
  Share2,
  Copy,
  Download,
  Terminal,
  HelpCircle,
  FileSpreadsheet,
  AlertOctagon,
  BookOpen,
  Mail,
  Scale,
} from 'lucide-react';

export default function App() {
  // Modo ventana independiente: /?mode=map
  const isMapOnly = new URLSearchParams(window.location.search).get('mode') === 'map';

  const [alerts, setAlerts] = useState<ThreatAlert[]>([]);
  const [hoveredAlert, setHoveredAlert] = useState<ThreatAlert | null>(null);
  const [activeTab, setActiveTab] = useState<'monitor' | 'osint' | 'ai-report' | 'dispatch' | 'billing' | 'pricing' | 'docs' | 'dashboard' | 'audit' | 'legal' | 'historial'>('monitor');
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [serverStatus, setServerStatus] = useState<any>(null);

  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => setServerStatus(data))
      .catch(() => setServerStatus({ status: 'offline' }));
  }, []);

  // Cargar C2 activos reales desde ThreatFox via API
  useEffect(() => {
    const loadThreatMap = () => {
      fetch('/api/threatmap/live')
        .then(res => res.json())
        .then(data => {
          if (data.points && data.points.length > 0) {
            const mapped: ThreatAlert[] = data.points.map((p: any) => ({
              id: `tf-${p.ip}-${p.port}`,
              sourceIp: p.ip,
              latitude: p.lat,
              longitude: p.lon,
              country: p.country || 'Unknown',
              attackType: p.threat_type || 'botnet_cc',
              severity: 'critical' as const,
              timestamp: p.first_seen || new Date().toISOString(),
              malware: p.malware || '',
              port: p.port,
              source: 'ThreatFox'
            }));
            setAlerts(mapped.slice(0, 50));
          }
        })
        .catch(() => {});
    };
    // Cargar scan_history y añadir al mapa como puntos cyan
    fetch('/api/history', { headers: { 'Authorization': `Bearer ${localStorage.getItem('tr_token') || ''}` } })
      .then(r => r.json())
      .then(data => {
        if (data.history && data.history.length > 0) {
          const historyAlerts: ThreatAlert[] = data.history
            .filter((s: any) => s.latitude != null && s.longitude != null)
            .map((s: any) => ({
              id: `scan-${s.id}`,
              sourceIp: s.ip,
              latitude: s.latitude,
              longitude: s.longitude,
              country: s.country || 'Unknown',
              attackType: 'scan',
              severity: 'info' as const,
              timestamp: s.created_at,
              source: 'ScanHistory',
              score: s.threat_score,
              level: s.threat_level || 'INFO',
            }));
          setAlerts(prev => [...prev, ...historyAlerts].slice(0, 100));
        }
      })
      .catch(() => {});

    loadThreatMap();
    const interval = setInterval(loadThreatMap, 5 * 60 * 1000); // refresh cada 5min
    return () => clearInterval(interval);
  }, []);

  const handleTriggerAlert = (newAlert: ThreatAlert) => {
    setAlerts((prev) => [newAlert, ...prev].slice(0, 50));
  };

  const handleShare = (platform: 'twitter' | 'linkedin' | 'whatsapp' | 'copy') => {
    const text = 'ThreatRadar OSINT: Estación defensiva e inteligencia de fuentes abiertas en tiempo real.';
    const url = 'https://threatradar.viajeinteligencia.com';
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    } else {
      navigator.clipboard.writeText(url);
      setShareSuccess('Enlace del SOC copiado al portapapeles!');
      setTimeout(() => setShareSuccess(null), 3000);
    }
  };

  const handlePremiumManualDownload = () => {
    setDownloadSuccess(true);
    const docText = `THREATRADAR OSINT v2.0 - MANUAL DEL USUARIO
======================================================
Generado: ${new Date().toLocaleDateString()}
Version: 2.0 | Estado: Produccion

1. INTRODUCCION
ThreatRadar OSINT es una plataforma de inteligencia de amenazas en tiempo real
con APIs OSINT reales, auth JWT, planes de uso y mapa geografico de amenazas.

2. APIS OSINT INTEGRADAS (DATOS REALES)
- Shodan:     Dispositivos expuestos, puertos, servicios, vulnerabilidades
- AbuseIPDB:  Score de abuso, reportes, historial de IPs maliciosas
- VirusTotal: Reputacion, detecciones de motores AV
- Hunter.io:  Descubrimiento de emails por dominio
- ip-api.com: Geolocalizacion precisa de IPs

3. ENDPOINTS API
- POST /api/auth/register        Registro de usuario
- POST /api/auth/login           Login, devuelve JWT 7 dias
- GET  /api/auth/me              Perfil autenticado
- GET  /api/user/usage           Scans usados vs limite del plan
- GET  /api/osint/ip-full/:ip    Scan completo (Shodan+AbuseIPDB+VT)
- GET  /api/osint/shodan/:ip     Datos Shodan
- GET  /api/osint/abuseipdb/:ip  Score de abuso
- GET  /api/osint/virustotal/:ip Reputacion VirusTotal
- GET  /api/osint/hunter/:domain Emails de un dominio

4. PLANES Y LIMITES
- Free:       10 scans/mes | Shodan + AbuseIPDB
- Pro:        Ilimitado    | Todas las fuentes OSINT
- Enterprise: Ilimitado    | Todo + prioridad + webhooks

5. MODULOS OSINT TERMINAL
Nmap, DNS Recon, theHarvester, WHOIS, SSL Scanner,
Nikto, Subfinder, Nuclei, OWASP Amass, Shodan CLI

6. MOTOR IA
Google Gemini para analisis de amenazas, informes tacticos y chat interactivo.

7. SEGURIDAD
JWT auth, rate limiting, Helmet, CORS, inputs sanitizados.

8. DESPACHO AUTOMATICO
Reportes programados por email (SMTP) y webhooks.`;

    const blob = new Blob([docText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ThreatRadar-OSINT-Manual.txt';
    link.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  // Render standalone map window
  if (isMapOnly) {
    return (
      <div className="min-h-screen bg-brand-bg p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-brand-green font-mono text-sm font-bold">⬡ THREATRADAR — LIVE THREAT MAP</span>
          <span className="text-zinc-500 text-xs font-mono">{new Date().toUTCString()}</span>
        </div>
        <SimplifiedVectorMap
          alerts={alerts}
          hoveredAlert={hoveredAlert}
          onHoverAlert={setHoveredAlert}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-zinc-100 flex flex-col justify-between font-sans selection:bg-brand-cyan selection:text-black">
      {/* Header */}
      <header className="bg-brand-header border-b border-brand-border px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center text-brand-cyan">
            <Shield size={20} className="animate-pulse" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-widest text-white font-sans flex items-center gap-2">
              THREATRADAR OSINT <span className="text-[10px] bg-brand-red/20 text-brand-red border border-brand-red/30 rounded font-mono px-1.5 py-0.5">V2.0</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-mono block">TERMINAL DE VISUALIZACIÓN DEFENSIVA Y MONITOREO OSINT</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 bg-brand-panel/40 p-2 border border-brand-border rounded text-[10px] font-mono text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Activity size={12} className={serverStatus?.status === 'online' ? 'text-brand-green' : 'text-brand-red'} />
            <span>SISTEMA: <strong className={serverStatus?.status === 'online' ? 'text-brand-green' : 'text-brand-red'}>{serverStatus?.status || 'loading'}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="text-brand-cyan" size={12} />
            <span>INCIDENTES: <strong className="text-white font-bold">{alerts.length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Terminal className="text-zinc-500" size={12} />
            <span>MÓDULOS: <strong className="text-brand-cyan font-bold">{serverStatus?.modulesCount || 0}</strong></span>
          </div>
        </div>
        <AuthPanel />
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 gap-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 bg-brand-header p-1 border border-brand-border rounded-lg">
          <button
            onClick={() => setActiveTab('monitor')}
            className={`flex-1 py-2 px-3 text-xs font-sans font-semibold rounded-md transition flex justify-center items-center gap-2 ${
              activeTab === 'monitor' ? 'bg-brand-cyan text-brand-bg shadow font-bold' : 'text-zinc-400 hover:bg-brand-panel hover:text-white'
            }`}
          >
            <Monitor size={14} /> Monitor de Coordenadas
          </button>
          <button
            onClick={() => setActiveTab('osint')}
            className={`flex-1 py-2 px-3 text-xs font-sans font-semibold rounded-md transition flex justify-center items-center gap-2 ${
              activeTab === 'osint' ? 'bg-brand-cyan text-brand-bg shadow font-bold' : 'text-zinc-400 hover:bg-brand-panel hover:text-white'
            }`}
          >
            <Activity size={14} /> Plugins /modules/osint
          </button>
          <button
            onClick={() => setActiveTab('ai-report')}
            className={`flex-1 py-2 px-3 text-xs font-sans font-semibold rounded-md transition flex justify-center items-center gap-2 ${
              activeTab === 'ai-report' ? 'bg-brand-cyan text-brand-bg shadow font-bold' : 'text-zinc-400 hover:bg-brand-panel hover:text-white'
            }`}
          >
            <Terminal size={14} /> Motor Premium IA
          </button>
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`flex-1 py-2 px-3 text-xs font-sans font-semibold rounded-md transition flex justify-center items-center gap-2 ${
              activeTab === 'dispatch' ? 'bg-brand-cyan text-brand-bg shadow font-bold' : 'text-zinc-400 hover:bg-brand-panel hover:text-white'
            }`}
          >
            <Mail size={14} /> Despacho Automático
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`flex-1 py-2 px-3 text-xs font-sans font-semibold rounded-md transition flex justify-center items-center gap-2 ${
              activeTab === 'billing' ? 'bg-brand-cyan text-brand-bg shadow font-bold' : 'text-zinc-400 hover:bg-brand-panel hover:text-white'
            }`}
          >
            <FileSpreadsheet size={14} /> Monetización Stripe
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded text-[11px] font-sans transition ${
              activeTab === 'dashboard' ? 'bg-brand-cyan text-brand-bg shadow font-bold' : 'text-zinc-400 hover:bg-brand-panel hover:text-white'
            }`}
          >
            Mi Cuenta
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`flex-1 py-2 px-3 text-xs font-sans font-semibold rounded-md transition flex justify-center items-center gap-2 ${
              activeTab === 'pricing' ? 'bg-brand-cyan text-brand-bg shadow font-bold' : 'text-zinc-400 hover:bg-brand-panel hover:text-white'
            }`}
          >
            <Zap size={14} /> Precios
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex-1 py-2 px-3 text-xs font-sans font-semibold rounded-md transition flex justify-center items-center gap-2 ${
              activeTab === 'docs' ? 'bg-brand-cyan text-brand-bg shadow font-bold' : 'text-zinc-400 hover:bg-brand-panel hover:text-white'
            }`}
          >
            <BookOpen size={14} /> FAQs & Metodología
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex-1 py-2 px-3 text-xs font-sans font-semibold rounded-md transition flex justify-center items-center gap-2 ${
              activeTab === 'audit' ? 'bg-brand-cyan text-brand-bg shadow font-bold' : 'text-zinc-400 hover:bg-brand-panel hover:text-white'
            }`}
          >
            <Activity size={14} /> Auditoría
          </button>
          <button
            onClick={() => setActiveTab('legal')}
            className={`flex-1 py-2 px-3 text-xs font-sans font-semibold rounded-md transition flex justify-center items-center gap-2 ${
              activeTab === 'legal' ? 'bg-brand-cyan text-brand-bg shadow font-bold' : 'text-zinc-400 hover:bg-brand-panel hover:text-white'
            }`}
          >
            <Scale size={14} /> Legal
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`flex-1 py-2 px-3 text-xs font-sans font-semibold rounded-md transition flex justify-center items-center gap-2 ${
              activeTab === 'historial' ? 'bg-brand-cyan text-brand-bg shadow font-bold' : 'text-zinc-400 hover:bg-brand-panel hover:text-white'
            }`}
          >
            <Activity size={14} /> Historial
          </button>
        </div>

        {/* Tab content */}
        <div className="space-y-6">
          {activeTab === 'monitor' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <SimplifiedVectorMap
                  alerts={alerts}
                  hoveredAlert={hoveredAlert}
                  onHoverAlert={setHoveredAlert}
                />
                
                {/* Demo Visual — colapsado por defecto */}
                <details className="bg-brand-panel border border-brand-border rounded-lg overflow-hidden">
                  <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-brand-bg/40 transition list-none">
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 rounded px-2 py-0.5 font-mono">DEMO</span>
                    <span className="text-[12px] font-sans font-medium text-zinc-400">Simulador visual de ataques</span>
                    <span className="text-[10px] text-zinc-600 font-mono ml-auto">Simulación ficticia — no analiza IPs reales</span>
                  </summary>
                  <div className="border-t border-brand-border/40 p-4">
                    <div className="text-[10px] font-mono text-zinc-500 mb-3 bg-zinc-900/60 border border-zinc-800 rounded px-3 py-2">
                      ⚠️ Esta herramienta genera ataques <strong className="text-zinc-300">ficticios</strong> para visualizar cómo reacciona el mapa en tiempo real. Los datos son simulados y no representan amenazas reales. Útil para demos y presentaciones.
                    </div>
                    <AlertSimulator onTriggerAlert={handleTriggerAlert} />
                  </div>
                </details>

                <IPTesterAndManual onTriggerAlert={handleTriggerAlert} />
              </div>

              <div className="bg-brand-panel border border-brand-border rounded-lg p-4 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-brand-border pb-2">
                    <span className="text-[11px] font-bold text-zinc-400 font-mono tracking-wider">REAL-TIME THREAT FEED</span>
                    <span className="text-[9px] bg-brand-red/20 text-brand-red border border-brand-red/30 rounded font-mono px-2 py-0.5 font-bold">LIVE</span>
                  </div>

                  <div className="space-y-2.5 max-h-[28rem] overflow-y-auto pr-1">
                    {alerts.length === 0 ? (
                      <div className="text-center py-8 text-zinc-500 text-xs font-mono">
                        <AlertOctagon size={24} className="mx-auto mb-2 opacity-50" />
                        No hay amenazas activas.<br/>
                        Usa el simulador o inyecta una IP para comenzar.
                      </div>
                    ) : (
                      alerts.map((alt) => {
                        const severityStyles = {
                          CRITICAL: 'text-brand-red border-brand-red/40 bg-brand-red/10',
                          HIGH: 'text-brand-yellow border-brand-yellow/40 bg-brand-yellow/10',
                          MEDIUM: 'text-brand-cyan border-brand-cyan/40 bg-brand-cyan/10',
                          LOW: 'text-brand-green border-brand-green/30 bg-brand-green/10'
                        };
                        const style = severityStyles[alt.severity] || severityStyles.LOW;
                        const isHovered = hoveredAlert?.id === alt.id;

                        return (
                          <div
                            key={alt.id}
                            className={`p-3 rounded border transition ${style} ${
                              isHovered ? 'ring-1 ring-brand-cyan' : ''
                            }`}
                            onMouseEnter={() => setHoveredAlert(alt)}
                            onMouseLeave={() => setHoveredAlert(null)}
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-mono text-[10px] text-zinc-500">{alt.timestamp}</span>
                              <span className="text-[8px] font-bold font-mono px-1 py-0.5 border border-brand-border rounded bg-brand-bg/80">
                                PORT {alt.destinationPort}
                              </span>
                            </div>
                            
                            <h4 className="text-xs font-bold text-white font-sans mt-1">{alt.attackType}</h4>
                            
                            <div className="mt-2 flex justify-between items-center text-[10px] font-mono text-zinc-300 border-t border-brand-border/40 pt-1.5">
                              <span>SRC: {alt.sourceIp}</span>
                              <span>{alt.country}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-brand-border">
                  <button
                    onClick={handlePremiumManualDownload}
                    className="w-full bg-brand-header hover:bg-brand-border border border-brand-border text-brand-cyan font-sans text-xs font-bold py-2 rounded-md transition flex items-center justify-center gap-2 focus:outline-none"
                  >
                    <Download size={13} />
                    {downloadSuccess ? 'Documento Descargado' : 'Descargar Manual de Usuario'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'osint' && <OSINTModulesManager />}

          {activeTab === 'ai-report' && <PremiumAIChat />}

          {activeTab === 'dispatch' && <AutoReportsManager />}

          {activeTab === 'billing' && <MonetizationPanel />}

          {activeTab === 'pricing' && <PricingPage onNavigateToAuth={() => setActiveTab('billing')} />}
          {activeTab === 'dashboard' && <UserDashboard onNavigateToPricing={() => setActiveTab('pricing')} />}



          {activeTab === 'docs' && (
            <div className="space-y-6">
              <FAQs />
              <div className="grid md:grid-cols-3 gap-6">
                <About />
                <Methodology />
                <Sources />
              </div>
            </div>
          )}
          {activeTab === 'audit' && <AuditPanel />}

          {activeTab === 'legal' && <LegalPanel />}
          {activeTab === 'historial' && <ScanHistoryPanel />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-brand-header border-t border-brand-border px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
            <Share2 size={12} /> COMPARTIR SOC:
          </span>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleShare('twitter')}
              className="flex-1 sm:flex-none text-[10px] font-semibold bg-brand-panel border border-brand-border hover:bg-brand-border text-white px-3 py-1.5 rounded transition"
            >
              Compartir en X
            </button>
            <button
              onClick={() => handleShare('linkedin')}
              className="flex-1 sm:flex-none text-[10px] font-semibold bg-brand-panel border border-brand-border hover:bg-brand-border text-white px-3 py-1.5 rounded transition"
            >
              LinkedIn
            </button>
            <button
              onClick={() => handleShare('whatsapp')}
              className="flex-1 sm:flex-none text-[10px] font-semibold bg-brand-panel border border-brand-border hover:bg-brand-border text-white px-3 py-1.5 rounded transition"
            >
              WhatsApp
            </button>
            <button
              onClick={() => handleShare('copy')}
              className="flex-1 sm:flex-none text-[10px] font-semibold bg-brand-panel border border-brand-border hover:bg-brand-border text-white px-3 py-1.5 rounded transition flex items-center justify-center gap-1"
            >
              <Copy size={10} /> Copiar Enlace
            </button>
          </div>
          {shareSuccess && (
            <span className="text-[10px] text-emerald-400 font-mono">{shareSuccess}</span>
          )}
        </div>

        <div className="text-[10px] text-zinc-500 font-mono text-center md:text-right">
          <span>THREATRADAR OSINT • <a href="mailto:threatradar-osint@viajeinteligencia.com" className="text-brand-cyan hover:underline">threatradar-osint@viajeinteligencia.com</a></span>
        </div>
      </footer>
    </div>
  );
}
