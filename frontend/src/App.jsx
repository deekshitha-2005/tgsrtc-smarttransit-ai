import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import CommuterPortal from './pages/CommuterPortal';
import DepotDashboard from './pages/DepotDashboard';
import AnalyticsPortal from './pages/AnalyticsPortal';
import { Bus, Loader2, Wifi, WifiOff } from 'lucide-react';

const WS_URL = 'ws://localhost:8000/ws/live';
const REST_FALLBACK_URL = 'http://localhost:8000/api/state';
const STATIC_URL = 'http://localhost:8000/api/static-data';

export default function App() {
  const [activeTab, setActiveTab] = useState('commuter');
  const [staticData, setStaticData] = useState(null);
  const [liveState, setLiveState] = useState({ buses: [], stop_queues: {}, alerts: [] });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // WebSocket connection state
  const [wsStatus, setWsStatus] = useState('connecting'); // 'live' | 'fallback' | 'connecting' | 'error'
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const pingTimer = useRef(null);

  // ── Fetch static data once on mount ───────────────────────────────────────
  useEffect(() => {
    const fetchStatic = async () => {
      try {
        const res = await fetch(STATIC_URL);
        const data = await res.json();
        setStaticData(data);
        setError(null);
      } catch (err) {
        setError('Could not connect to the transit simulation server. Please start the FastAPI backend on port 8000.');
      }
    };
    fetchStatic();
  }, []);

  // ── WebSocket real-time connection ─────────────────────────────────────────
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    console.log('[WS] Connecting to', WS_URL);
    setWsStatus('connecting');
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected!');
      setWsStatus('live');
      setError(null);
      // Send heartbeat pings every 20s
      pingTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping');
      }, 20000);
    };

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (data.type === 'pong' || data.type === 'heartbeat') return;
        setLiveState(data);
        setLastUpdateTime(data.server_time || new Date().toLocaleTimeString('en-IN'));
        setLoading(false);
      } catch (e) {
        console.warn('[WS] Parse error:', e);
      }
    };

    ws.onerror = () => {
      console.warn('[WS] Error — switching to REST fallback');
      setWsStatus('fallback');
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected. Reconnecting in 3s...');
      clearInterval(pingTimer.current);
      setWsStatus('connecting');
      // Attempt reconnect after 3s
      reconnectTimer.current = setTimeout(connectWebSocket, 3000);
    };
  }, []);

  // ── Fallback REST poll if WS fails ─────────────────────────────────────────
  useEffect(() => {
    if (wsStatus !== 'fallback') return;
    const poll = async () => {
      try {
        const res = await fetch(REST_FALLBACK_URL);
        const data = await res.json();
        setLiveState(data);
        setLastUpdateTime(new Date().toLocaleTimeString('en-IN'));
        setLoading(false);
      } catch {
        if (loading) setError('Connection to transit server lost. Reconnecting...');
      }
    };
    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, [wsStatus, loading]);

  // ── Start WS connection on mount ──────────────────────────────────────────
  useEffect(() => {
    connectWebSocket();
    return () => {
      clearTimeout(reconnectTimer.current);
      clearInterval(pingTimer.current);
      wsRef.current?.close();
    };
  }, [connectWebSocket]);

  // ── Action handlers ────────────────────────────────────────────────────────
  const handleSosTrigger = async (busId, currentlySos) => {
    try {
      const endpoint = currentlySos ? 'resolve-sos' : 'sos';
      const res = await fetch(`http://localhost:8000/api/buses/${endpoint}/${busId}`, { method: 'POST' });
      if (res.ok) {
        setLiveState(prev => ({
          ...prev,
          buses: prev.buses.map(b =>
            b.id === busId ? { ...b, status: currentlySos ? 'On Duty' : 'SOS Alert' } : b
          )
        }));
      }
    } catch (err) { console.error('SOS error:', err); }
  };

  const handleExpressToggle = async (busId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/buses/toggle-express/${busId}`, { method: 'POST' });
      if (res.ok) {
        setLiveState(prev => ({
          ...prev,
          buses: prev.buses.map(b =>
            b.id === busId ? { ...b, is_on_demand_express: !b.is_on_demand_express } : b
          )
        }));
      }
    } catch (err) { console.error('Express toggle error:', err); }
  };

  const handleDispatchSpecial = async (routeCode, depot) => {
    try {
      const res = await fetch('http://localhost:8000/api/buses/dispatch-special', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route_code: routeCode, depot })
      });
      if (res.ok) {
        const data = await res.json();
        setLiveState(prev => ({ ...prev, buses: [...prev.buses, data.bus] }));
      }
    } catch (err) { console.error('Dispatch error:', err); }
  };

  const handleDismissAlert = async (alertId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/alerts/dismiss/${alertId}`, { method: 'POST' });
      if (res.ok) {
        setLiveState(prev => ({ ...prev, alerts: prev.alerts.filter(a => a.id !== alertId) }));
      }
    } catch (err) { console.error('Dismiss alert error:', err); }
  };

  const handleBusSelectOnMap = (bus) => console.log('Selected bus:', bus);

  // ── Error screen ───────────────────────────────────────────────────────────
  if (error && !staticData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-100 font-sans p-6 text-center">
        <div className="bg-rose-600/10 p-5 rounded-2xl border border-rose-500/20 mb-6">
          <Bus className="h-10 w-10 text-rose-500 animate-bounce" />
        </div>
        <h1 className="text-xl font-black uppercase tracking-wider mb-2">TGSRTC Transit Server Unreachable</h1>
        <p className="text-slate-400 text-sm max-w-md leading-relaxed font-semibold mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs px-5 py-3 rounded-xl uppercase tracking-widest shadow-lg transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!staticData || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-100 font-sans">
        <Loader2 className="h-8 w-8 text-rose-500 animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-500 mt-4">
          Synchronising Hyd Transit Live Feed...
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-950 overflow-hidden font-sans text-slate-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} alertCount={liveState.alerts.length} />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Real-time status banner */}
        <div className="flex items-center justify-end gap-3 px-4 pt-2 pb-0">
          <div className={`flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full border transition-all ${
            wsStatus === 'live'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : wsStatus === 'fallback'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-slate-700/30 text-slate-500 border-slate-600/20'
          }`}>
            {wsStatus === 'live' ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Wifi className="h-3 w-3" /> LIVE WebSocket
              </>
            ) : wsStatus === 'fallback' ? (
              <><WifiOff className="h-3 w-3" /> REST Fallback (2s)</>
            ) : (
              <><Loader2 className="h-3 w-3 animate-spin" /> Connecting...</>
            )}
          </div>
          {lastUpdateTime && (
            <span className="text-[10px] text-slate-600 font-semibold">
              Updated: {lastUpdateTime}
            </span>
          )}
        </div>

        {activeTab === 'commuter' && (
          <CommuterPortal
            buses={liveState.buses}
            stops={staticData.stops}
            routes={staticData.routes}
            onBusSelect={handleBusSelectOnMap}
            onSosTrigger={handleSosTrigger}
            onExpressToggle={handleExpressToggle}
          />
        )}
        {activeTab === 'depot' && (
          <DepotDashboard
            state={liveState}
            staticData={staticData}
            onSosTrigger={handleSosTrigger}
            onExpressToggle={handleExpressToggle}
            onDispatchSpecial={handleDispatchSpecial}
            onDismissAlert={handleDismissAlert}
          />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsPortal state={liveState} />
        )}
      </div>
    </div>
  );
}
