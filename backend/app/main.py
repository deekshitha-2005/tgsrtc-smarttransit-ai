import asyncio
import json
import threading
import time
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Set

from .data import STOPS, ROUTES, DEPOTS
from .simulator import TransitSimulator
from .chatbot import process_query

app = FastAPI(title="TGSRTC SmartTransit AI API", version="2.0.0")

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Global simulator instance ────────────────────────────────────────────────
simulator = TransitSimulator()

# ─── Simulation background thread (500ms ticks for real-time feel) ───────────
stop_simulation = False
simulation_thread = None

def run_simulation_loop():
    global stop_simulation
    while not stop_simulation:
        try:
            simulator.update_simulation()
        except Exception as e:
            print(f"[Simulator] Error: {e}")
        time.sleep(0.5)  # 500ms ticks — twice as fast as before

@app.on_event("startup")
def startup_event():
    global stop_simulation, simulation_thread
    stop_simulation = False
    simulation_thread = threading.Thread(target=run_simulation_loop, daemon=True)
    simulation_thread.start()
    print("FastAPI startup: Simulation thread running at 500ms ticks.")

@app.on_event("shutdown")
def shutdown_event():
    global stop_simulation
    stop_simulation = True
    if simulation_thread:
        simulation_thread.join(timeout=1.0)
    print("FastAPI shutdown: Simulation stopped.")

# ─── WebSocket Connection Manager ─────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        async with self._lock:
            self.active_connections.add(ws)
        print(f"[WS] Client connected. Total: {len(self.active_connections)}")

    async def disconnect(self, ws: WebSocket):
        async with self._lock:
            self.active_connections.discard(ws)
        print(f"[WS] Client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, data: str):
        dead: Set[WebSocket] = set()
        async with self._lock:
            connections = set(self.active_connections)
        for ws in connections:
            try:
                await ws.send_text(data)
            except Exception:
                dead.add(ws)
        if dead:
            async with self._lock:
                self.active_connections -= dead

manager = ConnectionManager()

# ─── WebSocket broadcast loop (runs in asyncio event loop) ───────────────────
async def broadcast_loop():
    """Push live state to all connected WebSocket clients every 500ms."""
    while True:
        await asyncio.sleep(0.5)
        if manager.active_connections:
            try:
                state = simulator.get_state()
                state["server_time"] = time.strftime("%H:%M:%S")
                payload = json.dumps(state)
                await manager.broadcast(payload)
            except Exception as e:
                print(f"[WS Broadcast] Error: {e}")

@app.on_event("startup")
async def start_broadcast_loop():
    asyncio.create_task(broadcast_loop())
    print("FastAPI startup: WebSocket broadcast loop started.")

# ─── WebSocket endpoint ───────────────────────────────────────────────────────
@app.websocket("/ws/live")
async def websocket_live(ws: WebSocket):
    await manager.connect(ws)
    try:
        # Send initial full state immediately on connect
        state = simulator.get_state()
        state["server_time"] = time.strftime("%H:%M:%S")
        await ws.send_text(json.dumps(state))

        # Keep connection alive — client sends heartbeat pings
        while True:
            try:
                msg = await asyncio.wait_for(ws.receive_text(), timeout=30.0)
                if msg == "ping":
                    await ws.send_text(json.dumps({"type": "pong"}))
            except asyncio.TimeoutError:
                # Send keepalive
                await ws.send_text(json.dumps({"type": "heartbeat"}))
    except WebSocketDisconnect:
        pass
    finally:
        await manager.disconnect(ws)

# ─── Pydantic models ──────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str

class DispatchRequest(BaseModel):
    route_code: str
    depot: Optional[str] = None

# ─── REST endpoints (kept for fallback) ──────────────────────────────────────
@app.get("/api/static-data")
def get_static_data():
    return {"stops": STOPS, "routes": ROUTES, "depots": DEPOTS}

@app.get("/api/state")
def get_live_state():
    return simulator.get_state()

@app.post("/api/alerts/dismiss/{alert_id}")
def dismiss_alert(alert_id: int):
    success = simulator.dismiss_alert(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "success"}

@app.post("/api/buses/toggle-express/{bus_id}")
def toggle_express(bus_id: str):
    success = simulator.toggle_on_demand(bus_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Bus {bus_id} not found")
    return {"status": "success"}

@app.post("/api/buses/sos/{bus_id}")
def trigger_sos(bus_id: str):
    success = simulator.trigger_sos(bus_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Bus {bus_id} not found")
    return {"status": "success"}

@app.post("/api/buses/resolve-sos/{bus_id}")
def resolve_sos(bus_id: str):
    success = simulator.resolve_sos(bus_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Bus {bus_id} not found")
    return {"status": "success"}

@app.post("/api/buses/dispatch-special")
def dispatch_special(payload: DispatchRequest):
    if payload.route_code not in ROUTES:
        raise HTTPException(status_code=404, detail=f"Route {payload.route_code} not found")
    bus = simulator.create_bus(payload.route_code, is_special=True, depot=payload.depot)
    return {"status": "success", "bus": bus}

@app.post("/api/chat")
def chat_assistant(payload: ChatRequest):
    sim_state = simulator.get_state()
    response = process_query(payload.message, sim_state)
    return response
