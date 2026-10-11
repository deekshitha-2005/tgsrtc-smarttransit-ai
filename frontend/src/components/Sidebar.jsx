import React from 'react';
import { Bus, Map, ShieldAlert, BarChart3, Radio } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, alertCount }) {
  const menuItems = [
    { id: 'commuter', label: 'Commuter Portal', icon: Map },
    { id: 'depot', label: 'Depot Manager', icon: Bus, badge: alertCount },
    { id: 'analytics', label: 'Analytics Portal', icon: BarChart3 },
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-rose-600 p-2.5 rounded-xl shadow-lg shadow-rose-950 flex items-center justify-center">
          <Bus className="h-6 w-6 text-white animate-pulse" />
        </div>
        <div>
          <h1 className="font-extrabold text-sm tracking-wider uppercase bg-gradient-to-r from-rose-400 via-rose-500 to-amber-400 bg-clip-text text-transparent">
            TGSRTC
          </h1>
          <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">
            SmartTransit AI
          </p>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group text-left ${
                isActive
                  ? 'bg-rose-600/10 border-l-4 border-rose-500 text-rose-400 font-medium'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 transition-transform duration-200 ${
                  isActive ? 'text-rose-400 scale-105' : 'text-slate-500 group-hover:text-slate-300'
                }`} />
                <span className="text-sm font-semibold">{item.label}</span>
              </div>
              {item.badge && item.badge > 0 ? (
                <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <Radio className="h-3.5 w-3.5 text-rose-500 animate-ping" />
          <span className="font-semibold uppercase tracking-widest text-slate-400">Hyderabad Metropolitan</span>
        </div>
        <p className="text-[10px] text-slate-600 mt-1 font-medium">
          Dynamic AI Engine v1.0.0
        </p>
      </div>
    </div>
  );
}
