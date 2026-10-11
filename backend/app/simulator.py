import math
import random
import threading
import time
from typing import Dict, List, Any
from .data import ROUTES, STOPS, MOCK_DRIVERS, MOCK_CONDUCTORS, DEPOTS, SHIFTS, STATUSES


def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate compass bearing (0-360°) from point A to point B."""
    lat1, lat2 = math.radians(lat1), math.radians(lat2)
    diff_lon = math.radians(lon2 - lon1)
    x = math.sin(diff_lon) * math.cos(lat2)
    y = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(diff_lon)
    bearing = math.degrees(math.atan2(x, y))
    return (bearing + 360) % 360

class TransitSimulator:
    def __init__(self):
        self.lock = threading.Lock()
        self.buses: List[Dict[str, Any]] = []
        self.stop_queues: Dict[str, int] = {}
        self.alerts: List[Dict[str, Any]] = []
        self.alert_counter = 0
        self.bus_counter = 1000
        
        # Initialize stop queues with realistic passenger numbers
        for stop_id in STOPS:
            self.stop_queues[stop_id] = random.randint(10, 45)
            
        # Initialize initial fleet
        self.init_fleet()
        
    def init_fleet(self):
        # We start with 6 default running buses mapping to our routes
        route_keys = ["218", "10H", "127K", "49M", "PUSHPAK"]
        
        for i, rcode in enumerate(route_keys):
            self.create_bus(rcode, is_special=False)
            
    def create_bus(self, route_code: str, is_special: bool = False, depot: str = None) -> Dict[str, Any]:
        with self.lock:
            self.bus_counter += 1
            bus_id = f"TS09Z {self.bus_counter}"
            rdata = ROUTES[route_code]
            
            # Select random driver and conductor
            driver = random.choice(MOCK_DRIVERS)
            conductor = random.choice(MOCK_CONDUCTORS)
            
            # Choose depot
            bus_depot = depot if depot else random.choice(DEPOTS)
            shift = random.choice(SHIFTS)
            
            # Initialize positions at random points along the route
            path_len = len(rdata["path"])
            start_index = 0 if is_special else random.randint(0, path_len - 1)
            
            bus = {
                "id": bus_id,
                "route_code": route_code,
                "route_name": rdata["name"],
                "type": rdata["type"],
                "color": rdata["color"],
                "path": rdata["path"],
                "stops": rdata["stops"],
                "current_index": start_index,
                "coords": rdata["path"][start_index],
                "prev_coords": rdata["path"][start_index],
                "bearing": 0.0,
                "trail": [],  # last 5 GPS positions
                "direction": 1,  # 1 for forward, -1 for reverse
                "speed": random.randint(1, 2),
                "driver": driver,
                "conductor": conductor,
                "depot": bus_depot,
                "shift": shift,
                "status": "In Transit" if not is_special else "On Duty",
                "seat_occupancy": random.choice(["Green", "Yellow", "Red"]),
                "is_on_demand_express": False,
                "capacity": 60 if "Metro" in rdata["type"] or "Ordinary" in rdata["type"] else 40,
                "current_passengers": random.randint(5, 35),
                "is_special": is_special
            }
            self.buses.append(bus)
            
            if is_special:
                self.add_alert(
                    "INFO",
                    f"Peak-Hour Special bus {bus_id} dispatched on Route {route_code} from {bus_depot} depot."
                )
            return bus

    def add_alert(self, level: str, message: str, bus_id: str = None):
        self.alert_counter += 1
        alert = {
            "id": self.alert_counter,
            "timestamp": time.strftime("%H:%M:%S"),
            "level": level, # "INFO", "WARNING", "SOS", "SCHEDULING"
            "message": message,
            "bus_id": bus_id,
            "dismissed": False
        }
        # Keep only the last 30 alerts
        self.alerts.insert(0, alert)
        self.alerts = self.alerts[:30]

    def toggle_on_demand(self, bus_id: str) -> bool:
        with self.lock:
            for bus in self.buses:
                if bus["id"] == bus_id:
                    bus["is_on_demand_express"] = not bus["is_on_demand_express"]
                    status_text = "ENABLED" if bus["is_on_demand_express"] else "DISABLED"
                    self.add_alert(
                        "SCHEDULING",
                        f"Bus {bus_id} has {status_text} On-Demand Express mode (skipping empty stops).",
                        bus_id=bus_id
                    )
                    return True
        return False

    def trigger_sos(self, bus_id: str) -> bool:
        with self.lock:
            for bus in self.buses:
                if bus["id"] == bus_id:
                    bus["status"] = "SOS Alert"
                    self.add_alert(
                        "SOS",
                        f"EMERGENCY: SOS Triggered for Bus {bus_id} (Route {bus['route_code']}). Contact Driver: {bus['driver']['name']} ({bus['driver']['phone']}).",
                        bus_id=bus_id
                    )
                    return True
        return False

    def resolve_sos(self, bus_id: str) -> bool:
        with self.lock:
            for bus in self.buses:
                if bus["id"] == bus_id:
                    bus["status"] = "On Duty"
                    self.add_alert(
                        "INFO",
                        f"Emergency situation resolved for Bus {bus_id}. Returning to normal operations.",
                        bus_id=bus_id
                    )
                    return True
        return False

    def get_state(self) -> Dict[str, Any]:
        with self.lock:
            return {
                "buses": [
                    {
                        "id": b["id"],
                        "route_code": b["route_code"],
                        "route_name": b["route_name"],
                        "type": b["type"],
                        "color": b["color"],
                        "coords": b["coords"],
                        "prev_coords": b.get("prev_coords", b["coords"]),
                        "bearing": b.get("bearing", 0.0),
                        "trail": b.get("trail", []),
                        "current_index": b["current_index"],
                        "driver": b["driver"],
                        "conductor": b["conductor"],
                        "depot": b["depot"],
                        "shift": b["shift"],
                        "status": b["status"],
                        "seat_occupancy": b["seat_occupancy"],
                        "is_on_demand_express": b["is_on_demand_express"],
                        "capacity": b["capacity"],
                        "current_passengers": b["current_passengers"],
                        "is_special": b["is_special"]
                    }
                    for b in self.buses
                ],
                "stop_queues": self.stop_queues,
                "alerts": [a for a in self.alerts if not a["dismissed"]]
            }

    def update_simulation(self):
        with self.lock:
            # 1. Update stop queues (passenger demand)
            for stop_id in self.stop_queues:
                # Add/remove random commuters
                change = random.choice([-3, -2, -1, 0, 1, 2, 3, 4, 5])
                new_q = max(0, min(120, self.stop_queues[stop_id] + change))
                self.stop_queues[stop_id] = new_q
                
                # Check for high demand queues (Hub alerts)
                if new_q > 85:
                    # Alert if not already alerted recently
                    already_alerted = any(
                        a["level"] == "WARNING" and stop_id in a["message"] and not a["dismissed"]
                        for a in self.alerts[:5]
                    )
                    if not already_alerted:
                        self.add_alert(
                            "WARNING",
                            f"High Commuter Queue! {new_q} commuters waiting at {STOPS[stop_id]['name']}. Dispatch Peak-Hour Specials recommendation."
                        )

            # 2. Advance buses along their route paths
            for bus in self.buses:
                if bus["status"] == "SOS Alert" or bus["status"] == "Rest Period":
                    continue # SOS or resting buses do not move
                    
                path = bus["path"]
                path_len = len(path)
                
                # Advance step
                curr_idx = bus["current_index"]
                speed = bus["speed"]
                direction = bus["direction"]
                
                next_idx = curr_idx + (speed * direction)
                
                # Turnaround conditions
                if next_idx >= path_len:
                    next_idx = path_len - 1
                    bus["direction"] = -1
                    bus["status"] = "Rest Period" # Rest at terminals
                    # Simulate temporary stop resting
                    threading.Thread(target=self._delayed_status_restore, args=(bus["id"], "In Transit", 6)).start()
                elif next_idx < 0:
                    next_idx = 0
                    bus["direction"] = 1
                    bus["status"] = "Rest Period"
                    threading.Thread(target=self._delayed_status_restore, args=(bus["id"], "In Transit", 6)).start()
                
                # Dynamic Routing / Stop Skipping in On-Demand Express Mode
                if bus["is_on_demand_express"]:
                    # We check if we are near a stop along the route
                    # Find if the next index maps closely to a stop coordinate
                    # For simple mock purposes, we find if the next stop has 0 passengers waiting
                    # and inside passengers are not exiting.
                    # In express mode, the bus speeds up (increases speed increment) or jumps past indices
                    # representing intermediate stops if stop queues are low.
                    near_stop_name = self._get_near_stop(bus, next_idx)
                    if near_stop_name:
                        stop_q = self.stop_queues.get(near_stop_name, 0)
                        if stop_q < 5:
                            # Skip stop by jumping speed!
                            next_idx = min(path_len - 1, max(0, next_idx + (direction * 3)))
                            # Trigger scheduling log
                            if random.random() < 0.2:
                                self.add_alert(
                                    "SCHEDULING",
                                    f"Bus {bus['id']} skipped low-demand stop {STOPS[near_stop_name]['name']} (Express Mode).",
                                    bus_id=bus["id"]
                                )
                
                # Update bearing and trail before moving
                old_coords = bus["coords"]
                new_coords = path[next_idx]

                # Only update bearing if we actually moved
                if old_coords != new_coords:
                    bus["bearing"] = calculate_bearing(
                        old_coords[0], old_coords[1],
                        new_coords[0], new_coords[1]
                    )
                    # Maintain trail of last 5 positions
                    trail = bus.get("trail", [])
                    trail.append(list(old_coords))
                    bus["trail"] = trail[-5:]  # keep last 5

                bus["prev_coords"] = old_coords
                bus["current_index"] = next_idx
                bus["coords"] = new_coords
                
                # Randomly fluctuate bus passenger load
                p_change = random.choice([-4, -2, 0, 2, 4])
                bus["current_passengers"] = max(2, min(bus["capacity"], bus["current_passengers"] + p_change))
                
                # Set color occupancy indicator
                ratio = bus["current_passengers"] / bus["capacity"]
                if ratio < 0.4:
                    bus["seat_occupancy"] = "Green"
                elif ratio < 0.85:
                    bus["seat_occupancy"] = "Yellow"
                else:
                    bus["seat_occupancy"] = "Red"
                    
    def _delayed_status_restore(self, bus_id: str, status: str, delay: int):
        time.sleep(delay)
        with self.lock:
            for bus in self.buses:
                if bus["id"] == bus_id and bus["status"] == "Rest Period":
                    bus["status"] = status
                    
    def _get_near_stop(self, bus: Dict[str, Any], index: int) -> str:
        # Returns the stop_id if the bus is close to a stop
        r_stops = bus["stops"]
        path_len = len(bus["path"])
        num_stops = len(r_stops)
        if num_stops < 2:
            return None
            
        # Map path index ranges to stops
        # E.g. divide the path into equal segments matching stops
        segment_size = path_len // (num_stops - 1)
        for i, stop_id in enumerate(r_stops):
            stop_center_idx = i * segment_size
            if abs(index - stop_center_idx) <= 1:
                return stop_id
        return None

    def dismiss_alert(self, alert_id: int):
        with self.lock:
            for alert in self.alerts:
                if alert["id"] == alert_id:
                    alert["dismissed"] = True
                    return True
        return False
