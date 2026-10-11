import re
from typing import Dict, Any, List
from .data import STOPS, ROUTES

# Mock Hyderabad disruptions data
DISRUPTIONS = [
    {
        "location": "AMEERPET",
        "type": "Waterlogging",
        "description": "Heavy rain waterlogging at Ameerpet metro pillar 1020. Bus Route 218 and 10H experiencing rerouting and delays of 20 mins.",
        "active": True
    },
    {
        "location": "SECUNDERABAD",
        "type": "Traffic Jam",
        "description": "Severe traffic congestion near Secunderabad Station area. Route 49M and 10H delayed by 15 mins.",
        "active": True
    },
    {
        "location": "HITEC_CITY",
        "type": "Metro Crowd Control",
        "description": "High queue demand at Hitec City / Raidurg Metro stations. Commuters are advised to take Pushpak AC or peak specials.",
        "active": True
    }
]

# Simple Telugu Stop mapping dictionary
TELUGU_STOPS = {
    "koti": "KOTI",
    "secunderabad": "SECUNDERABAD",
    "secunderabadku": "SECUNDERABAD",
    "ameerpet": "AMEERPET",
    "ameerpetku": "AMEERPET",
    "hitec city": "HITEC_CITY",
    "hiteccity": "HITEC_CITY",
    "kondapur": "KONDAPUR",
    "miyapur": "MIYAPUR",
    "patancheru": "PATANCHERU",
    "gachibowli": "GACHIBOWLI",
    "mehdipatnam": "MEHDIPATNAM",
    "lb nagar": "LB_NAGAR",
    "lbnagar": "LB_NAGAR",
    "raidurg": "RAIDURG",
    "begumpet": "BEGUMPET",
    "lakdikapul": "LAKDIKAPUL",
    "nampally": "NAMPALLY",
    "rtc x roads": "RTC_X_ROADS",
    "rtcxroads": "RTC_X_ROADS",
    "airport": "RGIA_AIRPORT",
    "rgia": "RGIA_AIRPORT"
}

def extract_stops(text: str) -> (str, str):
    """
    Extract source and destination stops from Telugu or English text.
    Handles English: 'from Koti to Kondapur'
    Handles Telugu: 'Ameerpet nundi Koti ki'
    """
    text_lower = text.lower()
    source = None
    dest = None
    
    # Check English 'from ... to ...' pattern
    eng_match = re.search(r'from\s+([a-zA-Z\s_]+)\s+to\s+([a-zA-Z\s_]+)', text_lower)
    if eng_match:
        s_candidate = eng_match.group(1).strip()
        d_candidate = eng_match.group(2).strip()
        for name, code in TELUGU_STOPS.items():
            if name in s_candidate:
                source = code
            if name in d_candidate:
                dest = code
                
    # Check Telugu '... nundi ... ki' pattern
    # e.g., 'ameerpet nundi koti ki bus undha'
    tel_nundi_match = re.search(r'([a-zA-Z\s_]+)\s+nundi\s+([a-zA-Z\s_]+)\s+(?:ki|ku)', text_lower)
    if tel_nundi_match:
        s_candidate = tel_nundi_match.group(1).strip()
        d_candidate = tel_nundi_match.group(2).strip()
        for name, code in TELUGU_STOPS.items():
            if name in s_candidate:
                source = code
            if name in d_candidate:
                dest = code
                
    # Fallback keyword scan if direct patterns didn't match
    if not source or not dest:
        found_stops = []
        # Find any stops mentioned
        for name, code in TELUGU_STOPS.items():
            if name in text_lower and code not in found_stops:
                found_stops.append(code)
        
        # If we found 2 stops, assign them based on text position
        if len(found_stops) >= 2:
            # Check which stop word came first in text
            pos = [text_lower.find(name) for name, code in TELUGU_STOPS.items() if code in found_stops]
            # Sort by text position
            sorted_stops = [x for _, x in sorted(zip(pos, found_stops))]
            source = sorted_stops[0]
            dest = sorted_stops[1]
        elif len(found_stops) == 1:
            dest = found_stops[0] # assume destination
            
    return source, dest

def process_query(query: str, sim_state: Dict[str, Any]) -> Dict[str, Any]:
    query_lower = query.lower()
    
    # 1. Check for emergency or SOS questions
    if "sos" in query_lower or "emergency" in query_lower or "pramadham" in query_lower:
        return {
            "response": "🚨 **Emergency Assistance / SOS Response:** If you are experiencing a medical or safety emergency on board a TGSRTC bus, please trigger the red SOS button next to the bus details in the passenger portal. Active staff details are visible below. You can also dial the TGSRTC helpline: **040-30102829** or **100**.",
            "type": "emergency",
            "data": None
        }

    # 2. Check for disruption queries (e.g. waterlogging, rain, delays)
    disruption_keywords = ["waterlogging", "rain", "flood", "traffic", "disruption", "delay", "varsham", "neellu", "aagam", "late"]
    if any(k in query_lower for k in disruption_keywords):
        active_disruptions = [d for d in DISRUPTIONS if d["active"]]
        disruption_text = "\n".join([f"⚠️ **{d['type']} at {d['location']}:** {d['description']}" for d in active_disruptions])
        
        # Telugu touch
        tel_touch = "\n\n*Hyderabad lo varshala valla konni darulu marpulu chesaru. Dayachesi live map chudandi.* (Due to Hyderabad rains, some routes have been modified. Please view the live map.)"
        
        return {
            "response": f"🚌 **TGSRTC Live Disruption Bulletin:**\n\n{disruption_text}{tel_touch}",
            "type": "disruptions",
            "data": active_disruptions
        }

    # 3. Check for driver or conductor contact info queries
    contact_keywords = ["driver", "conductor", "phone", "number", "contact", "phno", "call"]
    if any(k in query_lower for k in contact_keywords):
        # Look if a specific bus ID is queried
        bus_match = re.search(r'ts09z\s*(\d+)', query_lower)
        if bus_match:
            bus_num = bus_match.group(1)
            for bus in sim_state["buses"]:
                if bus_num in bus["id"]:
                    return {
                        "response": f"📞 **Driver & Conductor Details for Bus {bus['id']}:**\n\n"
                                    f"👤 **Driver Name:** {bus['driver']['name']}\n"
                                    f"📞 **Driver Phone:** {bus['driver']['phone']}\n"
                                    f"👥 **Conductor Name:** {bus['conductor']['name']}\n"
                                    f"📞 **Conductor Phone:** {bus['conductor']['phone']}\n"
                                    f"⚡ **Current Status:** {bus['status']} | **Seat Availability:** {bus['seat_occupancy']}",
                        "type": "contact_info",
                        "data": {
                            "bus_id": bus["id"],
                            "driver": bus["driver"],
                            "conductor": bus["conductor"]
                        }
                    }
        # If no specific bus ID, give general driver lookup tips
        return {
            "response": "🔍 To get a specific driver's contact, please search for your route using the Journey Planner, select the active bus, or query with the Bus number (e.g., *'driver contact for TS09Z 1001'*).",
            "type": "info",
            "data": None
        }

    # 4. Check for route/journey planning (e.g., from A to B)
    source_code, dest_code = extract_stops(query)
    if source_code and dest_code:
        # Search for routes linking these stops
        matching_routes = []
        for rcode, rdata in ROUTES.items():
            if source_code in rdata["stops"] and dest_code in rdata["stops"]:
                # Check if stops are in order (directionality)
                s_idx = rdata["stops"].index(source_code)
                d_idx = rdata["stops"].index(dest_code)
                if s_idx < d_idx:
                    matching_routes.append(rdata)
                    
        source_name = STOPS[source_code]["name"]
        dest_name = STOPS[dest_code]["name"]
        
        if matching_routes:
            reply = f"✅ **Found {len(matching_routes)} direct route(s) from {source_name} to {dest_name}:**\n\n"
            cards = []
            for route in matching_routes:
                # Find active buses on this route
                active_buses = [b for b in sim_state["buses"] if b["route_code"] == route["code"]]
                bus_text = f"There are **{len(active_buses)} active buses** on this route currently."
                if active_buses:
                    b_ids = ", ".join([b["id"] for b in active_buses])
                    bus_text += f" (IDs: {b_ids})"
                
                reply += f"- 🚌 **Route {route['code']} ({route['type']})**: {route['name']}.\n" \
                         f"  - *Fare*: ~₹{int(len(route['path']) * route['fare_factor']) * 2} (Mahalakshmi eligible for free transit: Ordinary/Express/Deluxe)\n" \
                         f"  - *Active Fleet*: {bus_text}\n\n"
                         
                cards.append({
                    "code": route["code"],
                    "name": route["name"],
                    "type": route["type"],
                    "buses_count": len(active_buses),
                    "color": route["color"]
                })
            
            # Telugu Translation Touch
            reply += f"*Telugu Translation:* {source_name} nundi {dest_name} ki direct bus(ulu) unnayi. Route details paina chudandi."
            
            return {
                "response": reply,
                "type": "route_result",
                "data": {
                    "source": source_code,
                    "destination": dest_code,
                    "routes": cards
                }
            }
        else:
            # Check for multi-modal (Metro + Bus) suggestion
            # Hyderabad Metro has Red/Blue lines. If we search, say, Koti (bus) to Raidurg (metro)
            # we can transfer at Ameerpet (common transfer hub)
            reply = f"🗺️ **Multi-Modal Transit Plan Suggested (No direct bus found):**\n\n" \
                    f"To travel from **{source_name}** to **{dest_name}**:\n" \
                    f"1. Take **Route 127K/218 Bus** to **Ameerpet Interchange Hub**.\n" \
                    f"2. Transfer to **Hyderabad Metro Blue Line** towards Raidurg/Nagole.\n\n" \
                    f"Please check the **Journey Planner** panel for precise timings and fare details."
            return {
                "response": reply,
                "type": "multi_modal",
                "data": None
            }

    # 5. Default fallback
    return {
        "response": "👋 **Namaskaram!** I am the TGSRTC AI Commuter Assistant. How can I help you navigate Hyderabad today?\n\n"
                    "You can ask me bilingual questions like:\n"
                    "- 🗣️ *'Ameerpet nundi Koti ki bus undha?'*\n"
                    "- 🌧️ *'Is there waterlogging or rain delays today?'*\n"
                    "- 📞 *'What is the driver contact number for bus TS09Z 1001?'*\n"
                    "- 🚌 *'Show me routes from Secunderabad to Gachibowli'*",
        "type": "greeting",
        "data": None
    }
