/**
 * COLLEGE BUS LIVE TRACKER ENGINE
 * Location: Kadapa, Andhra Pradesh
 */

// Global State
let map, userPos = null, userMarker = null, routeLine = null;
let buses = [];
const KADAPA_CENTER = [14.4673, 78.8242];

// Initial Bus Data
const BUS_CONFIG = [
    { id: 1, name: "Bus 1", coords: [14.4750, 78.8350] },
    { id: 2, name: "Bus 2", coords: [14.4550, 78.8150] },
    { id: 3, name: "Bus 3", coords: [14.4800, 78.8050] },
    { id: 4, name: "Bus 4", coords: [14.4400, 78.8450] },
    { id: 5, name: "Bus 5", coords: [14.4600, 78.8550] }
];

// 1. MOCK AUTHENTICATION
function handleLogin() {
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;

    if (u === "student" && p === "1234") {
        document.getElementById('login-overlay').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        initMap(); // Only initialize map after login for performance
    } else {
        alert("Access Denied! Use student / 1234");
    }
}

// 2. MAP INITIALIZATION (Leaflet)
function initMap() {
    // Initialize map on Kadapa
    map = L.map('map', { zoomControl: false }).setView(KADAPA_CENTER, 14);

    // COLORFUL LAYER: Using CartoDB Voyager (Beautiful & Free)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add Bus Markers
    BUS_CONFIG.forEach(bus => {
        const icon = L.divIcon({ className: 'bus-marker', html: '🚌', iconSize: [35, 35] });
        const marker = L.marker(bus.coords, { icon: icon }).addTo(map);
        buses.push({ ...bus, marker, currentPos: bus.coords });
    });

    // Interaction: Drop Pin (Set Location)
    map.on('click', (e) => {
        userPos = e.latlng;
        
        if (userMarker) {
            userMarker.setLatLng(userPos);
        } else {
            const userIcon = L.divIcon({ className: 'user-marker', iconSize: [20, 20] });
            userMarker = L.marker(userPos, { icon: userIcon }).addTo(map);
        }
        runAIAgent();
    });

    // 3. LIVE GPS SIMULATION
    setInterval(simulateBusGPS, 2000);
}

function simulateBusGPS() {
    buses.forEach(bus => {
        // Move buses toward city center to simulate a real route convergence
        const newLat = bus.currentPos[0] + (KADAPA_CENTER[0] - bus.currentPos[0]) * 0.03 * Math.random();
        const newLng = bus.currentPos[1] + (KADAPA_CENTER[1] - bus.currentPos[1]) * 0.03 * Math.random();
        
        bus.currentPos = [newLat, newLng];
        bus.marker.setLatLng(bus.currentPos);
    });

    // Trigger AI every time buses move if user has dropped a pin
    if (userPos) runAIAgent();
}

// 4. AI SUGGESTION AGENT
function runAIAgent() {
    if (!userPos) return;

    let nearestBus = null;
    let minDistance = Infinity;

    // AI LOGIC: Calculate Euclidean distance using Leaflet's built-in projection
    // This finds the "As-the-crow-flies" nearest vehicle
    buses.forEach(bus => {
        const busLatLng = L.latLng(bus.currentPos[0], bus.currentPos[1]);
        const dist = map.distance(userPos, busLatLng); // Returns distance in meters

        if (dist < minDistance) {
            minDistance = dist;
            nearestBus = bus;
        }
    });

    updateAICard(nearestBus, minDistance);
    drawRoute(nearestBus);
}

// 5. UI & ROUTE DRAWING
function updateAICard(bus, distance) {
    const card = document.getElementById('ai-agent');
    const text = document.getElementById('ai-text');
    
    card.classList.add('ai-active');
    text.innerHTML = `Agent Suggestion: Catch <b>${bus.name}</b>!<br>
                      It is currently the nearest to your pin (Approx. <b>${Math.round(distance)} meters</b>).`;
}

function drawRoute(nearestBus) {
    // Create a realistic path line from bus to user
    const pathCoords = [
        [nearestBus.currentPos[0], nearestBus.currentPos[1]],
        [userPos.lat, userPos.lng]
    ];

    if (routeLine) {
        routeLine.setLatLngs(pathCoords);
    } else {
        routeLine = L.polyline(pathCoords, {
            color: '#3b82f6',
            weight: 4,
            dashArray: '10, 10',
            opacity: 0.7
        }).addTo(map);
    }
}
