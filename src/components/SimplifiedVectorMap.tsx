import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ThreatAlert } from '../types';
import { Maximize2, Globe, Activity, Zap } from 'lucide-react';
import * as topojson from 'topojson-client';

interface GeoMapProps {
  alerts: ThreatAlert[];
  hoveredAlert: ThreatAlert | null;
  onHoverAlert: (alert: ThreatAlert | null) => void;
}

interface AsnEntry {
  org: string;
  count: number;
}

const W = 960;
const H = 480;

const THREAT_COLORS: Record<string, string> = {
  CRITICAL: '#ff2d55',
  HIGH:     '#ff6b35',
  MEDIUM:   '#ffd60a',
  LOW:      '#30d158',
  INFO:     '#64d2ff',
};

// Equirectangular projection [lng, lat] → [x, y] in viewBox coords
const project = (lng: number, lat: number): [number, number] => {
  const x = ((lng + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return [
    Math.max(0, Math.min(W, x)),
    Math.max(0, Math.min(H, y)),
  ];
};

// GeoJSON geometry → SVG path string (equirectangular)
const geoToPath = (geometry: any): string => {
  if (!geometry) return '';
  const ringToD = (ring: number[][]): string => {
    if (!ring || ring.length < 3) return '';
    const valid = ring.filter(([lng, lat]) =>
      lng >= -180 && lng <= 180 && lat >= -85 && lat <= 85
    );
    if (valid.length < 3) return '';
    let d = '';
    let prev: number | null = null;
    for (let i = 0; i < valid.length; i++) {
      const [lng, lat] = valid[i];
      const [x, y] = project(lng, lat);
      // Detectar cruce de antimeridiano: salto > 300px en X
      if (prev !== null && Math.abs(x - prev) > 300) {
        d += ` M${x.toFixed(1)},${y.toFixed(1)}`;
      } else {
        d += i === 0 ? `M${x.toFixed(1)},${y.toFixed(1)}` : ` L${x.toFixed(1)},${y.toFixed(1)}`;
      }
      prev = x;
    }
    return d + ' Z';
  };

  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map(ringToD).join(' ');
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates
      .map((poly: number[][][]) => poly.map(ringToD).join(' '))
      .join(' ');
  }
  return '';
};

// ISO numeric → alpha-2
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

export const SimplifiedVectorMap: React.FC<GeoMapProps> = ({ alerts, hoveredAlert, onHoverAlert }) => {
  const [asnData, setAsnData]           = useState<AsnEntry[]>([]);
  const [showAsn, setShowAsn]           = useState(false);
  const [countryPaths, setCountryPaths] = useState<{ id: string; d: string }[]>([]);
  const [mapLoaded, setMapLoaded]       = useState(false);
  const [mapError, setMapError]         = useState('');
  const [pulsePhase, setPulsePhase]     = useState(0);

  const openMapWindow = () => window.open('/?mode=map', '_blank', 'width=1400,height=900');

  // Pulse animation
  useEffect(() => {
    const id = setInterval(() => setPulsePhase(p => (p + 1) % 100), 60);
    return () => clearInterval(id);
  }, []);

  // Load TopoJSON (local first, CDN fallback)
  useEffect(() => {
    const urls = [
      '/assets/countries-110m.json',
      'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
    ];
    const tryLoad = (i: number) => {
      if (i >= urls.length) { setMapError('No se pudo cargar el mapa'); return; }
      fetch(urls[i])
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
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

  // Load ASN data
  useEffect(() => {
    fetch('/api/threatmap/asn')
      .then(r => r.json())
      .then(d => setAsnData(d.asns || []))
      .catch(() => {});
  }, []);

  // Heatmap: count alerts per country alpha-2
  const countryCounts = alerts.reduce((acc, a) => {
    if (a.country) acc[a.country] = (acc[a.country] || 0) + 1;
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

  // Alerts with valid lat/lng
  const alertsGeo = alerts
    .filter((a: any) => (a.lat ?? a.latitude) != null && (a.lon ?? a.longitude) != null)
    .map((a: any) => ({ a, pos: project(a.lon ?? a.longitude, a.lat ?? a.latitude) }));

  // Stats
  const critCount = alerts.filter(a => a.level === 'CRITICAL').length;
  const highCount = alerts.filter(a => a.level === 'HIGH').length;
  const countries = new Set(alerts.map(a => a.country).filter(Boolean)).size;

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
            {alerts.length} amenazas · {countries} países · {alertsGeo.length} geolocalizadas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
            CRIT {critCount}
          </span>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
            HIGH {highCount}
          </span>
          <button onClick={() => setShowAsn(s => !s)}
            className={`text-[9px] font-mono px-2 py-0.5 rounded border transition ${
              showAsn ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30'
                      : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
            TOP ASN
          </button>
          <button onClick={openMapWindow}
            className="flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-[9px] text-zinc-400 hover:text-brand-cyan transition font-mono">
            <Maximize2 size={10} /> VENTANA
          </button>
        </div>
      </div>

      {/* ── SVG Map ── */}
      <div className="relative w-full bg-[#04080f] border border-brand-border/50 rounded overflow-hidden"
        style={{ aspectRatio: '2/1' }}>

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(0,242,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,242,255,0.03) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

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

          {/* Country fills */}
          {mapLoaded && countryPaths.map(({ id, d }) => (
            <path key={id} d={d}
              fill={heatColor(id) || '#0d1930'}
              stroke="#00f2ff" strokeWidth="0.3" strokeOpacity="0.2"
            />
          ))}

          {/* Loading / error state */}
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

          {/* Threat dots */}
          {alertsGeo.map(({ a, pos: [x, y] }, i) => {
            const color   = THREAT_COLORS[a.level] || '#64d2ff';
            const hovered = hoveredAlert?.id === a.id;
            const isCrit  = a.level === 'CRITICAL';
            const pr      = 4 + (Math.sin((pulsePhase / 100) * Math.PI * 2 + i * 0.7) + 1) * 2.5;

            return (
              <g key={a.id} transform={`translate(${x},${y})`}
                onMouseEnter={() => onHoverAlert(a)}
                onMouseLeave={() => onHoverAlert(null)}
                style={{ cursor: 'pointer' }}>

                {/* Pulse ring (CRITICAL only) */}
                {isCrit && (
                  <circle r={pr} fill="none" stroke={color} strokeWidth="0.8"
                    opacity={Math.max(0, 0.5 - (pr - 4) * 0.07)} />
                )}

                {/* Glow on hover */}
                {hovered && <circle r={9} fill={color} opacity="0.15" />}

                {/* Core */}
                <circle r={hovered ? 5 : isCrit ? 3.5 : 2.5} fill={color} opacity={hovered ? 1 : 0.85} />
                <circle r={1} fill="white" opacity="0.9" />

                {/* Tooltip */}
                {hovered && (
                  <g transform="translate(8,-28)">
                    <rect x={0} y={0} width={130} height={34} rx={3}
                      fill="#0a1628" stroke={color} strokeWidth="0.8" opacity="0.97" />
                    <text x={6} y={12} fontSize="8" fill={color} fontFamily="monospace" fontWeight="bold">
                      {a.ip}
                    </text>
                    <text x={6} y={24} fontSize="6.5" fill="#94a3b8" fontFamily="monospace">
                      {a.country} · Score {a.score} · {a.level}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Equator label */}
          {mapLoaded && (() => { const [,y] = project(0,0); return (
            <text x={6} y={y-3} fontSize="7" fill="#00f2ff" opacity="0.25" fontFamily="monospace">EQ 0°</text>
          );})()}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-2 left-2 flex items-center gap-2 pointer-events-none">
          {Object.entries(THREAT_COLORS).map(([lvl, col]) => (
            <div key={lvl} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: col }} />
              <span className="text-[8px] font-mono text-zinc-500">{lvl}</span>
            </div>
          ))}
        </div>

        {/* Geo counter */}
        <div className="absolute top-2 right-2 text-[9px] font-mono text-brand-cyan/50 pointer-events-none flex items-center gap-1">
          <Activity size={9} />
          {alertsGeo.length}/{alerts.length} geo
        </div>
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
                <span className="text-[9px] font-mono text-zinc-300 truncate max-w-[180px]">{asn.org}</span>
                <span className="text-[9px] font-mono text-red-400 w-8 text-right shrink-0">{asn.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
