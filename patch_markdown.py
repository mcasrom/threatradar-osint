#!/usr/bin/env python3
"""Sprint 12 — react-markdown en IPTesterAndManual.tsx"""

PATH = '/home/miguelc/threatradar-osint/src/components/IPTesterAndManual.tsx'

with open(PATH, 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Añadir import ReactMarkdown
OLD_IMPORT = "import { Globe, MapPin, Terminal, HelpCircle, ArrowRight, CheckCircle2, ShieldAlert, BookOpen, AlertCircle, RefreshCw, Zap, Copy, FileDown, Shield, Activity } from 'lucide-react';"
NEW_IMPORT = (
    "import ReactMarkdown from 'react-markdown';\n"
    "import { Globe, MapPin, Terminal, HelpCircle, ArrowRight, CheckCircle2, ShieldAlert, BookOpen, AlertCircle, RefreshCw, Zap, Copy, FileDown, Shield, Activity } from 'lucide-react';"
)
c = c.replace(OLD_IMPORT, NEW_IMPORT, 1)

# 2. Sustituir el bloque del parser manual por ReactMarkdown
OLD_RENDER = (
    '          {aiAnalysis && (\n'
    '            <div className="bg-zinc-900/60 border border-zinc-800 rounded p-4 text-xs text-zinc-300 font-sans leading-relaxed max-h-96 overflow-y-auto space-y-1">\n'
    '              {aiAnalysis.split(\'\\n\').map((line, i) => {\n'
    '                if (line.startsWith(\'### \')) return <h3 key={i} className="text-brand-cyan font-bold text-[11px] mt-3 mb-1">{line.replace(\'### \', \'\')}</h3>;\n'
    '                if (line.startsWith(\'## \')) return <h2 key={i} className="text-white font-bold text-xs mt-4 mb-1 border-b border-zinc-700 pb-1">{line.replace(\'## \', \'\')}</h2>;\n'
    '                if (line.startsWith(\'# \') || line.startsWith(\'**\') && line.endsWith(\'**\')) return <h2 key={i} className="text-white font-bold text-xs mt-4 mb-1">{line.replace(/\\*\\*/g, \'\').replace(\'# \', \'\')}</h2>;\n'
    '                if (line.startsWith(\'* \') || line.startsWith(\'- \')) return <div key={i} className="flex gap-2 ml-2"><span className="text-brand-cyan mt-0.5">•</span><span dangerouslySetInnerHTML={{__html: line.slice(2).replace(/\\*\\*(.+?)\\*\\*/g, \'<strong class="text-white">$1</strong>\')}} /></div>;\n'
    '                if (line.startsWith(\'---\')) return <hr key={i} className="border-zinc-700 my-2" />;\n'
    '                if (line.trim() === \'\') return <div key={i} className="h-1" />;\n'
    '                return <p key={i} className="text-zinc-400" dangerouslySetInnerHTML={{__html: line.replace(/\\*\\*(.+?)\\*\\*/g, \'<strong class="text-white">$1</strong>\')}} />;\n'
    '              })}\n'
    '            </div>\n'
    '          )}'
)

NEW_RENDER = (
    '          {aiAnalysis && (\n'
    '            <div className="bg-zinc-900/60 border border-zinc-800 rounded p-4 text-xs text-zinc-300 font-sans leading-relaxed max-h-96 overflow-y-auto markdown-osint">\n'
    '              <ReactMarkdown\n'
    '                components={{\n'
    '                  h1: ({children}) => <h1 className="text-white font-bold text-sm mt-4 mb-2 border-b border-zinc-700 pb-1">{children}</h1>,\n'
    '                  h2: ({children}) => <h2 className="text-white font-bold text-xs mt-4 mb-1 border-b border-zinc-700 pb-1">{children}</h2>,\n'
    '                  h3: ({children}) => <h3 className="text-brand-cyan font-bold text-[11px] mt-3 mb-1">{children}</h3>,\n'
    '                  h4: ({children}) => <h4 className="text-brand-green font-bold text-[11px] mt-2 mb-1">{children}</h4>,\n'
    '                  p: ({children}) => <p className="text-zinc-400 mb-2 leading-relaxed">{children}</p>,\n'
    '                  ul: ({children}) => <ul className="space-y-1 mb-2 ml-2">{children}</ul>,\n'
    '                  ol: ({children}) => <ol className="space-y-1 mb-2 ml-4 list-decimal">{children}</ol>,\n'
    '                  li: ({children}) => <li className="flex gap-2 text-zinc-300"><span className="text-brand-cyan shrink-0 mt-0.5">•</span><span>{children}</span></li>,\n'
    '                  code: ({inline, children}: any) => inline\n'
    '                    ? <code className="bg-[#0d1117] text-green-300 px-1.5 py-0.5 rounded text-[10px] font-mono">{children}</code>\n'
    '                    : <pre className="bg-[#0d1117] border border-brand-border rounded p-3 text-[10px] font-mono text-green-300 overflow-x-auto my-2 whitespace-pre-wrap"><code>{children}</code></pre>,\n'
    '                  strong: ({children}) => <strong className="text-white font-bold">{children}</strong>,\n'
    '                  em: ({children}) => <em className="text-zinc-300 italic">{children}</em>,\n'
    '                  hr: () => <hr className="border-zinc-700 my-3" />,\n'
    '                  blockquote: ({children}) => <blockquote className="border-l-2 border-brand-cyan pl-3 text-zinc-400 italic my-2">{children}</blockquote>,\n'
    '                  a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-cyan hover:underline">{children}</a>,\n'
    '                }}\n'
    '              >\n'
    '                {aiAnalysis}\n'
    '              </ReactMarkdown>\n'
    '            </div>\n'
    '          )}'
)

if OLD_RENDER not in c:
    print("ERROR: bloque parser manual no encontrado")
    exit(1)

c = c.replace(OLD_RENDER, NEW_RENDER, 1)

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(c)

print("OK: Sprint 12 completado")
print("   - import ReactMarkdown añadido")
print("   - Parser manual .split().map() eliminado")
print("   - ReactMarkdown con components personalizados (h1-h4, p, ul, ol, li, code, strong, hr, blockquote, a)")
