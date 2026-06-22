import React, { useState, useEffect } from 'react';
import { Play, Shell, Plus, Terminal, RefreshCw, Send, ShieldAlert, Cpu } from 'lucide-react';
import { OSINTModule } from '../types';

export const OSINTModulesManager: React.FC = () => {
  const [modules, setModules] = useState<OSINTModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('nmap-scanner');
  const [targetQuery, setTargetQuery] = useState<string>('185.112.144.15');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [commandOutput, setCommandOutput] = useState<string>('');
  
  // Custom Module form
  const [showAddForm, setShowAddForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customCommand, setCustomCommand] = useState('');
  const [customFormat, setCustomFormat] = useState<'text' | 'json'>('text');

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await fetch('/api/modules');
      const data = await response.json();
      setModules(data);
    } catch (err) {
      console.error('Error fetching OSINT plugins:', err);
    }
  };

  const handleRunCommand = async () => {
    if (!targetQuery) return;
    setIsLoading(true);
    setCommandOutput('Inyectando variables de red en Lubuntu systems...\nEjecutando comando interactivo...');
    try {
      const response = await fetch('/api/modules/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: selectedModule,
          target: targetQuery
        })
      });
      const data = await response.json();
      if (data.output) {
        setCommandOutput(data.output);
      } else {
        setCommandOutput(data.error || 'Error ejecutando comando.');
      }
    } catch {
      setCommandOutput('No se pudo establecer conexión con el backend de analítica real.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customCommand) return;
    try {
      const response = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customName,
          description: customDescription,
          commandTemplate: customCommand,
          outputFormat: customFormat
        })
      });
      const data = await response.json();
      if (data.success) {
        fetchModules();
        setSelectedModule(data.module.id);
        setCustomName('');
        setCustomDescription('');
        setCustomCommand('');
        setShowAddForm(false);
      }
    } catch (err) {
      console.error('Error adding plugin:', err);
    }
  };

  return (
    <div id="osint-analyzer-panel" className="bg-brand-panel border border-brand-border p-5 rounded-lg space-y-4 font-sans">
      <div className="flex justify-between items-center w-full mb-1">
        <div>
          <h3 className="text-sm font-bold text-brand-green tracking-wider flex items-center gap-2">
            <Cpu size={16} /> SISTEMA EXTENSIBLE DE PLUGINS OSINT (CARPETA /MODULES/OSINT)
          </h3>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            Agregue plugins nativos que orquesten nmap, eyewitness o DNS Recon en su sistema corporativo.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-[10px] font-bold bg-brand-panel border border-brand-border hover:bg-brand-border text-white px-3 py-1 rounded transition flex items-center gap-1"
        >
          <Plus size={12} /> {showAddForm ? 'Cerrar Registro' : 'Registrar Plugin'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddModule} className="bg-[#0b121f] p-4 border border-brand-border rounded space-y-3 font-sans">
          <h4 className="text-xs font-bold text-white">REGISTRAR NUEVO ANALIZADOR</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] text-zinc-500 font-mono mb-1">NOMBRE DEL PLUGIN</label>
              <input
                type="text"
                placeholder="Ex. eyewitness-scan"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                required
                className="w-full bg-[#05070a]/80 border border-brand-border rounded p-1.5 text-xs text-white font-mono focus:border-brand-green focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] text-zinc-500 font-mono mb-1">DESCRIPCIÓN DE OPERACIÓN</label>
              <input
                type="text"
                placeholder="Ex. Capturador de screenshots de subdominios web"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                className="w-full bg-[#05070a]/80 border border-brand-border rounded p-1.5 text-xs text-white focus:border-brand-green focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] text-zinc-500 font-mono mb-1">PLANTILLA DE comando (USA {`{target}`} COMO VARIABLE)</label>
            <input
              type="text"
              placeholder="eyewitness --web -f {target}"
              value={customCommand}
              onChange={(e) => setCustomCommand(e.target.value)}
              required
              className="w-full bg-[#05070a]/80 border border-brand-border rounded p-1.5 text-xs text-white font-mono focus:border-brand-green focus:outline-none"
            />
          </div>

          <div className="flex gap-4 items-center">
            <span className="text-[9px] text-zinc-500 font-mono">FORMATO SALIDA</span>
            <div className="flex gap-3">
              <label className="text-xs text-zinc-300 flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  checked={customFormat === 'text'}
                  onChange={() => setCustomFormat('text')}
                />
                Text Raw
              </label>
              <label className="text-xs text-zinc-300 flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  checked={customFormat === 'json'}
                  onChange={() => setCustomFormat('json')}
                />
                JSON Formateado
              </label>
            </div>

            <button
              type="submit"
              className="ml-auto bg-brand-green hover:opacity-90 font-bold text-xs text-white px-4 py-1.5 rounded transition"
            >
              Confirmar Registro Plugin
            </button>
          </div>
        </form>
      )}

      {/* Control console panel */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Module Picker */}
        <div className="space-y-2">
          <label className="block text-[10px] text-zinc-500 font-mono">SELECCIONAR MÓDULO ACTIVO</label>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {modules.map((mod) => (
              <div
                key={mod.id}
                onClick={() => setSelectedModule(mod.id)}
                className={`p-2 border rounded cursor-pointer transition text-left ${
                  selectedModule === mod.id
                    ? 'bg-brand-green/20 border-brand-green text-brand-green font-bold'
                    : 'bg-[#0b121f] border-brand-border text-zinc-400 hover:border-brand-green/40'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold">{mod.name}</span>
                  <span className="text-[8px] font-mono bg-[#05070a]/90 px-1 py-0.5 rounded border border-brand-border">
                    v{mod.version}
                  </span>
                </div>
                <p className="text-[9px] mt-1 text-zinc-500 leading-tight truncate">{mod.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Console output display */}
        <div className="md:col-span-2 space-y-2 flex flex-col justify-between">
          <div>
            <label className="block text-[10px] text-zinc-500 font-mono">EJECUCIÓN DE COMANDOS INTERACTIVOS (BASH)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={targetQuery}
                onChange={(e) => setTargetQuery(e.target.value)}
                placeholder="Target IP o dominio, Ej. 185.112.144.15"
                className="w-full bg-[#0b121f] border border-brand-border rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-brand-green"
              />
              <button
                onClick={handleRunCommand}
                disabled={isLoading}
                className="bg-brand-green hover:opacity-90 font-bold text-xs text-white px-4 py-1.5 rounded flex items-center gap-1.5 transition whitespace-nowrap"
              >
                <Play size={12} />
                {isLoading ? 'Escaneando...' : 'Run Scan'}
              </button>
            </div>
          </div>

          <div className="bg-[#05070a]/90 rounded border border-brand-border p-3 h-32 md:h-36 overflow-y-auto font-mono text-[10px] text-brand-green space-y-1">
            <div className="flex justify-between items-center text-[8px] text-zinc-500 border-b border-brand-border/60 pb-1 mb-1.5">
              <span>SALIDA DE LA CONSOLA (LUBUNTU INTÉL)</span>
              <span>STATE: IDLE</span>
            </div>
            <pre className="whitespace-pre-wrap select-all cursor-text leading-relaxed">{commandOutput || 'Consola a la espera de inyección de parámetros...'}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
