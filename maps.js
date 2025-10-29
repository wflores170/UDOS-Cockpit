// Ensure Leaflet is loaded
if (typeof L === "undefined") {
  console.error("Leaflet library not loaded. Check <script src='leaflet.js'> in index.html.");
}

// Initialize Leaflet map
const map = L.map('map').setView([25.7617, -80.1918], 12); // Miami

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

// Track current GPS location
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(pos => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    L.circle([lat, lon], {
      radius: 50,
      color: '#0ff',
      fillColor: '#0ff',
      fillOpacity: 0.6
    }).addTo(map);
  });
}

// Render Grok surge zones with neon overlays
function updateMapOverlays() {
  const zones = typeof getLiveGrokZones === "function" ? getLiveGrokZones() : [];
  if (!Array.isArray(zones)) return;

  zones.forEach(zone => {
    const colorMap = {
      low: "#00000000",
      moderate: "yellow",
      high: "red",
      massive: "purple"
    };
    const color = colorMap[zone.surge_level] || "gray";

    // Neon surge circle
    L.circle([zone.lat, zone.lon], {
      radius: 800,
      color: color,
      fillColor: color,
      fillOpacity: 0.4,
      weight: 2
    }).addTo(map);

    // Neon surge box label
    const surgeLabel = L.divIcon({
      className: 'surge-box',
      html: `<div style="
        background: rgba(255, 0, 255, 0.8);
        color: cyan;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: bold;
        font-family: 'Courier New', monospace;
        box-shadow: 0 0 10px magenta;
      ">${zone.surge.toFixed(1)}x</div>`
    });

    L.marker([zone.lat, zone.lon], {
      icon: surgeLabel,
      interactive: false
    }).addTo(map);
  });
}