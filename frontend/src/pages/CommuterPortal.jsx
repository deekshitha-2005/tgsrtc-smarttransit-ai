import React from 'react';
import CommuterMap from '../components/CommuterMap';
import JourneyPlanner from '../components/JourneyPlanner';
import AIChatbot from '../components/AIChatbot';
import { ShieldCheck, Info } from 'lucide-react';

export default function CommuterPortal({ buses, stops, routes, onBusSelect, onSosTrigger, onExpressToggle }) {
  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-950 p-6 overflow-hidden relative">
      {/* Top Banner Alert (Simulated Announcements) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 mb-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2 text-xs">
          <Info className="h-4 w-4 text-rose-500 animate-bounce" />
          <span className="text-slate-400 font-bold">LIVE ANNOUNCEMENT:</span>
          <marquee className="text-slate-300 font-medium w-[450px]">
            🌧️ Due to waterlogging near Ameerpet pillar 1020, Route 218 buses are diverted via Begumpet flyover. Delays up to 15 mins.
          </marquee>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold">
          <ShieldCheck className="h-3 w-3" /> System Security Active
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Left Column: Journey Planner Search */}
        <div className="h-full flex flex-col overflow-hidden">
          <JourneyPlanner 
            stops={stops} 
            routes={routes} 
            buses={buses} 
            onBusSelect={onBusSelect}
          />
        </div>

        {/* Right Column: Live Leaflet Map */}
        <div className="lg:col-span-2 h-full flex flex-col">
          <CommuterMap 
            buses={buses} 
            stops={stops} 
            routes={routes} 
            onBusSelect={onBusSelect}
            onSosTrigger={onSosTrigger}
            onExpressToggle={onExpressToggle}
          />
        </div>
      </div>

      {/* Floating Conversational Chatbot Assistant */}
      <AIChatbot />
    </div>
  );
}
