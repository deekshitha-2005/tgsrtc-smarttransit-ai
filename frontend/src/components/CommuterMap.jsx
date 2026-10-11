import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  GeoJSON,
  useMap,
  ZoomControl,
  ScaleControl,
  CircleMarker,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ShieldAlert, Users, Phone, Zap, Maximize2, Minimize2,
  Layers, Search, X, MapPin, Navigation, Bus
} from 'lucide-react';

// ─── Fix default Leaflet icon ─────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ─── Hyderabad Metropolitan Region GeoJSON boundary ──────────────────────────
const HYD_BOUNDARY = {
  type: "Feature",
  properties: { name: "Hyderabad Metropolitan Region" },
  geometry: {
    type: "Polygon",
    coordinates: [[
      [78.2100, 17.5800], [78.3200, 17.6100], [78.4000, 17.6300],
      [78.5100, 17.6200], [78.6200, 17.5900], [78.7000, 17.5500],
      [78.7500, 17.4800], [78.7400, 17.4000], [78.7000, 17.3200],
      [78.6200, 17.2700], [78.5400, 17.2400], [78.4500, 17.2200],
      [78.3500, 17.2400], [78.2700, 17.2800], [78.2100, 17.3400],
      [78.1800, 17.4200], [78.1900, 17.5100], [78.2100, 17.5800],
    ]]
  }
};

// ─── Hyderabad landmarks for search ──────────────────────────────────────────
const HYD_LANDMARKS = [
  { name: "Charminar", coords: [17.3616, 78.4747] },
  { name: "Hitech City / Cyberabad", coords: [17.4478, 78.3737] },
  { name: "Secunderabad Railway Station", coords: [17.4344, 78.5013] },
  { name: "Hyderabad Airport (RGIA)", coords: [17.2403, 78.4294] },
  { name: "Ameerpet Metro", coords: [17.4375, 78.4483] },
  { name: "LB Nagar", coords: [17.3440, 78.5527] },
  { name: "Dilsukhnagar", coords: [17.3687, 78.5271] },
  { name: "Kukatpally", coords: [17.4849, 78.4138] },
  { name: "Uppal", coords: [17.4051, 78.5596] },
  { name: "Gachibowli", coords: [17.4400, 78.3489] },
  { name: "Mehdipatnam", coords: [17.3948, 78.4355] },
  { name: "Nampally", coords: [17.3924, 78.4671] },
  { name: "Tolichowki", coords: [17.4054, 78.4170] },
  { name: "Banjara Hills", coords: [17.4138, 78.4481] },
  { name: "Jubilee Hills", coords: [17.4316, 78.4071] },
  { name: "Begumpet", coords: [17.4432, 78.4682] },
  { name: "ECIL X Roads", coords: [17.4673, 78.5592] },
  { name: "Alwal", coords: [17.5044, 78.5036] },
  { name: "Kompally", coords: [17.5425, 78.4808] },
  { name: "Shamshabad", coords: [17.2520, 78.4240] },
];

// ─── Map tile layers ──────────────────────────────────────────────────────────
const TILE_LAYERS = {
  dark: {
    label: "🌑 Dark Mode",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  standard: {
    label: "🗺 Street Map",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    label: "🛰 Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: 'Tiles &copy; Esri',
  },
  voyager: {
    label: "🧭 Voyager",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

// ─── Tile swapper ─────────────────────────────────────────────────────────────
function DynamicTileLayer({ layerKey }) {
  const layer = TILE_LAYERS[layerKey] || TILE_LAYERS.dark;
  return <TileLayer key={layerKey} attribution={layer.attribution} url={layer.url} maxZoom={19} />;
}

// ─── Fly-to controller ────────────────────────────────────────────────────────
function FlyToController({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target.coords, 16, { duration: 1.4 });
  }, [target, map]);
  return null;
}

// ─── Animated bus marker manager (uses Leaflet refs for smooth animation) ─────
// This component imperatively creates/updates L.Marker instances for smooth
// CSS-transition-based movement without React re-rendering overhead.
function AnimatedBusMarkers({ buses, onBusSelect, onSosTrigger, onExpressToggle }) {
  const map = useMap();
  const markersRef = useRef({});   // busId → L.Marker
  const popupsRef  = useRef({});   // busId → L.Popup

  const createIcon = useCallback((bus) => {
    const isSOS = bus.status === 'SOS Alert';
    const isExpress = bus.is_on_demand_express;
    const color = bus.color || '#ef4444';

    let ring = 'border-emerald-500';
    if (bus.seat_occupancy === 'Yellow') ring = 'border-amber-500';
    else if (bus.seat_occupancy === 'Red') ring = 'border-rose-500';

    const pulse = isSOS ? 'pulse-alert' : '';
    const bearing = bus.bearing || 0;

    return L.divIcon({
      html: `
        <div class="animated-bus-wrapper" style="transform:rotate(${bearing}deg); transition: transform 0.4s ease;">
          <div class="relative flex items-center justify-center w-9 h-9 rounded-full border-2 ${ring} bg-[#0b0f19] shadow-2xl ${pulse}"
               style="box-shadow: 0 0 12px ${color}55;">
            <div class="absolute inset-0.5 rounded-full" style="background:${color}18;"></div>
            <!-- Direction arrow at top of icon -->
            <div class="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0"
                 style="border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:6px solid ${color};opacity:0.9;"></div>
            <span class="text-[9px] font-black z-10 text-white select-none leading-none">${bus.route_code}</span>
            ${isSOS ? `
              <span class="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600 border border-white items-center justify-center text-[7px] text-white font-bold">!</span>
              </span>` : ''}
            ${isExpress ? `
              <span class="absolute -bottom-1 -right-1 bg-amber-500 text-[6px] text-slate-950 font-extrabold px-1 rounded-full border border-slate-950">EXP</span>
            ` : ''}
          </div>
        </div>
      `,
      className: 'custom-bus-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -20],
    });
  }, []);

  const createPopupContent = useCallback((bus) => {
    return `
      <div class="p-1.5 font-sans min-w-[210px] text-slate-100" style="font-family: 'Plus Jakarta Sans', sans-serif;">
        <div class="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
          <div>
            <div class="font-black text-sm">${bus.id}</div>
            <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">${bus.route_name}</div>
          </div>
          <span class="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border ${
            bus.status === 'SOS Alert'
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              : bus.status === 'Rest Period'
              ? 'bg-slate-700/20 text-slate-400 border-slate-600/30'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          }">${bus.status}</span>
        </div>
        <div class="space-y-1.5 text-xs mb-3">
          <div class="flex justify-between text-slate-300">
            <span class="text-slate-400 font-semibold">👥 Passengers</span>
            <span class="font-black">${bus.current_passengers} / ${bus.capacity}</span>
          </div>
          <div class="flex justify-between text-slate-300">
            <span class="text-slate-400 font-semibold">⚡ Express</span>
            <span class="font-black ${bus.is_on_demand_express ? 'text-amber-400' : 'text-slate-500'}">
              ${bus.is_on_demand_express ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>
          <div class="flex justify-between text-slate-300">
            <span class="text-slate-400 font-semibold">🧭 Heading</span>
            <span class="font-black text-slate-300">${Math.round(bus.bearing || 0)}°</span>
          </div>
        </div>
        <div class="bg-slate-950/50 p-2 rounded-lg border border-slate-800 text-[11px] space-y-1">
          <div class="text-slate-400 font-semibold">Duty Staff</div>
          <div class="text-slate-300 flex justify-between font-medium">
            <span>👨‍✈️ ${bus.driver.name} (D)</span>
            <a href="tel:${bus.driver.phone}" class="text-rose-400 font-bold">📞 Call</a>
          </div>
          <div class="text-slate-300 flex justify-between font-medium">
            <span>🧑‍✈️ ${bus.conductor.name} (C)</span>
            <a href="tel:${bus.conductor.phone}" class="text-rose-400 font-bold">📞 Call</a>
          </div>
        </div>
      </div>
    `;
  }, []);

  useEffect(() => {
    if (!map || !buses) return;

    const currentIds = new Set(buses.map(b => b.id));

    // Remove markers for buses no longer in state
    Object.keys(markersRef.current).forEach(id => {
      if (!currentIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
        delete popupsRef.current[id];
      }
    });

    buses.forEach(bus => {
      const latlng = L.latLng(bus.coords[0], bus.coords[1]);

      if (markersRef.current[bus.id]) {
        // ── Smoothly animate existing marker to new position ──────────────
        const marker = markersRef.current[bus.id];

        // CSS transition is applied inside the icon's wrapper div
        // Leaflet setLatLng moves the DOM element directly (no React re-render)
        marker.setLatLng(latlng);

        // Update icon to reflect new bearing, occupancy, status
        marker.setIcon(createIcon(bus));

        // Update popup content (without closing it)
        if (popupsRef.current[bus.id]) {
          popupsRef.current[bus.id].setContent(createPopupContent(bus));
        }
      } else {
        // ── Create new marker ─────────────────────────────────────────────
        const popup = L.popup({ className: 'rt-popup', maxWidth: 260 })
          .setContent(createPopupContent(bus));

        const marker = L.marker(latlng, {
          icon: createIcon(bus),
          riseOnHover: true,
        })
          .addTo(map)
          .bindPopup(popup)
          .on('click', () => onBusSelect && onBusSelect(bus));

        markersRef.current[bus.id] = marker;
        popupsRef.current[bus.id] = popup;
      }
    });
  }, [buses, map, createIcon, createPopupContent, onBusSelect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(markersRef.current).forEach(m => m.remove());
    };
  }, [map]);

  return null;
}

// ─── Stop markers (static, rendered with react-leaflet) ──────────────────────
const createStopIcon = (stop) => {
  const colorClass = stop.is_metro ? 'bg-red-500' : 'bg-blue-400';
  const ringClass  = stop.is_metro ? 'border-red-500/50' : 'border-blue-400/50';
  return L.divIcon({
    html: `<div class="relative flex items-center justify-center w-5 h-5 rounded-full border-2 ${ringClass} bg-slate-950/90 shadow-md">
             <div class="w-1.5 h-1.5 rounded-full ${colorClass}"></div>
           </div>`,
    className: 'custom-stop-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

// ─── Main CommuterMap ─────────────────────────────────────────────────────────
export default function CommuterMap({ buses, stops, routes, onBusSelect, onSosTrigger, onExpressToggle }) {
  const hyderabadCenter = [17.3850, 78.4867];

  const [isFullscreen,   setIsFullscreen]   = useState(false);
  const [activeLayer,    setActiveLayer]    = useState('dark');
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [searchResults,  setSearchResults]  = useState([]);
  const [flyTarget,      setFlyTarget]      = useState(null);
  const [showBoundary,   setShowBoundary]   = useState(true);
  const [showStops,      setShowStops]      = useState(true);
  const [showRoutes,     setShowRoutes]     = useState(true);
  const [showTrails,     setShowTrails]     = useState(true);

  const sosCount    = buses ? buses.filter(b => b.status === 'SOS Alert').length : 0;
  const activeCount = buses ? buses.filter(b => b.status !== 'Rest Period').length : 0;

  // Search
  const handleSearch = useCallback((q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearchResults(
      HYD_LANDMARKS.filter(l => l.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6)
    );
  }, []);

  const handleSelectLandmark = (landmark) => {
    setFlyTarget(landmark);
    setSearchQuery(landmark.name);
    setSearchResults([]);
  };

  const boundaryStyle = {
    color: '#6366f1', weight: 2, opacity: 0.65,
    fillColor: '#6366f1', fillOpacity: 0.04, dashArray: '8, 5',
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-2xl border border-slate-800 transition-all duration-500 ${
      isFullscreen ? 'fixed inset-0 z-[9999] rounded-none border-0' : 'w-full h-full'
    }`}>

      {/* ── Map ─────────────────────────────────────────────────────────── */}
      <MapContainer
        center={hyderabadCenter}
        zoom={11}
        minZoom={9}
        maxZoom={19}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ width: '100%', height: '100%', background: '#0b0f19' }}
      >
        <DynamicTileLayer layerKey={activeLayer} />
        <FlyToController target={flyTarget} />
        <ZoomControl position="bottomright" />
        <ScaleControl position="bottomleft" imperial={false} />

        {/* City boundary */}
        {showBoundary && (
          <GeoJSON key="hyd-boundary" data={HYD_BOUNDARY} style={boundaryStyle} />
        )}

        {/* Route polylines */}
        {showRoutes && routes && Object.values(routes).map((route) => (
          <Polyline
            key={route.code}
            positions={route.path}
            pathOptions={{
              color: route.color,
              weight: 3.5,
              opacity: 0.65,
              dashArray: route.type === 'Metro Rail' ? '8, 5' : undefined,
            }}
          />
        ))}

        {/* Bus trail breadcrumbs (last 5 positions) */}
        {showTrails && buses && buses.map(bus =>
          (bus.trail || []).map((pos, i) => (
            <CircleMarker
              key={`${bus.id}-trail-${i}`}
              center={[pos[0], pos[1]]}
              radius={2.5 - i * 0.4}
              pathOptions={{
                color: bus.color || '#ef4444',
                fillColor: bus.color || '#ef4444',
                fillOpacity: (i + 1) / (bus.trail.length + 1) * 0.5,
                opacity: (i + 1) / (bus.trail.length + 1) * 0.6,
                weight: 0,
              }}
            />
          ))
        )}

        {/* Stop markers */}
        {showStops && stops && Object.entries(stops).map(([key, stop]) => (
          <Marker key={key} position={stop.coords} icon={createStopIcon(stop)}>
            <Popup>
              <div className="p-1 font-sans">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${stop.is_metro ? 'bg-red-500' : 'bg-blue-400'}`}></span>
                  <h3 className="font-extrabold text-sm text-slate-100">{stop.name}</h3>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  {stop.is_metro ? '🚇 Hyderabad Metro Station' : '🚌 TGSRTC Bus Hub Stop'}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Animated bus markers — imperative Leaflet (smooth movement) */}
        <AnimatedBusMarkers
          buses={buses}
          onBusSelect={onBusSelect}
          onSosTrigger={onSosTrigger}
          onExpressToggle={onExpressToggle}
        />
      </MapContainer>

      {/* ── Floating overlays ────────────────────────────────────────────── */}

      {/* Top bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex items-start gap-2 pointer-events-none">

        {/* Search */}
        <div className="flex-1 relative pointer-events-auto">
          <div className="flex items-center bg-slate-900/95 backdrop-blur-md border border-slate-700/60 rounded-xl shadow-2xl px-3 py-2 gap-2">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search Hyderabad area, landmark..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none font-medium"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]); }}>
                <X className="h-3.5 w-3.5 text-slate-500 hover:text-slate-300" />
              </button>
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-slate-900/98 backdrop-blur-md border border-slate-700/60 rounded-xl shadow-2xl overflow-hidden">
              {searchResults.map((lm) => (
                <button
                  key={lm.name}
                  onClick={() => handleSelectLandmark(lm)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800/80 transition-colors text-left"
                >
                  <Navigation className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-slate-200">{lm.name}</div>
                    <div className="text-[10px] text-slate-500">{lm.coords[0].toFixed(4)}°N, {lm.coords[1].toFixed(4)}°E</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Layer switcher */}
        <div className="relative pointer-events-auto">
          <button
            onClick={() => setShowLayerPanel(p => !p)}
            className="bg-slate-900/95 backdrop-blur-md border border-slate-700/60 rounded-xl shadow-2xl p-2.5 hover:bg-slate-800 transition-colors"
          >
            <Layers className="h-4 w-4 text-slate-300" />
          </button>
          {showLayerPanel && (
            <div className="absolute top-full right-0 mt-1 bg-slate-900/98 backdrop-blur-md border border-slate-700/60 rounded-xl shadow-2xl overflow-hidden w-48 z-10">
              <div className="px-3 py-2 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">Map Style</div>
              {Object.entries(TILE_LAYERS).map(([key, layer]) => (
                <button
                  key={key}
                  onClick={() => { setActiveLayer(key); setShowLayerPanel(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold hover:bg-slate-800 ${activeLayer === key ? 'text-indigo-400' : 'text-slate-300'}`}
                >
                  {layer.label}
                  {activeLayer === key && <span className="w-2 h-2 rounded-full bg-indigo-400"></span>}
                </button>
              ))}
              <div className="border-t border-slate-800 px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Overlays</div>
              {[
                { label: 'City Boundary', state: showBoundary, toggle: setShowBoundary },
                { label: 'Bus Stops',     state: showStops,    toggle: setShowStops },
                { label: 'Route Lines',   state: showRoutes,   toggle: setShowRoutes },
                { label: 'Bus Trails',    state: showTrails,   toggle: setShowTrails },
              ].map(({ label, state, toggle }) => (
                <button
                  key={label}
                  onClick={() => toggle(s => !s)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold hover:bg-slate-800 text-slate-300"
                >
                  {label}
                  <div className={`w-8 h-4 rounded-full border transition-colors ${state ? 'bg-indigo-500 border-indigo-400' : 'bg-slate-700 border-slate-600'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white shadow-sm mt-0.5 transition-transform ${state ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fullscreen toggle */}
        <button
          onClick={() => setIsFullscreen(f => !f)}
          className="pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-slate-700/60 rounded-xl shadow-2xl p-2.5 hover:bg-slate-800 transition-colors"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4 text-slate-300" /> : <Maximize2 className="h-4 w-4 text-slate-300" />}
        </button>
      </div>

      {/* Region badge */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[999] pointer-events-none">
        <div className="bg-indigo-600/20 backdrop-blur-md border border-indigo-500/30 rounded-full px-4 py-1 text-[11px] font-black text-indigo-300 uppercase tracking-widest shadow-lg whitespace-nowrap">
          🗺 Greater Hyderabad — Real-Time Transit
        </div>
      </div>

      {/* Bottom stats */}
      <div className="absolute bottom-8 left-3 z-[1000] pointer-events-none flex flex-col gap-2">
        {/* Live bus count pill */}
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl px-3 py-2 shadow-2xl flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold text-emerald-400">{activeCount} Moving</span>
          </div>
          {sosCount > 0 && (
            <>
              <span className="w-px h-3 bg-slate-700"></span>
              <div className="flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span className="text-[11px] font-bold text-rose-400">{sosCount} SOS</span>
              </div>
            </>
          )}
          <span className="w-px h-3 bg-slate-700"></span>
          <div className="flex items-center gap-1">
            <Bus className="h-3 w-3 text-slate-500" />
            <span className="text-[11px] font-bold text-slate-400">{buses?.length || 0} Buses</span>
          </div>
          <span className="w-px h-3 bg-slate-700"></span>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-slate-500" />
            <span className="text-[11px] font-bold text-slate-400">{stops ? Object.keys(stops).length : 0} Stops</span>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl px-3 py-2 shadow-2xl flex items-center gap-3 text-[10px] font-bold">
          <span className="text-slate-500 uppercase tracking-widest">Occupancy:</span>
          {[['bg-emerald-500','Low'], ['bg-amber-400','Med'], ['bg-rose-500','Full']].map(([cls, lbl]) => (
            <div key={lbl} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${cls}`}></span>
              <span className="text-slate-400">{lbl}</span>
            </div>
          ))}
          <span className="w-px h-3 bg-slate-700 mx-1"></span>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 border-t-2 border-dashed border-indigo-400"></div>
            <span className="text-slate-400">Metro</span>
          </div>
        </div>
      </div>
    </div>
  );
}
