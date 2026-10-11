# TGSRTC SmartTransit AI
### Hyderabad Public Transport Demand & Route Optimizer

A next-generation intelligent public transit management platform for the **Hyderabad Metropolitan Region**. Replaces rigid fixed timetables with AI-driven dynamic bus scheduling, multi-modal route optimization (Metro + Bus), live GPS simulation, driver/conductor roster management, and a bilingual (Telugu + English) conversational AI assistant.

---

## 🚀 Features

- **Live Hyderabad Transit Map** — Real-time bus movement via WebSocket (500ms updates), bearing arrows, breadcrumb trails, CartoDB dark tiles, city boundary overlay
- **Journey Planner** — Multi-modal routing (Bus ↔ Metro), Mahalakshmi Zero-Fare toggle, live seat occupancy
- **Depot Manager Dashboard** — Fleet roster, SOS emergency triggers, On-Demand Express mode, dispatch Peak-Hour Specials
- **Analytics Portal** — Demand curves, diesel savings, CO₂ carbon offset metrics
- **AI Chatbot** — Telugu + English bilingual queries (*"Ameerpet nundi Koti ki bus undha?"*)

---

## 🗂️ Project Structure

```
tgsrtc-smarttransit-ai/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py        # FastAPI + WebSocket endpoints
│   │   ├── data.py        # Hyderabad routes, stops, staff seed data
│   │   ├── simulator.py   # GPS simulation, bearing, trail, queue alerts
│   │   └── chatbot.py     # Telugu/English NLP engine
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AIChatbot.jsx
│   │   │   ├── CommuterMap.jsx   # Leaflet map, animated markers, layers
│   │   │   ├── DemandChart.jsx
│   │   │   ├── JourneyPlanner.jsx
│   │   │   ├── RosterTable.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── pages/
│   │   │   ├── AnalyticsPortal.jsx
│   │   │   ├── CommuterPortal.jsx
│   │   │   └── DepotDashboard.jsx
│   │   ├── App.jsx          # WebSocket connection manager
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## ⚙️ Setup & Running

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
python run.py
```
Backend runs at: **http://localhost:8000**  
API Docs (Swagger): **http://localhost:8000/docs**

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: **http://localhost:5173**

---

## 🛰️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS v4 |
| Maps | Leaflet.js, React-Leaflet, CartoDB Tiles |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Python FastAPI, Uvicorn |
| Real-Time | WebSocket (`/ws/live`) — 500ms push |
| Simulation | Python threading, GPS interpolation, bearing math |
| NLP | Rule-based Telugu/English keyword engine |

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/static-data` | Routes, stops, depots |
| `GET` | `/api/state` | Live bus positions + alerts |
| `WS` | `/ws/live` | Real-time WebSocket stream |
| `POST` | `/api/buses/sos/{id}` | Trigger SOS |
| `POST` | `/api/buses/toggle-express/{id}` | Toggle express mode |
| `POST` | `/api/buses/dispatch-special` | Dispatch peak-hour bus |
| `POST` | `/api/chat` | AI chatbot query |

---

## 📍 Seeded Hyderabad Routes

| Code | Route | Type |
|------|-------|------|
| 218 | Koti ↔ Patancheru | Metro Deluxe |
| 10H | Secunderabad ↔ Kondapur | Metro Express |
| 127K | Koti ↔ Gachibowli ↔ Kondapur | Ordinary |
| 49M | Secunderabad ↔ Mehdipatnam | Ordinary |
| PUSHPAK | RGIA Airport ↔ Hitec City | Pushpak AC |
| METRO_RED | Miyapur ↔ Ameerpet ↔ LB Nagar | Metro Rail |
| METRO_BLUE | Raidurg ↔ Ameerpet ↔ Nagole | Metro Rail |

---

## 📄 License
MIT License — Built for educational and demonstration purposes.
