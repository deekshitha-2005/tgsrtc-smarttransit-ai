# TGSRTC Hyderabad Seed Data

# Coordinate dictionary for key transit junctions/stops in Hyderabad
STOPS = {
    "MGBS": {"name": "MGBS (Mahatma Gandhi Bus Station)", "coords": [17.3786, 78.4813], "is_metro": True, "is_bus": True},
    "KOTI": {"name": "Koti (Women's College)", "coords": [17.3833, 78.4862], "is_metro": False, "is_bus": True},
    "SECUNDERABAD": {"name": "Secunderabad Junction", "coords": [17.4344, 78.5011], "is_metro": True, "is_bus": True},
    "AMEERPET": {"name": "Ameerpet", "coords": [17.4375, 78.4482], "is_metro": True, "is_bus": True},
    "HITEC_CITY": {"name": "Hitec City (Cyber Towers)", "coords": [17.4504, 78.3808], "is_metro": True, "is_bus": True},
    "KONDAPUR": {"name": "Kondapur Junction", "coords": [17.4618, 78.3672], "is_metro": False, "is_bus": True},
    "MIYAPUR": {"name": "Miyapur Depot & Metro", "coords": [17.4968, 78.3601], "is_metro": True, "is_bus": True},
    "PATANCHERU": {"name": "Patancheru Bus Station", "coords": [17.5255, 78.2687], "is_metro": False, "is_bus": True},
    "GACHIBOWLI": {"name": "Gachibowli Junction", "coords": [17.4242, 78.3493], "is_metro": False, "is_bus": True},
    "MEHDIPATNAM": {"name": "Mehdipatnam Bus Station", "coords": [17.3965, 78.4287], "is_metro": False, "is_bus": True},
    "LB_NAGAR": {"name": "LB Nagar Junction", "coords": [17.3460, 78.5492], "is_metro": True, "is_bus": True},
    "RAIDURG": {"name": "Raidurg Metro Station", "coords": [17.4429, 78.3788], "is_metro": True, "is_bus": True},
    "BEGUMPET": {"name": "Begumpet", "coords": [17.4374, 78.4612], "is_metro": True, "is_bus": True},
    "LAKDIKAPUL": {"name": "Lakdikapul", "coords": [17.4042, 78.4593], "is_metro": True, "is_bus": True},
    "NAMPALLY": {"name": "Nampally (Hyderabad Station)", "coords": [17.3916, 78.4682], "is_metro": True, "is_bus": True},
    "RTC_X_ROADS": {"name": "RTC X Roads", "coords": [17.4074, 78.4900], "is_metro": False, "is_bus": True},
    "RGIA_AIRPORT": {"name": "Rajiv Gandhi Intl Airport (Pushpak)", "coords": [17.2403, 78.4294], "is_metro": False, "is_bus": True},
    "NAGOLE": {"name": "Nagole Metro Station", "coords": [17.3936, 78.5678], "is_metro": True, "is_bus": False},
    "JBS": {"name": "JBS (Jubilee Bus Station)", "coords": [17.4485, 78.4984], "is_metro": True, "is_bus": True},
    "KUKATPALLY": {"name": "Kukatpally", "coords": [17.4725, 78.3980], "is_metro": True, "is_bus": True},
    "MADHAPUR": {"name": "Madhapur", "coords": [17.4410, 78.3965], "is_metro": True, "is_bus": True}
}

# Helper function to generate interpolated route paths (list of coords) between key stops
def interpolate_coords(start, end, steps=10):
    lat1, lon1 = start
    lat2, lon2 = end
    return [
        [lat1 + (lat2 - lat1) * i / steps, lon1 + (lon2 - lon1) * i / steps]
        for i in range(steps + 1)
    ]

# Define static path shapes for each route
ROUTES = {
    "218": {
        "code": "218",
        "name": "Koti to Patancheru",
        "type": "Metro Deluxe",
        "fare_factor": 1.2, # 1.2 rupees per km
        "stops": ["KOTI", "NAMPALLY", "LAKDIKAPUL", "AMEERPET", "KUKATPALLY", "MIYAPUR", "PATANCHERU"],
        "color": "#e11d48", # Rose
        "path": [] # Will populate below
    },
    "10H": {
        "code": "10H",
        "name": "Secunderabad to Kondapur",
        "type": "Metro Express",
        "fare_factor": 1.0,
        "stops": ["SECUNDERABAD", "BEGUMPET", "AMEERPET", "MADHAPUR", "HITEC_CITY", "KONDAPUR"],
        "color": "#2563eb", # Blue
        "path": []
    },
    "127K": {
        "code": "127K",
        "name": "Koti to Kondapur",
        "type": "Ordinary",
        "fare_factor": 0.8,
        "stops": ["KOTI", "LAKDIKAPUL", "MEHDIPATNAM", "GACHIBOWLI", "KONDAPUR"],
        "color": "#16a34a", # Green
        "path": []
    },
    "49M": {
        "code": "49M",
        "name": "Secunderabad to Mehdipatnam",
        "type": "Ordinary",
        "fare_factor": 0.8,
        "stops": ["SECUNDERABAD", "RTC_X_ROADS", "KOTI", "LAKDIKAPUL", "MEHDIPATNAM"],
        "color": "#9333ea", # Purple
        "path": []
    },
    "PUSHPAK": {
        "code": "PUSHPAK",
        "name": "RGIA Airport to Hitec City",
        "type": "Pushpak AC",
        "fare_factor": 3.0,
        "stops": ["RGIA_AIRPORT", "GACHIBOWLI", "HITEC_CITY"],
        "color": "#ea580c", # Orange
        "path": []
    },
    "METRO_RED": {
        "code": "METRO_RED",
        "name": "Metro Red Line (Miyapur to LB Nagar)",
        "type": "Metro Rail",
        "fare_factor": 1.5,
        "stops": ["MIYAPUR", "KUKATPALLY", "AMEERPET", "LAKDIKAPUL", "MGBS", "LB_NAGAR"],
        "color": "#dc2626", # Red
        "path": []
    },
    "METRO_BLUE": {
        "code": "METRO_BLUE",
        "name": "Metro Blue Line (Raidurg to Nagole)",
        "type": "Metro Rail",
        "fare_factor": 1.5,
        "stops": ["RAIDURG", "HITEC_CITY", "MADHAPUR", "AMEERPET", "BEGUMPET", "SECUNDERABAD", "NAGOLE"],
        "color": "#0284c7", # Sky blue
        "path": []
    }
}

# Generate coordinates for routes
for rcode, rdata in ROUTES.items():
    stops_list = rdata["stops"]
    path_coords = []
    for i in range(len(stops_list) - 1):
        start_stop = STOPS[stops_list[i]]["coords"]
        end_stop = STOPS[stops_list[i+1]]["coords"]
        segment = interpolate_coords(start_stop, end_stop, steps=8)
        # Exclude duplicate boundary coordinates
        if path_coords:
            path_coords.extend(segment[1:])
        else:
            path_coords.extend(segment)
    rdata["path"] = path_coords

# Mock staff and fleet data
MOCK_DRIVERS = [
    {"id": "D1", "name": "K. Venkatesh", "phone": "+91 98480 22311"},
    {"id": "D2", "name": "M. Yadaiah", "phone": "+91 99081 44522"},
    {"id": "D3", "name": "Syed Rahim", "phone": "+91 94405 66733"},
    {"id": "D4", "name": "B. Satyanarayana", "phone": "+91 98660 88944"},
    {"id": "D5", "name": "P. Ramesh", "phone": "+91 91771 00255"},
    {"id": "D6", "name": "V. Laxman", "phone": "+91 99890 33466"},
    {"id": "D7", "name": "J. Shekhar", "phone": "+91 96521 55677"},
    {"id": "D8", "name": "G. Mallesh", "phone": "+91 90002 77888"},
]

MOCK_CONDUCTORS = [
    {"id": "C1", "name": "Ch. Sridevi", "phone": "+91 81223 99011"},
    {"id": "C2", "name": "A. Swamy", "phone": "+91 80991 77233"},
    {"id": "C3", "name": "Md. Jahangir", "phone": "+91 87900 66144"},
    {"id": "C4", "name": "T. Kalpana", "phone": "+91 83281 55677"},
    {"id": "C5", "name": "K. Bhaskar", "phone": "+91 85002 44322"},
    {"id": "C6", "name": "B. Anitha", "phone": "+91 81881 22355"},
    {"id": "C7", "name": "M. Srinivas", "phone": "+91 89781 11466"},
    {"id": "C8", "name": "G. Padma", "phone": "+91 80112 55988"},
]

DEPOTS = ["Miyapur", "Dilsukhnagar", "Ranigunj", "Hakeempet"]

SHIFTS = ["Morning (06:00 - 14:00)", "Evening (14:00 - 22:00)", "Night (22:00 - 06:00)"]

STATUSES = ["On Duty", "In Transit", "Rest Period", "SOS Alert"]
