import React, { useState } from 'react';
import { Search, ShieldAlert, Phone, ToggleLeft, ToggleRight, Sparkles, Filter } from 'lucide-react';

export default function RosterTable({ buses, depots, onSosTrigger, onExpressToggle, onDispatchSpecial }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [depotFilter, setDepotFilter] = useState('ALL');
  const [dispatchRoute, setDispatchRoute] = useState('218');
  const [dispatchDepot, setDispatchDepot] = useState('Miyapur');
  const [isDispatching, setIsDispatching] = useState(false);

  const filteredBuses = buses.filter((bus) => {
    const matchesSearch = 
      bus.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.conductor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.route_code.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesDepot = depotFilter === 'ALL' || bus.depot === depotFilter;
    
    return matchesSearch && matchesDepot;
  });

  const handleDispatch = async (e) => {
    e.preventDefault();
    setIsDispatching(true);
    try {
      await onDispatchSpecial(dispatchRoute, dispatchDepot);
      // Brief feedback delay
      setTimeout(() => {
        setIsDispatching(false);
      }, 1000);
    } catch (err) {
      setIsDispatching(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 select-none">
      
      {/* Top action: dispatch controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h2 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-rose-500" /> Dispatch Center
          </h2>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Send dynamic Peak-Hour Specials to relieve overloaded stops</p>
        </div>

        <form onSubmit={handleDispatch} className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <div className="flex flex-col gap-0.5">
            <label className="text-[8px] font-bold text-slate-500 uppercase">Route</label>
            <select
              value={dispatchRoute}
              onChange={(e) => setDispatchRoute(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-200 focus:outline-none font-bold"
            >
              <option value="218">218 - Patancheru</option>
              <option value="10H">10H - Kondapur</option>
              <option value="127K">127K - Kondapur</option>
              <option value="49M">49M - Mehdipatnam</option>
              <option value="PUSHPAK">PUSHPAK - RGIA Airport</option>
            </select>
          </div>

          <div className="h-8 w-px bg-slate-800 mx-1"></div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[8px] font-bold text-slate-500 uppercase">Depot</label>
            <select
              value={dispatchDepot}
              onChange={(e) => setDispatchDepot(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-200 focus:outline-none font-bold"
            >
              {depots.map((dep) => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isDispatching}
            className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-black px-4 py-2 rounded-lg transition-all shadow-md shadow-rose-950/20 uppercase tracking-widest disabled:opacity-50"
          >
            {isDispatching ? 'Dispatching...' : 'Dispatch Special'}
          </button>
        </form>
      </div>

      {/* Roster list tools (search & filters) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search driver, bus plate, or route code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-semibold"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">Depot:</span>
          <select
            value={depotFilter}
            onChange={(e) => setDepotFilter(e.target.value)}
            className="bg-transparent border-none text-xs text-slate-200 focus:outline-none font-extrabold cursor-pointer"
          >
            <option value="ALL">All Depots</option>
            {depots.map((dep) => (
              <option key={dep} value={dep}>{dep}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Roster Grid / Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/40">
        <table className="w-full border-collapse text-left text-xs text-slate-200">
          <thead className="bg-slate-950 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-400">Bus Number</th>
              <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-400">Route & Type</th>
              <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-400">Assigned Crew</th>
              <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-400">Shift & Depot</th>
              <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-400">Status</th>
              <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-400 text-center">Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {filteredBuses.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-600 font-bold uppercase tracking-wider">
                  No active buses match criteria
                </td>
              </tr>
            ) : (
              filteredBuses.map((bus) => {
                const isSOS = bus.status === 'SOS Alert';
                return (
                  <tr 
                    key={bus.id}
                    className={`hover:bg-slate-900/40 transition-colors ${
                      isSOS ? 'bg-rose-950/10 border-l-4 border-l-rose-500' : ''
                    }`}
                  >
                    {/* Plate */}
                    <td className="px-4 py-4">
                      <div className="font-extrabold text-slate-200 flex items-center gap-1.5">
                        {bus.id}
                        {bus.is_special && (
                          <span className="text-[8px] font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1 rounded">SPL</span>
                        )}
                      </div>
                    </td>

                    {/* Route */}
                    <td className="px-4 py-4">
                      <div>
                        <span className="text-[10px] font-black text-slate-100">{bus.route_code}</span>
                        <p className="text-[9px] text-slate-500 mt-0.5">{bus.type}</p>
                      </div>
                    </td>

                    {/* Crew */}
                    <td className="px-4 py-4">
                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-extrabold text-slate-400">D:</span>
                          <span className="text-slate-300 font-semibold">{bus.driver.name}</span>
                          <a href={`tel:${bus.driver.phone}`} className="text-rose-400 hover:text-rose-300 transition-colors">
                            <Phone className="h-3 w-3" />
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-extrabold text-slate-400">C:</span>
                          <span className="text-slate-300 font-semibold">{bus.conductor.name}</span>
                          <a href={`tel:${bus.conductor.phone}`} className="text-rose-400 hover:text-rose-300 transition-colors">
                            <Phone className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </td>

                    {/* Depot */}
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-slate-300 text-[11px]">{bus.depot} Depot</p>
                        <p className="text-[9px] text-slate-500 mt-0.5 font-bold">{bus.shift}</p>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-4">
                      <span 
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          isSOS ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse' :
                          bus.status === 'Rest Period' ? 'bg-slate-700/20 text-slate-400 border-slate-600/30' :
                          'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {bus.status}
                      </span>
                    </td>

                    {/* Toggle action buttons */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-3">
                        {/* On demand toggle */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onExpressToggle(bus.id)}
                            className="text-slate-400 hover:text-white transition-all"
                            title="Toggle On-Demand Express (Skip Stops)"
                          >
                            {bus.is_on_demand_express ? (
                              <ToggleRight className="h-6 w-6 text-amber-400" />
                            ) : (
                              <ToggleLeft className="h-6 w-6 text-slate-600" />
                            )}
                          </button>
                          <span className="text-[8px] text-slate-500 uppercase font-black">Express</span>
                        </div>

                        {/* Emergency Toggle */}
                        <button
                          onClick={() => onSosTrigger(bus.id, isSOS)}
                          className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider border flex items-center gap-1 ${
                            isSOS 
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent' 
                              : 'bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border-rose-500/20 hover:border-transparent'
                          }`}
                        >
                          <ShieldAlert className="h-3 w-3" />
                          {isSOS ? 'Resolve' : 'SOS'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
