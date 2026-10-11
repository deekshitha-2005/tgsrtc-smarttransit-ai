import React from 'react';
import DemandChart from '../components/DemandChart';
import { BarChart3, TrendingUp, Cpu, Leaf, Info } from 'lucide-react';

export default function AnalyticsPortal({ state }) {
  const { stopQueues, buses } = state;

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-950 p-6 overflow-y-auto select-none font-sans">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-rose-500 animate-pulse" />
          <h2 className="font-extrabold text-base text-slate-100 uppercase tracking-wider">
            Analytics Portal
          </h2>
        </div>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          AI scheduling performance dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (Charts and savings statistics) */}
        <div className="lg:col-span-2 space-y-6">
          <DemandChart stopQueues={stopQueues} buses={buses} />
        </div>

        {/* Right Column: AI Optimization summary panel */}
        <div className="space-y-6">
          {/* AI Decision Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="h-4 w-4 text-rose-500 animate-spin" /> Optimizer Intelligence
            </h3>
            
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              The SmartTransit demand optimizer analyzes hourly queues at major metro interchanges and switches buses to "On-Demand Express" mode when stop demand dips below critical thresholds.
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-slate-500">Scheduler Policy:</span>
                <span className="text-rose-400 font-extrabold">Dynamic Allocations</span>
              </div>
              <div className="flex items-center justify-between font-semibold">
                <span className="text-slate-500">Queue Alert Threshold:</span>
                <span className="text-slate-300">80% Capacity (80 pax)</span>
              </div>
              <div className="flex items-center justify-between font-semibold">
                <span className="text-slate-500">Off-Peak Skip Slots:</span>
                <span className="text-amber-400 font-black">11:00 AM - 03:00 PM</span>
              </div>
            </div>

            <div className="bg-rose-950/10 border border-rose-900/20 rounded-xl p-3.5 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black text-rose-300 uppercase">Dynamic Dispatch Alert</p>
                <p className="text-[9px] text-slate-400 mt-1 leading-relaxed font-semibold">
                  Dispatcher automatically alerts Miyapur & Ranigunj depots to dispatch extra "Peak-Hour Specials" when crowd indicators rise.
                </p>
              </div>
            </div>
          </div>

          {/* Eco Contribution Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 relative overflow-hidden group">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 bg-emerald-600/5 p-12 rounded-full border border-emerald-500/5"></div>
            <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Leaf className="h-4 w-4 text-emerald-400" /> Climate impact
            </h3>
            
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              By shifting empty/low-occupancy buses to skip stops and run expresses, TGSRTC Hyderabad significantly decreases fuel waste and urban smog in IT corridors.
            </p>

            <div className="space-y-2 pt-2 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500 font-semibold">Daily NOx Reduction:</span>
                <span className="text-slate-200 font-bold">~4.1 kg</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500 font-semibold">Particulate Matter saved:</span>
                <span className="text-slate-200 font-bold">~0.68 kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Fuel Efficiency Gain:</span>
                <span className="text-emerald-400 font-black">+14.2%</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
