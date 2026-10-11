import React, { useState } from 'react';
import { Search, Compass, Users, Phone, Navigation, ArrowRightLeft, Star } from 'lucide-react';

export default function JourneyPlanner({ stops, routes, buses, onBusSelect }) {
  const [source, setSource] = useState('KOTI');
  const [destination, setDestination] = useState('KONDAPUR');
  const [mahalakshmiEligible, setMahalakshmiEligible] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const stopOptions = Object.entries(stops || {}).map(([key, stop]) => ({
    code: key,
    name: stop.name,
    is_metro: stop.is_metro
  }));

  const handleSearch = (e) => {
    e.preventDefault();
    if (source === destination) {
      setSearchResults([]);
      setSearched(true);
      return;
    }

    const directRoutes = [];
    // Search for direct routes containing both stops in order
    Object.values(routes || {}).forEach((route) => {
      const sourceIdx = route.stops.indexOf(source);
      const destIdx = route.stops.indexOf(destination);
      if (sourceIdx !== -1 && destIdx !== -1 && sourceIdx < destIdx) {
        // Calculate stops in between
        const intermediateStops = route.stops.slice(sourceIdx, destIdx + 1);
        // Estimate travel time (approx 4 mins per stop)
        const estimatedTime = (destIdx - sourceIdx) * 4;
        // Calculate fare based on fare factor
        const distanceKm = (destIdx - sourceIdx) * 3.5;
        let baseFare = Math.round(distanceKm * route.fare_factor * 2); // Round to nearest 5 or 2
        baseFare = Math.max(10, baseFare - (baseFare % 5)); // Minimum 10 rupees

        // Determine if free under Mahalakshmi Scheme
        // Eligible for Ordinary, Metro Express, and Metro Deluxe. Pushpak AC and Metro Rail are excluded.
        const isFreeVehicle = route.type === 'Ordinary' || route.type === 'Metro Express' || route.type === 'Metro Deluxe';
        const finalFare = (mahalakshmiEligible && isFreeVehicle) ? 0 : baseFare;

        // Find active buses on this route
        const activeBuses = (buses || []).filter((b) => b.route_code === route.code);

        directRoutes.push({
          ...route,
          stopsCount: destIdx - sourceIdx,
          stopsList: intermediateStops,
          time: estimatedTime,
          fare: finalFare,
          originalFare: baseFare,
          isFree: mahalakshmiEligible && isFreeVehicle,
          activeBuses: activeBuses
        });
      }
    });

    // If no direct routes, generate a mock multi-modal plan
    if (directRoutes.length === 0) {
      // Create a transfer route at Ameerpet (the central transit hub of Hyd)
      // Check if source can go to Ameerpet, and Ameerpet can go to destination
      let sourceToAmeerpet = null;
      let ameerpetToDest = null;

      Object.values(routes || {}).forEach((route) => {
        const sIdx = route.stops.indexOf(source);
        const aIdx = route.stops.indexOf('AMEERPET');
        if (sIdx !== -1 && aIdx !== -1 && sIdx < aIdx) {
          sourceToAmeerpet = { route, stopsCount: aIdx - sIdx };
        }

        const a2Idx = route.stops.indexOf('AMEERPET');
        const dIdx = route.stops.indexOf(destination);
        if (a2Idx !== -1 && dIdx !== -1 && a2Idx < dIdx) {
          ameerpetToDest = { route, stopsCount: dIdx - a2Idx };
        }
      });

      if (sourceToAmeerpet && ameerpetToDest) {
        // Multi-modal connection
        const time1 = sourceToAmeerpet.stopsCount * 4;
        const time2 = ameerpetToDest.stopsCount * 4;
        const fare1 = Math.max(10, Math.round(sourceToAmeerpet.stopsCount * 3.5 * sourceToAmeerpet.route.fare_factor * 2));
        const fare2 = Math.max(10, Math.round(ameerpetToDest.stopsCount * 3.5 * ameerpetToDest.route.fare_factor * 2));

        const isFree1 = mahalakshmiEligible && (sourceToAmeerpet.route.type === 'Ordinary' || sourceToAmeerpet.route.type === 'Metro Express');
        const isFree2 = mahalakshmiEligible && (ameerpetToDest.route.type === 'Ordinary' || ameerpetToDest.route.type === 'Metro Express');

        const activeBuses1 = (buses || []).filter((b) => b.route_code === sourceToAmeerpet.route.code);
        const activeBuses2 = (buses || []).filter((b) => b.route_code === ameerpetToDest.route.code);

        directRoutes.push({
          isMultiModal: true,
          code: `${sourceToAmeerpet.route.code} ➔ ${ameerpetToDest.route.code}`,
          name: `${stops[source].name} to ${stops[destination].name} via Ameerpet`,
          leg1: {
            route: sourceToAmeerpet.route,
            stopsCount: sourceToAmeerpet.stopsCount,
            time: time1,
            fare: isFree1 ? 0 : fare1,
            isFree: isFree1,
            activeBuses: activeBuses1
          },
          leg2: {
            route: ameerpetToDest.route,
            stopsCount: ameerpetToDest.stopsCount,
            time: time2,
            fare: isFree2 ? 0 : fare2,
            isFree: isFree2,
            activeBuses: activeBuses2
          },
          time: time1 + time2 + 8, // +8 mins buffer transfer
          fare: (isFree1 ? 0 : fare1) + (isFree2 ? 0 : fare2),
          color: "#38bdf8"
        });
      }
    }

    setSearchResults(directRoutes);
    setSearched(true);
  };

  const swapStops = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-full overflow-hidden select-none">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-4">
        <Navigation className="h-5 w-5 text-rose-500 animate-pulse" />
        <h2 className="font-extrabold text-base text-slate-100 uppercase tracking-wider">
          Journey Planner
        </h2>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="relative space-y-3">
          {/* Source Select */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Origin Stop</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-rose-500 font-semibold"
            >
              {stopOptions.map((stop) => (
                <option key={stop.code} value={stop.code}>
                  {stop.name} {stop.is_metro ? '🚇' : '🚌'}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="absolute right-4 top-1/2 -translate-y-1 z-10">
            <button
              type="button"
              onClick={swapStops}
              className="bg-slate-800 hover:bg-slate-700 p-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white transition-all shadow-md shadow-slate-950"
            >
              <ArrowRightLeft className="h-4 w-4 rotate-90" />
            </button>
          </div>

          {/* Destination Select */}
          <div className="flex flex-col gap-1 pt-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Destination Stop</label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-rose-500 font-semibold"
            >
              {stopOptions.map((stop) => (
                <option key={stop.code} value={stop.code}>
                  {stop.name} {stop.is_metro ? '🚇' : '🚌'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mahalakshmi Checkbox Toggle */}
        <div className="bg-rose-950/10 border border-rose-900/30 rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-rose-300 flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-rose-400 text-rose-400" /> Mahalakshmi Zero-Fare
            </span>
            <span className="text-[9px] text-slate-400 font-medium">Free travel for women & transgender residents</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={mahalakshmiEligible} 
              onChange={() => setMahalakshmiEligible(!mahalakshmiEligible)} 
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600 peer-checked:after:bg-white"></div>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-rose-950/30 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
        >
          <Search className="h-4 w-4" /> Optimise Routes
        </button>
      </form>

      {/* Search Results list */}
      <div className="flex-1 overflow-y-auto mt-6 space-y-3 pr-1">
        {searched && searchResults.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Compass className="h-10 w-10 mx-auto opacity-30 mb-2 animate-spin" />
            <p className="text-xs font-bold uppercase tracking-wider">No Direct or Transfer Routes</p>
            <p className="text-[10px] text-slate-600 mt-1">Please try modifying your stops.</p>
          </div>
        )}

        {searchResults.map((route, idx) => {
          if (route.isMultiModal) {
            return (
              <div key={idx} className="border border-sky-950 bg-sky-950/10 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
                      Multi-Modal Transfer
                    </span>
                    <h4 className="font-bold text-xs text-slate-200 mt-2">{route.name}</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-100">{route.time} Mins</p>
                    <p className="text-[10px] font-extrabold text-emerald-400">₹{route.fare}</p>
                  </div>
                </div>

                <div className="space-y-2 border-l border-sky-800/40 pl-3 ml-1.5 text-xs text-slate-300">
                  {/* Leg 1 */}
                  <div>
                    <p className="font-bold text-[10px] text-slate-400">LEG 1: {route.leg1.route.code} ({route.leg1.route.type})</p>
                    <p className="text-[11px] mt-0.5">Take bus to Ameerpet Interchange ({route.leg1.time} mins)</p>
                    {route.leg1.isFree && <p className="text-[9px] font-extrabold text-rose-400">✨ Free via Mahalakshmi</p>}
                  </div>
                  {/* Leg 2 */}
                  <div>
                    <p className="font-bold text-[10px] text-slate-400">LEG 2: {route.leg2.route.code} ({route.leg2.route.type})</p>
                    <p className="text-[11px] mt-0.5">Transfer to Metro towards Destination ({route.leg2.time} mins)</p>
                  </div>
                </div>
              </div>
            );
          }

          // Single Direct Route Card
          const activeBus = route.activeBuses[0]; // pick first active bus
          return (
            <div 
              key={idx} 
              className="group border border-slate-800 bg-slate-950/40 hover:bg-slate-950/80 rounded-xl p-4 transition-all duration-200 hover:border-slate-700 cursor-pointer"
              onClick={() => activeBus && onBusSelect && onBusSelect(activeBus)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="text-[10px] font-black px-2 py-0.5 rounded-md text-white"
                      style={{ backgroundColor: route.color }}
                    >
                      {route.code}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{route.type}</span>
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-200 mt-2">{route.name}</h4>
                  <p className="text-[10px] font-semibold text-slate-500 mt-1">{route.stopsCount} Stop stops | {route.stopsList.length} total junctions</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-100">{route.time} Mins</p>
                  {route.isFree ? (
                    <div>
                      <p className="text-xs font-black text-rose-400">₹0</p>
                      <p className="text-[7px] font-black uppercase text-rose-500 tracking-wider">Mahalakshmi Free</p>
                    </div>
                  ) : (
                    <p className="text-xs font-black text-emerald-400">₹{route.fare}</p>
                  )}
                </div>
              </div>

              {/* Active Bus details embedded inside journey card */}
              {activeBus ? (
                <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Users className="h-3 w-3" />
                      <span>Live Occupancy:</span>
                    </div>
                    <span 
                      className={`font-black uppercase text-[8px] px-1.5 py-0.5 rounded ${
                        activeBus.seat_occupancy === 'Green' ? 'bg-emerald-500/20 text-emerald-400' :
                        activeBus.seat_occupancy === 'Yellow' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-rose-500/20 text-rose-400 animate-pulse'
                      }`}
                    >
                      {activeBus.seat_occupancy} Seats
                    </span>
                  </div>

                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-850 flex items-center justify-between text-[10px] text-slate-300">
                    <div>
                      <p className="font-bold text-slate-400">👨‍✈️ {activeBus.driver.name}</p>
                      <p className="text-[8px] text-slate-500">Active Bus: {activeBus.id}</p>
                    </div>
                    <a 
                      href={`tel:${activeBus.driver.phone}`} 
                      className="bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white font-bold p-1.5 rounded-md border border-rose-500/20 hover:border-transparent transition-all flex items-center gap-0.5"
                      onClick={(e) => e.stopPropagation()} // stop selecting bus on call
                    >
                      <Phone className="h-2.5 w-2.5" /> Call
                    </a>
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-[10px] text-slate-600 italic">
                  No active vehicles on route at this moment.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
