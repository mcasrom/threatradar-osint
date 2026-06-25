import React, { useState, useEffect } from 'react';
import { ThreatAlert } from '../types';
import { Maximize2, Minimize2, MapPin, Eye, Compass, ShieldAlert, FileText, Download, Activity } from 'lucide-react';

interface GeoMapProps {
  alerts: ThreatAlert[];
  hoveredAlert: ThreatAlert | null;
  onHoverAlert: (alert: ThreatAlert | null) => void;
}

export const SimplifiedVectorMap: React.FC<GeoMapProps> = ({ alerts, hoveredAlert, onHoverAlert }) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('GLOBAL');
  const [viewHeatmap, setViewHeatmap] = useState<boolean>(true);
  const [selectedAlertForInspection, setSelectedAlertForInspection] = useState<ThreatAlert | null>(null);

  // Central Hub Station (Europe / Germany)
  const targetX = 52.7;
  const targetY = 10.8;

  // Regional coordinates for world mapping
  const regionCountries: Record<string, string[]> = {
    'NORTEAMÉRICA': ['US','CA','MX'],
    'SUDAMÉRICA': ['BR','AR','CO','CL','PE','VE','EC','BO','PY','UY'],
    'EUROPA SOC CENTRAL': ['DE','FR','GB','IT','ES','NL','PL','RU','UA','SE','NO','FI','CH','AT','BE','CZ','RO'],
    'ASIA PACÍFICO': ['CN','JP','KR','IN','SG','TH','VN','ID','PH','MY','TW','HK'],
    'ÁFRICA CENTRAL': ['ZA','NG','KE','EG','ET','GH','TZ','MA','SN'],
    'ESTACIÓN AUSTRALIA': ['AU','NZ']
  };

  const filteredAlerts = selectedRegion === 'GLOBAL'
    ? alerts
    : alerts.filter(a => {
        const countries = regionCountries[selectedRegion] || [];
        return countries.includes(a.country);
      });

  const regionalCoordinates = [
    { name: 'Norteamérica', x: 22.0, y: 15.2 },
    { name: 'Sudamérica', x: 30.0, y: 32.0 },
    { name: 'Europa SOC Central', x: 52.7, y: 10.8 },
    { name: 'Asia Pacífico', x: 74.0, y: 19.4 },
    { name: 'África Central', x: 52.0, y: 25.0 },
    { name: 'Estación Australia', x: 82.0, y: 32.0 }
  ];

  // Equirectangular projection mapping
  const projectCoordinates = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 50;
    return {
      x: Math.max(2, Math.min(98, x)),
      y: Math.max(2, Math.min(48, y))
    };
  };


  return (
    <div id="geographical-vector-map-panel" className="bg-brand-panel border border-brand-border p-5 rounded-lg space-y-4 shadow-xl relative overflow-hidden">
      
      {/* Top Header controls */}
      <div className="flex flex-wrap justify-between items-center gap-2 pb-3 border-b border-brand-border/60 w-full">
        <div>
          <h3 className="text-sm font-bold font-sans text-brand-cyan tracking-wider flex items-center gap-2">
            <Compass size={16} className="animate-spin text-brand-cyan" style={{ animationDuration: '20s' }} /> 
            TACTICAL MULTI-VECTOR OSINT CYBERMAP
          </h3>
          <p className="text-[10px] text-zinc-400 font-sans mt-0.5">
            Intercepción de portadoras, ruteo malicioso pasivo y vectores de asalto geopolítico.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewHeatmap(!viewHeatmap)}
            className={`text-[10px] font-mono px-2.5 py-1 rounded transition border ${
              viewHeatmap 
                ? 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/40 shadow-[0_0_8px_rgba(0,242,255,0.2)]' 
                : 'bg-[#0b121f] text-zinc-500 border-brand-border'
            }`}
          >
            {viewHeatmap ? '🔥 Capa de Calor: ON' : '⚫ Capa de Calor: OFF'}
          </button>

        </div>
      </div>

      {/* High Fidelity Vector SVG Map - Improved Geography */}
      <div className="relative w-full aspect-[2/1] bg-[#070b13] border border-brand-border/80 rounded-lg overflow-hidden flex items-center justify-center">
        
        {/* Background Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,242,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,242,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
        
        {/* Cyber radar scan overlay */}
        <div className="absolute inset-x-0 h-[20%] bg-gradient-to-b from-transparent via-brand-cyan/10 to-transparent pointer-events-none animate-radar-scan opacity-60" />

        {/* Improved Geographically Accurate Vector Map */}
        <svg viewBox="0 0 100 50" className="absolute inset-0 w-full h-full select-none pointer-events-none z-10 opacity-[0.35]">
          {/* Antarctica - improved */}
          <path 
            d="M 2 48 L 10 47 L 20 46.5 L 30 46 L 40 45.8 L 50 45.8 L 60 46 L 70 46.5 L 80 47 L 90 47.5 L 98 48 L 98 49.5 L 2 49.5 Z"
            fill="#121e33" stroke="#00f2ff" strokeWidth="0.15" strokeOpacity="0.3" fillOpacity="0.5"
          />
          
          {/* Greenland - more accurate shape */}
          <path 
            d="M 30 3 L 32 2 L 34 1.5 L 36 2 L 38 3 L 39 4.5 L 38 6 L 36 7 L 34 7.5 L 32 7 L 30.5 5.5 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.2" strokeOpacity="0.4" fillOpacity="0.6"
          />
          
          {/* Iceland */}
          <path 
            d="M 37 8.5 L 38.5 8 L 39.5 8.5 L 39 9.5 L 37.5 9.5 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.2" strokeOpacity="0.4" fillOpacity="0.6"
          />
          
          {/* North America - significantly improved */}
          <path 
            d="M 3 7 L 5 5 L 8 4 L 12 3 L 16 2.5 L 20 3 L 24 4 L 27 5 L 29 6 L 31 7 L 32 8 L 31 10 L 30 12 L 28 14 L 27 16 L 26 18 L 25 19 L 24 20 L 23 21 L 22 22 L 20 21 L 19 19 L 18 17 L 17 15 L 16 13 L 15 11 L 14 10 L 13 9 L 12 8 L 10 7 L 8 7 L 6 7 L 4 7 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.25" strokeOpacity="0.5" fillOpacity="0.7"
          />
          
          {/* Central America - improved */}
          <path 
            d="M 22 22 L 23 23 L 24 24 L 25 25 L 24 26 L 23 25 L 22 24 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.2" strokeOpacity="0.4" fillOpacity="0.7"
          />
          
          {/* Caribbean Islands */}
          <path 
            d="M 26 21 L 27 20.5 L 28 21 L 27.5 21.5 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.15" strokeOpacity="0.3" fillOpacity="0.5"
          />
          <path 
            d="M 29 21.5 L 30 21 L 31 21.5 L 30.5 22 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.15" strokeOpacity="0.3" fillOpacity="0.5"
          />
          
          {/* South America - significantly improved */}
          <path 
            d="M 25 26 L 27 25 L 29 25.5 L 31 26 L 32 27 L 33 28 L 34 30 L 34 32 L 33 34 L 32 36 L 31 38 L 30 40 L 29 42 L 28 44 L 27 45 L 26 44 L 26 42 L 25 40 L 24 38 L 24 36 L 25 34 L 25 32 L 24 30 L 24 28 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.25" strokeOpacity="0.5" fillOpacity="0.7"
          />
          
          {/* United Kingdom & Ireland - improved */}
          <path 
            d="M 42 11 L 43 10 L 44 10.5 L 44.5 11.5 L 44 13 L 43 13.5 L 42.5 12.5 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.2" strokeOpacity="0.4" fillOpacity="0.6"
          />
          
          {/* Ireland */}
          <path 
            d="M 40.5 11.5 L 41.5 11 L 42 12 L 41.5 13 L 40.5 12.5 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.15" strokeOpacity="0.3" fillOpacity="0.5"
          />
          
          {/* Scandinavia - improved */}
          <path 
            d="M 47 5 L 48 4 L 49 3.5 L 50 4 L 51 5 L 51 7 L 50 8 L 49 9 L 48 8 L 47 7 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.2" strokeOpacity="0.4" fillOpacity="0.6"
          />
          
          {/* Finland */}
          <path 
            d="M 51 5 L 52 4.5 L 53 5 L 53 7 L 52 8 L 51 7 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.15" strokeOpacity="0.3" fillOpacity="0.5"
          />
          
          {/* Europe - significantly improved */}
          <path 
            d="M 42 14 L 44 13 L 46 13.5 L 48 12 L 49 11 L 50 10 L 51 10.5 L 52 11 L 52 13 L 51 14 L 50 15 L 49 16 L 48 17 L 47 17.5 L 46 17 L 45 16.5 L 44 16 L 43 15 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.25" strokeOpacity="0.5" fillOpacity="0.7"
          />
          
          {/* Iberian Peninsula */}
          <path 
            d="M 40 16 L 42 15.5 L 43 16 L 43 18 L 42 19 L 41 19 L 40 18 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.2" strokeOpacity="0.4" fillOpacity="0.6"
          />
          
          {/* Italy */}
          <path 
            d="M 46 16 L 47 15.5 L 48 16 L 48 17 L 47.5 18 L 47 19 L 46.5 20 L 46 19 L 45.5 18 L 45.5 17 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.2" strokeOpacity="0.4" fillOpacity="0.6"
          />
          
          {/* Balkans */}
          <path 
            d="M 48 16 L 49 15.5 L 50 16 L 50 17 L 49 18 L 48 17.5 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.15" strokeOpacity="0.3" fillOpacity="0.5"
          />
          
          {/* Africa - significantly improved */}
          <path 
            d="M 40 20 L 43 19 L 46 19 L 49 19 L 51 19.5 L 53 20 L 54 21 L 55 23 L 56 25 L 57 27 L 57 29 L 56 31 L 55 33 L 54 35 L 52 37 L 50 38 L 48 38 L 47 37 L 46 35 L 45 33 L 44 31 L 43 29 L 42 27 L 41 25 L 40 23 L 39 21 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.25" strokeOpacity="0.5" fillOpacity="0.7"
          />
          
          {/* Madagascar */}
          <path 
            d="M 55.5 32 L 56.5 31.5 L 57 32.5 L 56.5 34 L 55.5 33.5 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.2" strokeOpacity="0.4" fillOpacity="0.6"
          />
          
          {/* Middle East */}
          <path 
            d="M 52 17 L 54 16.5 L 56 17 L 57 18 L 57 19 L 56 20 L 54 20 L 53 19 L 52 18 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.2" strokeOpacity="0.4" fillOpacity="0.6"
          />
          
          {/* Russia/Central Asia - improved */}
          <path 
            d="M 53 10 L 56 9.5 L 60 9 L 65 8.5 L 70 8 L 75 8 L 80 8.5 L 85 9 L 90 9.5 L 94 10 L 96 11 L 95 12 L 92 13 L 88 14 L 84 15 L 80 16 L 76 17 L 72 18 L 68 19 L 64 20 L 60 21 L 56 20 L 54 19 L 53 17 L 52 15 L 52 13 L 52 11 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.25" strokeOpacity="0.5" fillOpacity="0.7"
          />
          
          {/* India */}
          <path 
            d="M 66 20 L 68 19.5 L 70 20 L 71 22 L 70 24 L 69 26 L 68 27 L 67 26 L 66 24 L 65 22 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.2" strokeOpacity="0.4" fillOpacity="0.6"
          />
          
          {/* China/East Asia */}
          <path 
            d="M 72 14 L 75 13 L 78 13.5 L 80 14 L 82 15 L 83 16 L 82 18 L 80 19 L 78 20 L 76 20 L 74 19 L 73 18 L 72 16 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.2" strokeOpacity="0.4" fillOpacity="0.6"
          />
          
          {/* Japan - improved */}
          <path 
            d="M 84 13 L 85 12.5 L 86 13 L 86.5 14.5 L 86 16 L 85 17 L 84 16.5 L 83.5 15 L 83.5 14 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.2" strokeOpacity="0.4" fillOpacity="0.6"
          />
          
          {/* Southeast Asia */}
          <path 
            d="M 74 22 L 76 21.5 L 78 22 L 79 23 L 78 24 L 76 25 L 74 24 L 73 23 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.2" strokeOpacity="0.4" fillOpacity="0.6"
          />
          
          {/* Indonesia - improved */}
          <path 
            d="M 76 27 L 78 26.5 L 80 27 L 82 28 L 81 29 L 79 29.5 L 77 29 L 76 28 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.2" strokeOpacity="0.4" fillOpacity="0.6"
          />
          
          {/* Philippines */}
          <path 
            d="M 81 24 L 82 23.5 L 82.5 24.5 L 82 25.5 L 81 25 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.15" strokeOpacity="0.3" fillOpacity="0.5"
          />
          
          {/* Australia - improved */}
          <path 
            d="M 80 29 L 83 28 L 86 28.5 L 89 29 L 91 30 L 92 31.5 L 91 33 L 89 34 L 87 35 L 84 35.5 L 82 35 L 80 34 L 79 32 L 79 30 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.25" strokeOpacity="0.5" fillOpacity="0.7"
          />
          
          {/* New Zealand */}
          <path 
            d="M 89 37 L 90 36.5 L 90.5 37.5 L 90 38.5 L 89 38 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.2" strokeOpacity="0.4" fillOpacity="0.6"
          />
          <path 
            d="M 90.5 39 L 91 38.5 L 91.5 39.5 L 91 40.5 L 90.5 40 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.15" strokeOpacity="0.3" fillOpacity="0.5"
          />
          
          {/* Pacific Islands */}
          <path 
            d="M 85 26 L 86 25.5 L 86.5 26.5 L 85.5 27 Z"
            fill="#162540" stroke="#00f2ff" strokeWidth="0.1" strokeOpacity="0.2" fillOpacity="0.4"
          />
        </svg>

        {/* Tactical sweeping circular radar scopes */}
        <div className="absolute w-48 h-48 rounded-full border border-brand-cyan/5 pointer-events-none flex items-center justify-center left-[10%] top-[20%] animate-pulse-soft" />
        <div className="absolute w-72 h-72 rounded-full border border-brand-cyan/5 pointer-events-none flex items-center justify-center right-[5%] bottom-[10%] animate-pulse-soft" style={{ animationDelay: '1.5s' }} />

        {/* Central SOC Target Station Marker */}
        <div 
          style={{ left: `${targetX}%`, top: `${targetY}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-40 flex items-center justify-center cursor-default group"
        >
          <div className="absolute -inset-4 rounded-full border border-brand-cyan/45 bg-brand-cyan/5 animate-ping opacity-75" style={{ animationDuration: '4s' }} />
          <div className="w-5 h-5 rounded-full bg-brand-bg border-2 border-brand-cyan flex items-center justify-center shadow-[0_0_12px_#00f2ff] relative z-20">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
          </div>
          <div className="absolute left-6 bg-[#070b13]/95 border border-brand-cyan/60 text-brand-cyan text-[8px] font-mono px-1.5 py-0.5 rounded shadow whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            🛡️ CENTRAL SOC (EUROPE)
          </div>
        </div>

        {/* Animated Cyber Attack Arcs */}
        <svg viewBox="0 0 100 50" className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
          {filteredAlerts.map((alert) => {
            const { x, y } = projectCoordinates(alert.latitude, alert.longitude);
            const isHovered = hoveredAlert?.id === alert.id;
            
            const ctrlX = (x + targetX) / 2;
            const ctrlY = Math.min(y, targetY) - 15;

            const severityColors = {
              CRITICAL: '#ff3131',
              HIGH: '#fbbf24',
              MEDIUM: '#00f2ff',
              LOW: '#39ff14'
            };
            const strokeColor = severityColors[alert.severity] || severityColors.LOW;

            return (
              <g key={`arc-${alert.id}`}>
                <path
                  d={`M ${x} ${y} Q ${ctrlX} ${ctrlY} ${targetX} ${targetY}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isHovered ? 1.0 : 0.35}
                  className="opacity-30 transition-all duration-300"
                />
                
                <path
                  d={`M ${x} ${y} Q ${ctrlX} ${ctrlY} ${targetX} ${targetY}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isHovered ? 1.5 : 0.7}
                  className="animate-cyber-dash opacity-85 transition-all duration-300"
                />
              </g>
            );
          })}
        </svg>

        {/* Live Threat Alert Points */}
        {filteredAlerts.map((alert) => {
          const { x, y } = projectCoordinates(alert.latitude, alert.longitude);
          const severityColors = {
            CRITICAL: { color: 'text-brand-red', bg: 'bg-brand-red', ring: 'border-brand-red/60', pulse: 'via-brand-red' },
            HIGH: { color: 'text-brand-yellow', bg: 'bg-brand-yellow', ring: 'border-brand-yellow/60', pulse: 'via-brand-yellow' },
            MEDIUM: { color: 'text-brand-cyan', bg: 'bg-brand-cyan', ring: 'border-brand-cyan/50', pulse: 'via-brand-cyan' },
            LOW: { color: 'text-brand-green', bg: 'bg-brand-green', ring: 'border-brand-green/45', pulse: 'via-brand-green' }
          };
          const style = severityColors[alert.severity] || severityColors.LOW;
          const isHovered = hoveredAlert?.id === alert.id;

          return (
            <div
              key={alert.id}
              style={{ left: `${x}%`, top: `${y}%` }}
              onMouseEnter={() => {
                onHoverAlert(alert);
                setSelectedAlertForInspection(alert);
              }}
              onMouseLeave={() => onHoverAlert(null)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 group"
            >
              <div className={`absolute -inset-2.5 rounded-full bg-gradient-to-r from-transparent ${style.pulse} to-transparent opacity-40 scale-[2.2] animate-ping`} />
              
              <div className={`w-3 h-3 rounded-full ${style.bg} border-2 border-white relative transition-transform duration-300 ${
                isHovered ? 'scale-150 shadow-[0_0_12px_rgba(0,242,255,0.9)]' : 'scale-100'
              }`} />

              <div className="absolute left-1/2 -translate-x-1/2 bottom-4 hidden group-hover:block bg-[#070b13]/95 border border-brand-border text-[10px] p-2.5 rounded w-52 shadow-2xl z-50 font-mono text-zinc-300 backdrop-blur-md">
                <div className="flex justify-between items-center border-b border-brand-border pb-1 mb-1.5">
                  <span className={`font-bold uppercase ${style.color} text-[8px] tracking-wider`}>⚠️ {alert.severity}</span>
                  <span className="text-[8px] text-zinc-500">{alert.timestamp}</span>
                </div>
                <span className="font-bold text-white block truncate text-[11px]">{alert.attackType}</span>
                <span className="block text-zinc-400 mt-1">📟 IP Origen: {alert.sourceIp}</span>
                <span className="block text-zinc-400">📍 Origen: {alert.country}</span>
                <span className="block text-zinc-400">🚪 Puerto Dest: {alert.destinationPort}</span>
                <div className="mt-1.5 pt-1.5 border-t border-brand-border/50 text-[8px] text-brand-cyan flex justify-between">
                  <span>LAT: {alert.latitude.toFixed(2)}</span>
                  <span>LNG: {alert.longitude.toFixed(2)}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Heatmaps Overlay Layer */}
        {viewHeatmap && filteredAlerts.map((alert, idx) => {
          const { x, y } = projectCoordinates(alert.latitude, alert.longitude);
          return (
            <div
              key={`heatmap-${idx}`}
              style={{ left: `${x}%`, top: `${y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-brand-red/10 blur-xl mix-blend-screen pointer-events-none animate-pulse"
            />
          );
        })}

        {/* Quick Region Selector */}
        <div className="absolute bottom-2.5 left-2.5 flex flex-wrap gap-1.5 z-40 bg-[#070b13]/90 p-1.5 border border-brand-border/60 rounded backdrop-blur">
          {regionalCoordinates.map((reg) => (
            <button
              key={reg.name}
              onClick={() => setSelectedRegion(reg.name.toUpperCase())}
              className={`text-[8px] font-mono px-2 py-0.5 rounded transition ${
                selectedRegion === reg.name.toUpperCase() 
                  ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/45 font-bold shadow' 
                  : 'text-zinc-500 hover:text-zinc-300 bg-transparent border border-transparent'
              }`}
            >
              {reg.name}
            </button>
          ))}
        </div>
      </div>

      {/* Cyber HUD Telemetry Bottom Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3.5 bg-brand-header/80 border border-brand-border rounded-lg font-mono text-zinc-300 text-xs">
        
        <div className="space-y-1">
          <span className="text-[10px] text-zinc-500 font-bold tracking-wider block">ANÁLISIS DE COORDENADAS</span>
          {selectedAlertForInspection || hoveredAlert || alerts[0] ? (
            <div className="space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-zinc-400">País Origen:</span>
                <span className="font-bold text-white">{(selectedAlertForInspection || hoveredAlert || alerts[0]).country}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Ruta Satelital:</span>
                <span className="text-brand-cyan font-semibold">
                  {(selectedAlertForInspection || hoveredAlert || alerts[0]).latitude.toFixed(4)}°N, {(selectedAlertForInspection || hoveredAlert || alerts[0]).longitude.toFixed(4)}°W
                </span>
              </div>
            </div>
          ) : (
            <span className="text-zinc-500 italic block text-[10px]">Pase el puntero sobre una IP...</span>
          )}
        </div>

        <div className="space-y-1 border-t md:border-t-0 md:border-l border-brand-border/60 pt-2 md:pt-0 md:pl-4">
          <span className="text-[10px] text-zinc-500 font-bold tracking-wider block">MODULACIÓN DE RED OSINT</span>
          <div className="flex items-center gap-2 mt-1">
            <Activity size={14} className="text-brand-green animate-pulse" />
            <div>
              <span className="text-[11px] text-white block">Espectro: <strong className="text-brand-green">942.85 MHz</strong></span>
              <span className="text-[9px] text-zinc-500 block">Frecuencia de muestreo pasivo</span>
            </div>
          </div>
        </div>

        <div className="space-y-1 border-t md:border-t-0 md:border-l border-brand-border/60 pt-2 md:pt-0 md:pl-4 md:col-span-2">
          <span className="text-[10px] text-zinc-500 font-bold tracking-wider block">ACTUALIZACIÓN TÁCTICA DEL EVENTO</span>
          {selectedAlertForInspection || hoveredAlert || alerts[0] ? (
            <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
              La dirección IP <strong className="text-zinc-200">{(selectedAlertForInspection || hoveredAlert || alerts[0]).sourceIp}</strong> ha iniciado un vector de asalto del tipo <strong className="text-brand-yellow">{(selectedAlertForInspection || hoveredAlert || alerts[0]).attackType}</strong> contra el rango local, mitigado de manera autónoma por la estación defensiva base.
            </p>
          ) : (
            <span className="text-zinc-500 italic block text-[10px]">No hay anomalías seleccionadas para el filtrado.</span>
          )}
        </div>
      </div>

    </div>
  );
};
