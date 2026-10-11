import React from 'react';
import RosterTable from '../components/RosterTable';
import { Bell, ShieldAlert, CheckCircle, Radio } from 'lucide-react';

export default function DepotDashboard({ state, staticData, onSosTrigger, onExpressToggle, onDispatchSpecial, onDismissAlert }) {
  const { buses, alerts } = state;
  const { depots } = staticData;

  // Active metrics calculations
  const totalFleet = buses.length;
  const onDutyCount = buses.filter((b) => b.status === 'On Duty' || b.status === 'In Transit').length;
  const sosCount = buses.filter((b) => b.status === 'SOS Alert').length;
  const restingCount = buses.filter((b) => b.status === 'Rest Period').length;

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-950 p-6 overflow-y-auto">
      {/* Top statistics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Active Buses */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Total Fleet Strength</p>
          <div className="flex items-end justify-between mt-3">
            <h3 className="text-3xl font-black text-slate-100">{totalFleet}</h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Buses</span>
          </div>
        </div>

        {/* On Duty */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Active In Transit</p>
          <div className="flex items-end justify-between mt-3">
            <h3 className="text-3xl font-black text-emerald-400">{onDutyCount}</h3>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">On Schedule</span>
          </div>
        </div>

        {/* SOS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Active SOS Warnings</p>
          <div className="flex items-end justify-between mt-3">
            <h3 className={`text-3xl font-black ${sosCount > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
              {sosCount}
            </h3>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${sosCount > 0 ? 'text-rose-400 font-extrabold' : 'text-slate-500'}`}>
              {sosCount > 0 ? 'CRITICAL ALERT' : 'All Clear'}
            </span>
          </div>
        </div>

        {/* Resting */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Terminal Rest Periods</p>
          <div className="flex items-end justify-between mt-3">
            <h3 className="text-3xl font-black text-sky-400">{restingCount}</h3>
            <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest">Layovers</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left is Roster Table, Right is Alert Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Roster Table & Dispatches */}
        <div className="lg:col-span-2 space-y-6">
          <RosterTable 
            buses={buses}
            depots={depots}
            onSosTrigger={onSosTrigger}
            onExpressToggle={onExpressToggle}
            onDispatchSpecial={onDispatchSpecial}
          />
        </div>

        {/* Right Side: Dispatch Alerts Log */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-fit space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Bell className="h-4 w-4 text-rose-500 animate-swing" /> Operations Log
            </h3>
            <span className="text-[9px] bg-slate-950 text-slate-400 font-bold border border-slate-800 px-2 py-0.5 rounded">
              {alerts.length} Logs
            </span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-slate-600">
                <CheckCircle className="h-8 w-8 mx-auto opacity-35 mb-2" />
                <p className="text-xs font-bold uppercase tracking-wider">No Active Alerts</p>
                <p className="text-[9px] text-slate-700 mt-0.5">Everything is operating normally.</p>
              </div>
            ) : (
              alerts.map((alert) => {
                const isWarning = alert.level === 'WARNING';
                const isSOS = alert.level === 'SOS';
                const isSched = alert.level === 'SCHEDULING';
                
                let cardStyle = "bg-slate-950/60 border-slate-850 text-slate-300";
                let textStyle = "text-slate-300";
                if (isSOS) {
                  cardStyle = "bg-rose-950/20 border-rose-900/40 text-rose-300 animate-pulse";
                  textStyle = "text-rose-200";
                } else if (isWarning) {
                  cardStyle = "bg-amber-950/20 border-amber-900/40 text-amber-300";
                  textStyle = "text-amber-200";
                } else if (isSched) {
                  cardStyle = "bg-sky-955/20 border-sky-900/40 text-sky-300";
                  textStyle = "text-sky-200";
                }

                return (
                  <div 
                    key={alert.id} 
                    className={`border rounded-xl p-3.5 space-y-2 transition-all hover:border-slate-700 ${cardStyle}`}
                  >
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase">
                      <span className="flex items-center gap-1">
                        <Radio className="h-3 w-3 text-rose-500 animate-pulse" /> {alert.timestamp}
                      </span>
                      <button 
                        onClick={() => onDismissAlert(alert.id)}
                        className="text-slate-500 hover:text-slate-300 transition-colors uppercase font-black text-[8px]"
                      >
                        Dismiss
                      </button>
                    </div>
                    <p className={`text-[11px] font-semibold leading-relaxed ${textStyle}`}>
                      {alert.message}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
