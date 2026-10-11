import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Leaf, Flame, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';

const demandData = [
  { hour: '06:00', HitecCity: 20, Secunderabad: 35, MGBS: 40, Mehdipatnam: 30 },
  { hour: '08:00', HitecCity: 85, Secunderabad: 70, MGBS: 65, Mehdipatnam: 75 },
  { hour: '10:00', HitecCity: 95, Secunderabad: 80, MGBS: 75, Mehdipatnam: 85 },
  { hour: '12:00', HitecCity: 40, Secunderabad: 45, MGBS: 50, Mehdipatnam: 40 },
  { hour: '14:00', HitecCity: 35, Secunderabad: 40, MGBS: 45, Mehdipatnam: 38 },
  { hour: '16:00', HitecCity: 60, Secunderabad: 55, MGBS: 50, Mehdipatnam: 62 },
  { hour: '18:00', HitecCity: 98, Secunderabad: 85, MGBS: 80, Mehdipatnam: 90 },
  { hour: '20:00', HitecCity: 80, Secunderabad: 75, MGBS: 70, Mehdipatnam: 80 },
  { hour: '22:00', HitecCity: 30, Secunderabad: 40, MGBS: 45, Mehdipatnam: 35 },
];

export default function DemandChart({ stopQueues, buses }) {
  // Compute global dynamic analytics based on simulator state
  const totalBuses = buses.length;
  const expressBuses = buses.filter(b => b.is_on_demand_express).length;
  
  // Calculate Diesel Saved: each express bus saves approx 12 liters/day by skipping low demand slots
  const dieselSaved = Math.round((expressBuses * 12.5) + (totalBuses * 2.1));
  // Calculate Carbon Offset: 1 Liter Diesel = 2.68 kg CO2
  const co2Offset = (dieselSaved * 2.68).toFixed(1);
  
  // Calculate Peak Commuter load index
  const highQueueCount = Object.values(stopQueues || {}).filter(q => q > 80).length;

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Real-time Savings Metrics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Diesel Savings Widget */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 bg-rose-600/10 p-8 rounded-full border border-rose-500/10 group-hover:scale-110 transition-transform duration-300">
            <Flame className="h-6 w-6 text-rose-500" />
          </div>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Active Fuel Savings</p>
          <h3 className="text-3xl font-black text-slate-100 mt-3">{dieselSaved} L</h3>
          <p className="text-[10px] text-emerald-400 font-bold mt-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> +{(expressBuses * 0.8).toFixed(1)} L/hour from express skips
          </p>
        </div>

        {/* Carbon Offset Widget */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 bg-emerald-600/10 p-8 rounded-full border border-emerald-500/10 group-hover:scale-110 transition-transform duration-300">
            <Leaf className="h-6 w-6 text-emerald-400" />
          </div>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">CO2 Carbon Offsets</p>
          <h3 className="text-3xl font-black text-slate-100 mt-3">{co2Offset} kg</h3>
          <p className="text-[10px] text-emerald-400 font-bold mt-2">
            🌳 Equivalent to {Math.round(co2Offset / 20.0)} mature trees planted today
          </p>
        </div>

        {/* High Congestion Alert Widget */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 bg-amber-600/10 p-8 rounded-full border border-amber-500/10 group-hover:scale-110 transition-transform duration-300">
            <ShieldAlert className="h-6 w-6 text-amber-500" />
          </div>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Critical Transit Hubs</p>
          <h3 className="text-3xl font-black text-slate-100 mt-3">{highQueueCount}</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-2">
            {highQueueCount > 0 ? (
              <span className="text-rose-400 font-extrabold animate-pulse">⚠️ Hub queue exceeding 80% capacity!</span>
            ) : (
              <span className="text-slate-400 font-bold">✅ All stops queue counts normal</span>
            )}
          </p>
        </div>
      </div>

      {/* Demand Curve Chart panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-rose-500" /> Hourly Passenger Demand curves
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Real-time load profiles at Hyderabad IT corridor junctions</p>
        </div>

        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={demandData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHitec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="hour" 
                stroke="#64748b" 
                fontSize={10} 
                fontWeight={700}
                tickLine={false}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                fontWeight={700}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Demand %', angle: -90, position: 'insideLeft', offset: 0, fill: '#64748b', fontSize: 10, fontWeight: 700 }}
              />
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc', fontFamily: 'sans-serif', fontSize: '12px' }}
                labelStyle={{ fontWeight: 'black', color: '#94a3b8' }}
              />
              <Area type="monotone" dataKey="HitecCity" name="Hitec City" stroke="#e11d48" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHitec)" />
              <Area type="monotone" dataKey="Secunderabad" name="Secunderabad" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSec)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 justify-center text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-3 h-1.5 rounded bg-rose-500"></span>
            <span>Hitec City / Raidurg</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1.5 rounded bg-blue-500"></span>
            <span>Secunderabad Station</span>
          </div>
        </div>
      </div>
    </div>
  );
}
