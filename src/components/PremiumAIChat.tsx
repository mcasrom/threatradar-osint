import React, { useState, useEffect } from 'react';
import { Send, Terminal, Cpu, FileText, Download, CheckCircle, ShieldAlert } from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
}

export const PremiumAIChat: React.FC = () => {
  const [organization, setOrganization] = useState<string>('');
  const [infrastructure, setInfrastructure] = useState<string>('');
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [assessmentScore, setAssessmentScore] = useState<number | null>(null);

  // Generate tactical report initially
  const handleGenerateBaseReport = async () => {
    setIsGenerating(true);
    setGeneratedReport(null);
    setAssessmentScore(null);
    try {
      const token = localStorage.getItem('tr_token');
      const res = await fetch('/api/premium-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          organization,
          infrastructure
        })
      });
      const data = await res.json();
      if (data.report) {
        setGeneratedReport(data.report);
        setAssessmentScore(data.score);
        // seed chat context
        setChats([
          { sender: 'assistant', text: `Informe de riesgos generado para ${organization}. He analizado los vectores de ataque potenciales de tu infraestructura. ¿En qué area quieres profundizar? Puedes preguntarme sobre hardening, CVEs especificos, configuracion segura o plan de mitigacion.` }
        ]);
      } else {
        setGeneratedReport('No se pudo generar el reporte. Falló la comunicación con el motor de IA.');
      }
    } catch {
      setGeneratedReport('Fallo de conexión en el socket del host local.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;

    const userMsg = inputText;
    setInputText('');
    setChats(prev => [...prev, { sender: 'user', text: userMsg }]);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/premium-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization,
          infrastructure,
          customChatPrompt: userMsg,
          chatHistory: chats
        })
      });
      const data = await response.json();
      if (data.report) {
        setChats(prev => [...prev, { sender: 'assistant', text: data.report }]);
      } else {
        setChats(prev => [...prev, { sender: 'assistant', text: 'Error al procesar la pregunta.' }]);
      }
    } catch {
      setChats(prev => [...prev, { sender: 'assistant', text: 'Servicio de analítica sin conexión.' }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReportFile = (isMarkdown: boolean) => {
    if (!generatedReport) return;
    const blob = new Blob([generatedReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `threatradar-osint-assessment.${isMarkdown ? 'md' : 'txt'}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="premium-ai-intelligence-module" className="bg-brand-panel border border-brand-border p-5 rounded-lg space-y-5 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-brand-border pb-3">
        <div>
          <h3 className="text-sm font-bold text-brand-cyan tracking-wider flex items-center gap-1.5">
            <Cpu size={16} /> ANALISIS DE RIESGO — TU INFRAESTRUCTURA
          </h3>
          <p className="text-[10px] text-zinc-500">
            Describe tu infraestructura y obtén un análisis de riesgos con vectores de ataque, recomendaciones de hardening y chat IA para profundizar.
          </p>
        </div>
      </div>

      {/* Target specs */}
      <div className="grid sm:grid-cols-2 gap-4 bg-[#0b121f] p-4 rounded-lg border border-brand-border">
        <div className="space-y-1">
          <label className="text-[9px] text-zinc-500 font-mono block">TU ORGANIZACIÓN O PROYECTO</label>
          <input
            type="text"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="Mi empresa / Mi servidor / Mi proyecto"
            className="w-full bg-[#05070a]/80 border border-brand-border rounded p-2 text-xs text-white font-sans focus:outline-none focus:border-brand-cyan"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] text-zinc-500 font-mono block">DESCRIBE TU INFRAESTRUCTURA</label>
          <input
            type="text"
            value={infrastructure}
            onChange={(e) => setInfrastructure(e.target.value)}
            placeholder="Nginx en 443, SSH en 22, PostgreSQL, Ubuntu 22.04, Hetzner..."
            className="w-full bg-[#05070a]/80 border border-brand-border rounded p-2 text-xs text-white font-sans focus:outline-none focus:border-brand-cyan"
          />
        </div>

        <button
          onClick={handleGenerateBaseReport}
          disabled={isGenerating}
          className="sm:col-span-2 bg-brand-cyan hover:opacity-95 font-bold text-xs text-black py-2 px-4 rounded transition flex justify-center items-center gap-2 cursor-pointer"
        >
          <FileText size={14} />
          {isGenerating ? 'Analizando riesgos...' : 'Analizar riesgos y vectores de ataque'}
        </button>
      </div>

      {/* Report results & interactive chat workspace */}
      {(generatedReport || chats.length > 0) && (
        <div className="grid md:grid-cols-2 gap-5 pt-3">
          {/* Tactical Assessment Report Area */}
          <div className="bg-[#0b121f] border border-brand-border rounded-lg p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex justify-between items-center border-b border-brand-border pb-2 mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-brand-green" /> INFORME DE RIESGOS
                </span>
                {assessmentScore !== null && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 border rounded ${
                    assessmentScore < 50 
                      ? 'bg-brand-red/25 text-brand-red border-brand-red/40' 
                      : 'bg-brand-green/25 text-brand-green border-brand-green/40'
                  }`}>
                    NIVEL DE EXPOSICION: {assessmentScore}%
                  </span>
                )}
              </div>

              <div className="text-[11px] text-zinc-300 max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text font-mono space-y-2 bg-[#05070a]/90 p-2 border border-brand-border rounded">
                {generatedReport}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => downloadReportFile(false)}
                className="flex-1 bg-brand-panel hover:bg-brand-border border border-brand-border text-[10px] font-bold text-white px-2.5 py-1.5 rounded flex justify-center items-center gap-1.5 transition cursor-pointer"
              >
                <Download size={11} /> Descargar .TXT
              </button>
              <button
                onClick={() => downloadReportFile(true)}
                className="flex-1 bg-brand-panel hover:bg-brand-border border border-brand-border text-[10px] font-bold text-white px-2.5 py-1.5 rounded flex justify-center items-center gap-1.5 transition cursor-pointer"
              >
                <Download size={11} /> Descargar .MD
              </button>
            </div>
          </div>

          {/* Interactive Live Chat AI Specialist Console */}
          <div className="bg-[#0b121f] border border-brand-border rounded-lg p-4 flex flex-col justify-between">
            <div>
              <div className="flex border-b border-brand-border pb-2 mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Terminal size={14} className="text-brand-cyan" /> CONSOLA INTERACTIVA CYBERPUNK (INTELECTO DIRECTO)
                </span>
              </div>

              {/* Msg Thread */}
              <div className="h-56 overflow-y-auto space-y-2 pr-1 text-[11px] font-mono">
                {chats.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-md ${
                      msg.sender === 'user'
                        ? 'bg-brand-cyan/15 border border-brand-cyan/45 text-brand-cyan ml-6 text-left font-mono'
                        : 'bg-[#05070a]/90 border border-brand-border text-zinc-300 mr-6 font-mono'
                    }`}
                  >
                    <span className="block text-[8px] text-zinc-500 uppercase tracking-wider mb-1 font-bold">
                      {msg.sender === 'user' ? 'MÉTODO DE CONSULTA' : 'RESPUESTA INTELIGENCIA'}
                    </span>
                    <p className="whitespace-pre-wrap leading-normal select-text text-left">{msg.text}</p>
                  </div>
                ))}
                {isGenerating && (
                  <div className="text-[10px] text-zinc-500 animate-pulse font-mono">
                    Analizando vectores de penetración en tiempo real...
                  </div>
                )}
              </div>
            </div>

            {/* Chat form query */}
            <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Preguntar sobre Shodan, antibotnets, mitigación..."
                className="w-full bg-[#05070a]/80 border border-brand-border rounded p-2 text-xs text-white focus:outline-none focus:border-brand-cyan"
              />
              <button
                type="submit"
                disabled={isGenerating || !inputText.trim()}
                className="bg-brand-cyan hover:opacity-95 text-black p-2 rounded transition disabled:opacity-50 cursor-pointer"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
