import React, { useState, useEffect, useCallback } from 'react';
import { Maximize2, Globe, Activity, Zap, X } from 'lucide-react';
import * as topojson from 'topojson-client';

// ── Types ──────────────────────────────────────────────────────────────────
interface ThreatPoint {
  ip: string;
  port: number;
  lat: number;
  lon: number;
  country: string;
  threat_type: string;
  malware: string;
  source: string;
  first_seen: string;
}

interface AsnEntry {
  asn: string;
  org: string;
  country: string;
  count: number;
  malwares: string;
}

interface GeoMapProps {
  // kept for backward compat — map now fetches its own data
  alerts?: any[];
  hoveredAlert?: any;
  onHoverAlert?: (a: any) => void;
}

// ── Constants ──────────────────────────────────────────────────────────────
const W = 960;
const H = 480;

const THREAT_COLORS: Record<string, string> = {
  botnet_cc:   '#ff2d55',
  malware:     '#ff6b35',
  ransomware:  '#ff2d55',
  phishing:    '#ffd60a',
  scanner:     '#64d2ff',
  c2:          '#ff2d55',
  exploit:     '#ff6b35',
  default:     '#30d158',
};

const SOURCE_BADGE: Record<string, string> = {
  threatfox:  '#8b5cf6',
  abuseipdb:  '#0ea5e9',
  otx:        '#f59e0b',
  urlhaus:    '#ef4444',
  greynoise:  '#10b981',
  internetdb: '#6366f1',
};

const threatColor = (t: string) =>
  THREAT_COLORS[t] || THREAT_COLORS.default;

const sourceBadgeColor = (s: string) =>
  SOURCE_BADGE[s?.toLowerCase()] || '#64748b';

// ── Projection ────────────────────────────────────────────────────────────
const project = (lng: number, lat: number): [number, number] => [
  Math.max(0, Math.min(W, ((lng + 180) / 360) * W)),
  Math.max(0, Math.min(H, ((90 - lat) / 180) * H)),
];

// ── GeoJSON → SVG path ────────────────────────────────────────────────────
const geoToPath = (geometry: any): string => {
  if (!geometry) return '';
  const ringToD = (ring: number[][]): string => {
    const valid = ring.filter(([lng, lat]) =>
      lng >= -180 && lng <= 180 && lat >= -85 && lat <= 85);
    if (valid.length < 3) return '';
    let d = ''; let prev: number | null = null;
    for (let i = 0; i < valid.length; i++) {
      const [lng, lat] = valid[i];
      const [x, y] = project(lng, lat);
      if (prev !== null && Math.abs(x - prev) > 300) d += ` M${x.toFixed(1)},${y.toFixed(1)}`;
      else d += i === 0 ? `M${x.toFixed(1)},${y.toFixed(1)}` : ` L${x.toFixed(1)},${y.toFixed(1)}`;
      prev = x;
    }
    return d + ' Z';
  };
  if (geometry.type === 'Polygon')
    return geometry.coordinates.map(ringToD).join(' ');
  if (geometry.type === 'MultiPolygon')
    return geometry.coordinates.map((p: number[][][]) => p.map(ringToD).join(' ')).join(' ');
  return '';
};

// ── ISO numeric → alpha-2 ─────────────────────────────────────────────────
const NUM_TO_A2: Record<string, string> = {
  '4':'AF','8':'AL','12':'DZ','24':'AO','32':'AR','36':'AU','40':'AT','50':'BD',
  '56':'BE','64':'BT','68':'BO','76':'BR','100':'BG','116':'KH','120':'CM',
  '124':'CA','152':'CL','156':'CN','170':'CO','178':'CG','180':'CD','188':'CR',
  '191':'HR','192':'CU','203':'CZ','208':'DK','218':'EC','818':'EG','222':'SV',
  '231':'ET','246':'FI','250':'FR','276':'DE','288':'GH','300':'GR','320':'GT',
  '332':'HT','340':'HN','344':'HK','348':'HU','356':'IN','360':'ID','364':'IR',
  '368':'IQ','372':'IE','376':'IL','380':'IT','388':'JM','392':'JP','400':'JO',
  '398':'KZ','404':'KE','408':'KP','410':'KR','414':'KW','422':'LB','504':'MA',
  '484':'MX','496':'MN','508':'MZ','516':'NA','524':'NP','528':'NL','554':'NZ',
  '558':'NI','566':'NG','578':'NO','586':'PK','591':'PA','600':'PY','604':'PE',
  '608':'PH','616':'PL','620':'PT','630':'PR','642':'RO','643':'RU','682':'SA',
  '686':'SN','694':'SL','706':'SO','710':'ZA','724':'ES','144':'LK','729':'SD',
  '752':'SE','756':'CH','760':'SY','764':'TH','780':'TT','788':'TN','792':'TR',
  '800':'UG','804':'UA','784':'AE','826':'GB','840':'US','858':'UY','860':'UZ',
  '862':'VE','704':'VN','887':'YE','894':'ZM','716':'ZW',
};

// ── Clustering: agrupar puntos a menos de CLUSTER_PX píxeles ──────────────
const CLUSTER_PX = 18;

interface Cluster {
  cx: number; cy: number;
  points: ThreatPoint[];
  dominant: string; // threat_type más frecuente
}

const clusterPoints = (pts: { p: ThreatPoint; x: number; y: number }[]): Cluster[] => {
  const used = new Set<number>();
  const clusters: Cluster[] = [];
  for (let i = 0; i < pts.length; i++) {
    if (used.has(i)) continue;
    const group = [pts[i]];
    used.add(i);
    for (let j = i + 1; j < pts.length; j++) {
      if (used.has(j)) continue;
      const dx = pts[i].x - pts[j].x;
      const dy = pts[i].y - pts[j].y;
      if (Math.sqrt(dx * dx + dy * dy) < CLUSTER_PX) {
        group.push(pts[j]);
        used.add(j);
      }
    }
    const cx = group.reduce((s, g) => s + g.x, 0) / group.length;
    const cy = group.reduce((s, g) => s + g.y, 0) / group.length;
    const freq: Record<string, number> = {};
    group.forEach(g => { freq[g.p.threat_type] = (freq[g.p.threat_type] || 0) + 1; });
    const dominant = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
    clusters.push({ cx, cy, points: group.map(g => g.p), dominant });
  }
  return clusters;
};

// ── Popup Card ────────────────────────────────────────────────────────────
const PopupCard: React.FC<{ cluster: Cluster; svgW: number; svgH: number; onClose: () => void }> = ({ cluster, svgW, svgH, onClose }) => {
  const p = cluster.points[0];
  const multi = cluster.points.length > 1;
  const color = threatColor(cluster.dominant);

  // Detectar si el popup se sale por la derecha/abajo
  const flipX = cluster.cx > svgW * 0.65;
  const flipY = cluster.cy > svgH * 0.6;
  const tx = flipX ? -220 : 12;
  const ty = flipY ? -160 : -8;

  return (
    <g transform={`translate(${cluster.cx + tx},${cluster.cy + ty})`}>
      {/* Sombra */}
      <rect x={1} y={1} width={210} height={multi ? 148 : 130} rx={5}
        fill="black" opacity="0.4" />
      {/* Card */}
      <rect x={0} y={0} width={210} height={multi ? 148 : 130} rx={5}
        fill="#070d1a" stroke={color} strokeWidth="1" />
      {/* Header */}
      <rect x={0} y={0} width={210} height={22} rx={5} fill={color} opacity="0.15" />
      <rect x={0} y={17} width={210} height={5} fill={color} opacity="0.1" />

      {/* Close */}
      <g onClick={onClose} style={{ cursor: 'pointer' }}>
        <rect x={192} y={4} width={14} height={14} rx={3} fill="#1e293b" />
        <text x={199} y={14} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">✕</text>
      </g>

      {/* Título */}
      <circle cx={12} cy={11} r={4} fill={color} />
      <text x={20} y={14} fontSize="9" fill={color} fontFamily="monospace" fontWeight="bold">
        {multi ? `${cluster.points.length} IPs · ${cluster.dominant}` : p.ip}
      </text>

      {/* Contenido */}
      {!multi ? (
        <g>
          {/* IP + puerto */}
          <text x={8} y={36} fontSize="10" fill="#e2e8f0" fontFamily="monospace" fontWeight="bold">{p.ip}:{p.port}</text>
          {/* Tipo amenaza */}
          <rect x={8} y={42} width={80} height={13} rx={3} fill={color} opacity="0.2" />
          <text x={12} y={52} fontSize="8" fill={color} fontFamily="monospace">{p.threat_type}</text>
          {/* Malware */}
          <rect x={94} y={42} width={108} height={13} rx={3} fill="#1e293b" />
          <text x={98} y={52} fontSize="8" fill="#f59e0b" fontFamily="monospace">{p.malware || '—'}</text>
          {/* País */}
          <text x={8} y={70} fontSize="8" fill="#64748b" fontFamily="monospace">PAÍS</text>
          <text x={8} y={81} fontSize="9" fill="#94a3b8" fontFamily="monospace">{p.country}</text>
          {/* Source */}
          <text x={70} y={70} fontSize="8" fill="#64748b" fontFamily="monospace">FUENTE</text>
          <rect x={70} y={73} width={55} height={12} rx={3} fill={sourceBadgeColor(p.source)} opacity="0.25" />
          <text x={74} y={82} fontSize="8" fill={sourceBadgeColor(p.source)} fontFamily="monospace">{p.source}</text>
          {/* Lat/lon */}
          <text x={135} y={70} fontSize="8" fill="#64748b" fontFamily="monospace">GEO</text>
          <text x={135} y={81} fontSize="7.5" fill="#64748b" fontFamily="monospace">{p.lat.toFixed(2)},{p.lon.toFixed(2)}</text>
          {/* Timestamp */}
          <text x={8} y={98} fontSize="7.5" fill="#475569" fontFamily="monospace">
            {p.first_seen?.replace(' UTC', '') || '—'}
          </text>
          {/* Línea separadora */}
          <line x1={8} x2={202} y1={104} y2={104} stroke="#1e293b" strokeWidth="0.8" />
          <text x={8} y={116} fontSize="7" fill="#334155" fontFamily="monospace">
            📡 ThreatRadar OSINT · threatradar-osint.viajeinteligencia.com
          </text>
        </g>
      ) : (
        <g>
          {/* Lista de hasta 5 IPs */}
          {cluster.points.slice(0, 5).map((pt, i) => (
            <g key={i}>
              <circle cx={14} cy={36 + i * 20} r={3} fill={threatColor(pt.threat_type)} />
              <text x={22} y={40 + i * 20} fontSize="9" fill="#e2e8f0" fontFamily="monospace">{pt.ip}:{pt.port}</text>
              <text x={22} y={50 + i * 20} fontSize="7.5" fill="#64748b" fontFamily="monospace">
                {pt.malware || pt.threat_type} · {pt.country} · {pt.source}
              </text>
            </g>
          ))}
          {cluster.points.length > 5 && (
            <text x={14} y={140} fontSize="8" fill="#475569" fontFamily="monospace">
              +{cluster.points.length - 5} más…
            </text>
          )}
        </g>
      )}
    </g>
  );
};

// ── Hotspot label (sticker visible sin hover) ─────────────────────────────
const HotspotSticker: React.FC<{ cluster: Cluster; onClick: () => void; selected: boolean }> = ({ cluster, onClick, selected }) => {
  const color = threatColor(cluster.dominant);
  const multi = cluster.points.length > 1;
  const p = cluster.points[0];
  const label = multi ? `×${cluster.points.length}` : p.ip.split('.').slice(-2).join('.');
  const subLabel = multi ? cluster.dominant : p.malware || p.threat_type;
  const isCritical = ['botnet_cc', 'c2', 'ransomware'].includes(cluster.dominant);

  return (
    <g transform={`translate(${cluster.cx},${cluster.cy})`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}>

      {/* Pulse ring para amenazas críticas */}
      {isCritical && (
        <circle r={multi ? 14 + cluster.points.length * 0.5 : 10}
          fill="none" stroke={color} strokeWidth="1"
          opacity="0.4">
          <animate attributeName="r"
            values={`${multi ? 12 : 8};${multi ? 22 : 16};${multi ? 12 : 8}`}
            dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity"
            values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Glow si selected */}
      {selected && <circle r={multi ? 16 : 12} fill={color} opacity="0.2" />}

      {/* Dot central */}
      <circle r={multi ? Math.min(10, 5 + cluster.points.length * 0.3) : 4}
        fill={color} opacity={selected ? 1 : 0.9} />
      <circle r={1.5} fill="white" opacity="0.9" />

      {/* Sticker label — sólo si hay suficiente espacio (no en clusters muy pequeños) */}
      {(multi || isCritical) && (
        <g transform="translate(6,-16)">
          <rect x={-2} y={-9} width={Math.max(30, label.length * 6 + 4)} height={11}
            rx={2} fill="#0a1628" stroke={color} strokeWidth="0.7" opacity="0.95" />
          <text x={Math.max(30, label.length * 6 + 4) / 2 - 2} y={-1}
            textAnchor="middle" fontSize="7.5" fill={color}
            fontFamily="monospace" fontWeight="bold">
            {label}
          </text>
        </g>
      )}

      {/* Sub-label malware — sólo en singletons críticos */}
      {!multi && isCritical && subLabel && (
        <g transform="translate(6,6)">
          <rect x={-2} y={0} width={Math.max(40, subLabel.length * 5 + 6)} height={10}
            rx={2} fill="#0a1628" stroke={color} strokeWidth="0.5" opacity="0.85" />
          <text x={Math.max(40, subLabel.length * 5 + 6) / 2 - 2} y={8}
            textAnchor="middle" fontSize="6.5" fill="#94a3b8"
            fontFamily="monospace">
            {subLabel.slice(0, 18)}
          </text>
        </g>
      )}
    </g>
  );
};

// __SELF_MARKER_INSTALLED__
// ── Self location marker ("tu estas aqui") ────────────────────────────────
interface SelfLoc { lat: number; lon: number; city: string; country: string; }

const SelfMarker: React.FC<{ loc: SelfLoc }> = ({ loc }) => {
  const [x, y] = project(loc.lon, loc.lat);
  const label = [loc.city, loc.country].filter(Boolean).join(', ') || 'Tu ubicacion';
  return (
    <g transform={`translate(${x},${y})`}>
      <circle r={14} fill="none" stroke="#38bdf8" strokeWidth="1.2" opacity="0.5">
        <animate attributeName="r" values="10;20;10" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0;0.6" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle r={5} fill="#38bdf8" stroke="#0a1628" strokeWidth="1.5" />
      <circle r={1.8} fill="white" />
      <g transform="translate(8,-12)">
        <rect x={-2} y={-9} width={Math.max(40, label.length * 5.2 + 6)} height={12}
          rx={2} fill="#0a1628" stroke="#38bdf8" strokeWidth="0.7" opacity="0.95" />
        <text x={Math.max(40, label.length * 5.2 + 6) / 2 - 2} y={0}
          textAnchor="middle" fontSize="7.5" fill="#38bdf8"
          fontFamily="monospace" fontWeight="bold">
          TU: {label}
        </text>
      </g>
    </g>
  );
};

// ── Main Component ────────────────────────────────────────────────────────
export const SimplifiedVectorMap: React.FC<GeoMapProps> = ({ onHoverAlert }) => {
  const [points, setPoints]           = useState<ThreatPoint[]>([]);
  const [asnData, setAsnData]         = useState<AsnEntry[]>([]);
  const [showAsn, setShowAsn]         = useState(false);
  const [countryPaths, setCountryPaths] = useState<{ id: string; d: string }[]>([]);
  const [mapLoaded, setMapLoaded]     = useState(false);
  const [mapError, setMapError]       = useState('');
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // ── Fetch threat points cada 30s ──
  const fetchPoints = useCallback(() => {
    fetch('/api/threatmap/live')
      .then(r => r.json())
      .then(d => {
        setPoints(d.points || []);
        setLastRefresh(new Date());
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchPoints();
    const id = setInterval(fetchPoints, 30_000);
    return () => clearInterval(id);
  }, [fetchPoints]);

  // ── Self location (una vez al montar) ──
  const [selfLoc, setSelfLoc] = useState<SelfLoc | null>(null);
  useEffect(() => {
    fetch('/api/threatmap/me')
      .then(r => r.json())
      .then(d => { if (d.located) setSelfLoc({ lat: d.lat, lon: d.lon, city: d.city, country: d.country }); })
      .catch(() => {});
  }, []);

  // ── Fetch ASN ──
  useEffect(() => {
    fetch('/api/threatmap/asn')
      .then(r => r.json())
      .then(d => setAsnData(d.asns || []))
      .catch(() => {});
  }, []);

  // ── Load TopoJSON ──
  useEffect(() => {
    const urls = [
      '/assets/countries-110m.json',
      'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
    ];
    const tryLoad = (i: number) => {
      if (i >= urls.length) { setMapError('No se pudo cargar el mapa'); return; }
      fetch(urls[i])
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then((topo: any) => {
          const geo = topojson.feature(topo, topo.objects.countries) as any;
          const paths = (geo.features as any[]).map((f: any) => ({
            id: String(f.id ?? ''),
            d: geoToPath(f.geometry),
          })).filter(p => p.d.length > 0);
          setCountryPaths(paths);
          setMapLoaded(true);
        })
        .catch(() => tryLoad(i + 1));
    };
    tryLoad(0);
  }, []);

  // ── Heatmap por país ──
  const countryCounts = points.reduce((acc, p) => {
    if (p.country) acc[p.country] = (acc[p.country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const maxCount = Math.max(1, ...Object.values(countryCounts));

  const heatColor = (numId: string): string | null => {
    const a2 = NUM_TO_A2[String(parseInt(numId, 10))] || '';
    const n = countryCounts[a2] || 0;
    if (!n) return null;
    const t = n / maxCount;
    if (t > 0.7) return 'rgba(255,45,85,0.55)';
    if (t > 0.4) return 'rgba(255,107,53,0.45)';
    if (t > 0.1) return 'rgba(255,214,10,0.30)';
    return 'rgba(48,209,88,0.18)';
  };

  // ── Proyectar y clusterizar ──
  const projected = points
    .filter(p => p.lat != null && p.lon != null && p.lat !== 0 && p.lon !== 0)
    .map(p => ({ p, x: project(p.lon, p.lat)[0], y: project(p.lon, p.lat)[1] }));

  const clusters = clusterPoints(projected);

  // ── Stats ──
  const critCount = points.filter(p => ['botnet_cc','c2','ransomware'].includes(p.threat_type)).length;
  const highCount = points.filter(p => ['malware','exploit','phishing'].includes(p.threat_type)).length;
  const countries = new Set(points.map(p => p.country).filter(Boolean)).size;
  const geoCount  = projected.length;

  const openMapWindow = () => window.open('/?mode=map', '_blank', 'width=1400,height=900');

  return (
    <div id="geographical-vector-map-panel"
      className="bg-brand-panel border border-brand-border p-4 rounded-lg shadow-xl relative overflow-hidden space-y-3">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold font-mono text-brand-cyan tracking-wider flex items-center gap-2">
            <Globe size={14} />
            LIVE THREAT MAP
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
              ● LIVE
            </span>
          </h3>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
            {points.length} amenazas · {countries} países · {geoCount} geolocalizadas · {clusters.length} clusters
            <span className="ml-2 text-zinc-600">
              ↻ {lastRefresh.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
            C2/BOT {critCount}
          </span>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
            MAL {highCount}
          </span>
          <button onClick={() => setShowAsn(s => !s)}
            className={`text-[9px] font-mono px-2 py-0.5 rounded border transition ${
              showAsn ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30'
                      : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
            TOP ASN
          </button>
          <button onClick={fetchPoints}
            className="text-[9px] font-mono px-2 py-0.5 rounded border bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-brand-cyan transition">
            ↻
          </button>
          <button onClick={openMapWindow}
            className="flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-[9px] text-zinc-400 hover:text-brand-cyan transition font-mono">
            <Maximize2 size={10} /> VENTANA
          </button>
        </div>
      </div>

      {/* ── SVG Map ── */}
      <div className="relative w-full bg-[#04080f] border border-brand-border/50 rounded overflow-hidden"
        style={{ aspectRatio: '2/1' }}
        onClick={(e) => {
          // click fuera de un cluster → cerrar popup
          if ((e.target as SVGElement).tagName === 'svg' || (e.target as SVGElement).tagName === 'rect') {
            setSelectedCluster(null);
          }
        }}>

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,242,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,242,255,0.03) 1px,transparent 1px)',
            backgroundSize: '60px 60px'
          }} />

        {/* Radar scan */}
        <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent animate-radar-scan pointer-events-none" />

        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full">
          {/* Graticules */}
          <g stroke="#00f2ff" strokeWidth="0.4" opacity="0.07">
            {[-60,-30,0,30,60].map(lat => {
              const [,y] = project(0, lat);
              return <line key={lat} x1={0} y1={y} x2={W} y2={y} />;
            })}
            {[-120,-60,0,60,120].map(lng => {
              const [x] = project(lng, 0);
              return <line key={lng} x1={x} y1={0} x2={x} y2={H} />;
            })}
          </g>

          {/* Country fills — heatmap */}
          {mapLoaded && countryPaths.map(({ id, d }) => (
            <path key={id} d={d}
              fill={heatColor(id) || '#0d1930'}
              stroke="#00f2ff" strokeWidth="0.3" strokeOpacity="0.2"
            />
          ))}

          {!mapLoaded && !mapError && (
            <text x={W/2} y={H/2} textAnchor="middle" fill="#00f2ff" fontSize="14" opacity="0.4" fontFamily="monospace">
              Cargando mapa…
            </text>
          )}
          {mapError && (
            <text x={W/2} y={H/2} textAnchor="middle" fill="#ff2d55" fontSize="12" opacity="0.6" fontFamily="monospace">
              {mapError}
            </text>
          )}

          {/* ── Clusters / Hotspot Stickers ── */}
          {clusters.map((cl, i) => (
            <HotspotSticker
              key={i}
              cluster={cl}
              selected={selectedCluster === cl}
              onClick={() => setSelectedCluster(prev => prev === cl ? null : cl)}
            />
          ))}

          {/* ── Self marker ── */}
          {selfLoc && <SelfMarker loc={selfLoc} />}

          {/* ── Popup Card (sobre todo lo demás) ── */}
          {selectedCluster && (
            <PopupCard
              cluster={selectedCluster}
              svgW={W} svgH={H}
              onClose={() => setSelectedCluster(null)}
            />
          )}

          {/* Equator label */}
          {mapLoaded && (() => {
            const [,y] = project(0, 0);
            return <text x={6} y={y - 3} fontSize="7" fill="#00f2ff" opacity="0.25" fontFamily="monospace">EQ 0°</text>;
          })()}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-2 left-2 flex items-center gap-2 pointer-events-none flex-wrap">
          {Object.entries(THREAT_COLORS).filter(([k]) => k !== 'default').map(([lvl, col]) => (
            <div key={lvl} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: col }} />
              <span className="text-[7px] font-mono text-zinc-500">{lvl}</span>
            </div>
          ))}
        </div>

        {/* Geo counter */}
        <div className="absolute top-2 right-2 text-[9px] font-mono text-brand-cyan/50 pointer-events-none flex items-center gap-1">
          <Activity size={9} />
          {geoCount}/{points.length} geo · {clusters.length} clusters
        </div>

        {/* Hint */}
        {clusters.length > 0 && !selectedCluster && (
          <div className="absolute bottom-2 right-2 text-[8px] font-mono text-zinc-600 pointer-events-none">
            click en punto → detalles
          </div>
        )}
      </div>

      {/* ── TOP ASN Panel ── */}
      {showAsn && asnData.length > 0 && (
        <div className="border border-brand-border/40 rounded p-3 bg-[#04080f]">
          <h4 className="text-[10px] font-mono text-brand-cyan mb-2 flex items-center gap-1">
            <Zap size={10} /> TOP ASN C2 HOSTING
          </h4>
          <div className="space-y-1.5">
            {asnData.slice(0, 8).map((asn, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-zinc-600 w-4 shrink-0">{i + 1}</span>
                <div className="flex-1 bg-zinc-800/50 rounded overflow-hidden h-2.5">
                  <div className="h-full bg-gradient-to-r from-red-500/60 to-orange-500/30 transition-all"
                    style={{ width: `${(asn.count / (asnData[0]?.count || 1)) * 100}%` }} />
                </div>
                <span className="text-[8px] font-mono text-zinc-600">{asn.asn}</span>
                <span className="text-[9px] font-mono text-zinc-300 truncate max-w-[140px]">{asn.org}</span>
                <span className="text-[8px] font-mono text-yellow-600 truncate max-w-[100px] hidden sm:block">{asn.malwares?.split(',')[0]}</span>
                <span className="text-[9px] font-mono text-red-400 w-8 text-right shrink-0">{asn.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
