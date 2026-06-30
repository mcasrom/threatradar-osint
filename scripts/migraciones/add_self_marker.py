#!/usr/bin/env python3
"""
Inserta el marcador "tu estas aqui" en SimplifiedVectorMap.tsx.
Tres inserciones independientes, cada una con verificacion de ancla unica.
Si CUALQUIERA falla, no se escribe nada (todo o nada).
Uso: python3 add_self_marker.py
"""
import sys

FILE = "src/components/SimplifiedVectorMap.tsx"
MARKER = "// __SELF_MARKER_INSTALLED__"

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

if MARKER in content:
    print("INFO: El marcador ya estaba instalado. No se ha modificado nada.")
    sys.exit(0)

# ── Insercion 1: componente SelfMarker, antes de "// ── Main Component" ──
ANCHOR_1 = "// ── Main Component ────────────────────────────────────────────────────────"
BLOCK_1 = f'''{MARKER}
// ── Self location marker ("tu estas aqui") ────────────────────────────────
interface SelfLoc {{ lat: number; lon: number; city: string; country: string; }}

const SelfMarker: React.FC<{{ loc: SelfLoc }}> = ({{ loc }}) => {{
  const [x, y] = project(loc.lon, loc.lat);
  const label = [loc.city, loc.country].filter(Boolean).join(', ') || 'Tu ubicacion';
  return (
    <g transform={{`translate(${{x}},${{y}})`}}>
      <circle r={{14}} fill="none" stroke="#38bdf8" strokeWidth="1.2" opacity="0.5">
        <animate attributeName="r" values="10;20;10" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0;0.6" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle r={{5}} fill="#38bdf8" stroke="#0a1628" strokeWidth="1.5" />
      <circle r={{1.8}} fill="white" />
      <g transform="translate(8,-12)">
        <rect x={{-2}} y={{-9}} width={{Math.max(40, label.length * 5.2 + 6)}} height={{12}}
          rx={{2}} fill="#0a1628" stroke="#38bdf8" strokeWidth="0.7" opacity="0.95" />
        <text x={{Math.max(40, label.length * 5.2 + 6) / 2 - 2}} y={{0}}
          textAnchor="middle" fontSize="7.5" fill="#38bdf8"
          fontFamily="monospace" fontWeight="bold">
          TU: {{label}}
        </text>
      </g>
    </g>
  );
}};

{ANCHOR_1}'''

count1 = content.count(ANCHOR_1)
if count1 != 1:
    print(f"ERROR paso 1: ancla aparece {count1} veces (esperado 1). No se ha modificado nada.")
    sys.exit(1)

# ── Insercion 2: state + fetch, despues del useEffect de fetchPoints ──
ANCHOR_2 = """  useEffect(() => {
    fetchPoints();
    const id = setInterval(fetchPoints, 30_000);
    return () => clearInterval(id);
  }, [fetchPoints]);"""

BLOCK_2 = ANCHOR_2 + """

  // ── Self location (una vez al montar) ──
  const [selfLoc, setSelfLoc] = useState<SelfLoc | null>(null);
  useEffect(() => {
    fetch('/api/threatmap/me')
      .then(r => r.json())
      .then(d => { if (d.located) setSelfLoc({ lat: d.lat, lon: d.lon, city: d.city, country: d.country }); })
      .catch(() => {});
  }, []);"""

count2 = content.count(ANCHOR_2)
if count2 != 1:
    print(f"ERROR paso 2: ancla aparece {count2} veces (esperado 1). No se ha modificado nada.")
    sys.exit(1)

# ── Insercion 3: render del marcador, justo antes del Popup Card ──
ANCHOR_3 = """          {/* ── Popup Card (sobre todo lo demás) ── */}"""
BLOCK_3 = """          {/* ── Self marker ── */}
          {selfLoc && <SelfMarker loc={selfLoc} />}

""" + ANCHOR_3

count3 = content.count(ANCHOR_3)
if count3 != 1:
    print(f"ERROR paso 3: ancla aparece {count3} veces (esperado 1). No se ha modificado nada.")
    sys.exit(1)

# Si las 3 anclas son unicas, aplicamos las 3 sustituciones
new_content = content.replace(ANCHOR_1, BLOCK_1, 1)
new_content = new_content.replace(ANCHOR_2, BLOCK_2, 1)
new_content = new_content.replace(ANCHOR_3, BLOCK_3, 1)

with open(FILE, "w", encoding="utf-8") as f:
    f.write(new_content)

print("OK: Marcador de autolocalizacion insertado correctamente en SimplifiedVectorMap.tsx")
