import { fetchHydraEvents } from './hydra.js';

let shiftActive = false;
let currentMode = null;
let tripStart = null;
let tripMeta = [];
let locationPing = [];
let currentZone = null;
let grokTimeout;

document.addEventListener("DOMContentLoaded", () => {
  bindShiftToggle();
  bindRideModeButtons();
  bindEndRideFlow();
  bindTripMetaButton();
  initGrokIntel();
  initMapSync();
  logVersion();
  setInterval(pingLocation, 30000);
});

function logVersion() {
  console.log("UDOS Cockpit v2.7.4 — Map Patch + CDN Icons");
}

function bindShiftToggle() {
  const toggleBtn = document.getElementById("toggle-shift");
  const status = document.getElementById("shift-status");
  const rideButtons = document.getElementById("ride-buttons");
  const endShiftBtn = document.getElementById("end-shift");

  toggleBtn.addEventListener("click", () => {
    shiftActive = true;
    tripMeta = [];
    localStorage.removeItem("tripMeta");
    status.textContent = "Status: Active";
    toggleBtn.style.display = "none";
    rideButtons.style.display = "flex";
    endShiftBtn.style.display = "inline-block";
    updateProfitRate();
  });

  endShiftBtn.addEventListener("click", () => {
    shiftActive = false;
    status.textContent = "Status: Inactive";
    rideButtons.style.display = "none";
    endShiftBtn.style.display = "none";
    toggleBtn.style.display = "inline-block";
    updateProfitRate();
  });
}

function bindRideModeButtons() {
  const modeButtons = document.querySelectorAll(".ride-mode");
  const endSection = document.getElementById("end-ride-section");
  const rideButtons = document.getElementById("ride-buttons");

  modeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      currentMode = btn.dataset.mode;
      tripStart = Date.now();
      locationPing = [];
      rideButtons.style.display = "none";
      endSection.style.display = "flex";
    });
  });
}

function bindEndRideFlow() {
  const endBtn = document.getElementById("end-ride");
  const fareInput = document.getElementById("net-profit");
  const submitBtn = document.getElementById("submit-profit");

  endBtn.addEventListener("click", () => {
    fareInput.style.display = "inline-block";
    submitBtn.style.display = "inline-block";
  });

  submitBtn.addEventListener("click", () => {
    const fare = parseFloat(fareInput.value || "0");
    if (isNaN(fare)) return;
    if (!currentMode || !tripStart || locationPing.length === 0) return;

    logTrip(currentMode, fare);
    resetRideFlow();
  });
}

function resetRideFlow() {
  currentMode = null;
  tripStart = null;
  locationPing = [];
  document.getElementById("end-ride-section").style.display = "none";
  document.getElementById("net-profit").value = "";
  document.getElementById("net-profit").style.display = "none";
  document.getElementById("submit-profit").style.display = "none";
  document.getElementById("ride-buttons").style.display = "flex";
}
function pingLocation() {
  if (!shiftActive) return;
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    locationPing.push({ time: Date.now(), lat: latitude, lng: longitude });
  }, err => {
    console.warn("GPS error:", err.message);
  }, { timeout: 10000 });
}

function logTrip(mode, fare) {
  const start = locationPing[0];
  const end = locationPing[locationPing.length - 1] || start;
  if (!start || !end) return;

  const durationMin = Math.max(1, Math.round((Date.now() - tripStart) / 60000));
  const distanceMi = haversineMiles(start.lat, start.lng, end.lat, end.lng);

  tripMeta.push({
    mode,
    startTime: new Date(tripStart).toISOString(),
    endTime: new Date().toISOString(),
    startLocation: [start.lat, start.lng],
    endLocation: [end.lat, end.lng],
    distanceMi: parseFloat(distanceMi.toFixed(2)),
    durationMin,
    netProfit: parseFloat(fare.toFixed(2)),
    zone: currentZone || "Unknown"
  });

  localStorage.setItem("tripMeta", JSON.stringify(tripMeta));
  updateProfitRate();
}

function updateProfitRate() {
  const rateDisplay = document.getElementById("profit-rate");
  if (!shiftActive || tripMeta.length === 0) {
    rateDisplay.textContent = "Hourly Rate: —";
    return;
  }

  const totalProfit = tripMeta.reduce((sum, ride) => sum + ride.netProfit, 0);
  const totalMinutes = tripMeta.reduce((sum, ride) => sum + ride.durationMin, 0);
  const hourlyRate = totalMinutes > 0 ? (totalProfit / totalMinutes) * 60 : 0;

  rateDisplay.textContent = `Hourly Rate: $${hourlyRate.toFixed(2)}/hr`;
}

function bindTripMetaButton() {
  const btn = document.getElementById("view-trip-meta");
  const panel = document.getElementById("trip-meta-panel");
  let isVisible = false;

  btn.addEventListener("click", () => {
    isVisible = !isVisible;
    panel.innerHTML = isVisible ? `<pre>${JSON.stringify(tripMeta, null, 2)}</pre>` : "";
    btn.textContent = isVisible ? "Hide Trip Meta" : "📄 View Trip Meta";
  });
}

function classifyDistance(mi) {
  if (mi <= 3) return "short";
  if (mi <= 5) return "medium";
  return "long";
}

function getSelectedModes() {
  return Array.from(document.querySelectorAll(".mode-toggle"))
    .filter(cb => cb.checked)
    .map(cb => cb.value);
}

function safeGrokRefresh() {
  clearTimeout(grokTimeout);
  grokTimeout = setTimeout(() => {
    initGrokIntel();
  }, 200);
}

document.querySelectorAll(".mode-toggle").forEach(cb => {
  cb.addEventListener("change", safeGrokRefresh);
});

function getRecentZoneWins(zoneName) {
  const recent = tripMeta.slice(-10);
  return recent.filter(trip => trip.zone === zoneName && trip.netProfit >= 15).length;
}

function getTopModes() {
  const modeCounts = {};
  tripMeta.forEach(trip => {
    modeCounts[trip.mode] = (modeCounts[trip.mode] || 0) + 1;
  });
  return Object.entries(modeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([mode]) => mode);
}
async function initGrokIntel() {
  const grid = document.getElementById("phases-grid");
  while (grid.firstChild) grid.removeChild(grid.firstChild);

  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  const isWeekend = [5, 6].includes(day);
  const isLateNight = hour >= 22 || hour <= 3;

  const buzzZones = [
    { zone: "Brickell Core", income: "high", nightlife: true, city: "Miami" },
    { zone: "South Beach / Ocean Drive", income: "high", nightlife: true, tideRisk: true, city: "Miami" },
    { zone: "Wynwood Arts District", income: "medium", nightlife: true, city: "Miami" },
    { zone: "Downtown Miami", income: "medium", event: true, city: "Miami" },
    { zone: "Midtown Miami", income: "high", nightlife: true, city: "Miami" },
    { zone: "Las Olas / Fort Lauderdale", income: "medium", nightlife: true, city: "Fort Lauderdale" },
    { zone: "Downtown WPB", income: "medium", event: true, city: "West Palm Beach" }
  ];

  const zonePoints = {
    "Brickell Core": [25.7617, -80.1918],
    "South Beach / Ocean Drive": [25.7743, -80.1331],
    "Wynwood Arts District": [25.8007, -80.1998],
    "Downtown Miami": [25.7836, -80.1900],
    "Midtown Miami": [25.7989, -80.1937],
    "Las Olas / Fort Lauderdale": [26.1224, -80.1373],
    "Downtown WPB": [26.7136, -80.0543]
  };

  const fareThresholds = {
    Comfort: { short: 8, medium: 11, long: 15 },
    XL:      { short: 12, medium: 15, long: 22 },
    Premier: { short: 13, medium: 18, long: 25 }
  };

  const bands = [
    { label: "1–3mi", key: "short" },
    { label: "3–5mi", key: "medium" },
    { label: "5–10+", key: "long" }
  ];

  const hydraEvents = await fetchHydraEvents();
  const matchedTags = hydraEvents.flatMap(e => e.tags);
  const eventMatches = [...new Set(matchedTags)];

  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude: userLat, longitude: userLng } = pos.coords;
    const selectedModes = getSelectedModes();
    const topModes = getTopModes();

    const recommendations = buzzZones.map(zone => {
      let score = 0;
      if (zone.income === "high") score += 15;
      if (zone.nightlife && isLateNight) score += 10;
      if (zone.event && eventMatches.length > 0) {
        const isBooze = eventMatches.some(tag => /party|club|concert|after/i.test(tag));
        score += isBooze ? 15 : 5;
      }
      if (isWeekend) score += 10;
      if (tripMeta.length > 0) score += 5;

      if (topModes.includes("Premier") && zone.income === "high") score += 10;
      if (getRecentZoneWins(zone.zone) >= 3) score += 5;

      const coords = zonePoints[zone.zone];
      const distance = haversineMiles(userLat, userLng, coords[0], coords[1]);
      const roundTripMinutes = Math.round((distance / 25) * 60 * 2);

      const projectedNet = 60;
      const passesThreshold = projectedNet >= 50 && roundTripMinutes <= 15;

      const confidence = score >= 35 ? "High" : score >= 20 ? "Medium" : "Low";
      const surge = score >= 50 ? "Massive" : score >= 40 ? "Volatile" : score >= 30 ? "Moderate" : "Low";

      const modeMatrix = selectedModes.map(mode => {
        const base = fareThresholds[mode];
        const adjusted = {
          short: base.short + (surge !== "Low" ? 2 : 0),
          medium: base.medium + (surge !== "Low" ? 2 : 0),
          long: base.long + (mode === "Premier" && hour >= 22 ? 5 : 0)
        };
        return `${mode}: ` + bands.map(b => `${b.label} ≥ $${adjusted[b.key]}`).join(" | ");
      });

      return {
        zone: zone.zone,
        confidence,
        surge,
        coords,
        weight: surge === "Massive" ? 1.0 : surge === "Volatile" ? 0.8 : surge === "Moderate" ? 0.6 : 0.2,
        description: modeMatrix.join("<br>"),
        passesThreshold
      };
    });

    const heat = window.heatLayer;
    if (heat) heat.setLatLngs([]);

    const topZones = recommendations
      .filter(z => z.passesThreshold)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3);

    topZones.forEach(rec => {
      const card = document.createElement("div");
      card.className = "grok-card";
      card.setAttribute("data-surge", rec.surge);
      currentZone = rec.zone;
      card.innerHTML = `
        <div class="grok-zone">${rec.zone}</div>
        <div class="grok-confidence">${rec.confidence} Confidence | ${rec.surge} Surge</div>
        <div class="grok-desc">${rec.description}</div>
      `;
      grid.appendChild(card);

      if (rec.coords && heat) {
        heat.addLatLng([...rec.coords, rec.weight]);
      }
    });
  });
}
function initMapSync() {
  console.log("Map logic disabled — running cockpit in text-only mode.");
}  const mapEl = document.getElementById("map");

  // Prevent double init during live reload
  if (mapEl._leaflet_id || window.mapRef) {
    window.mapRef?.remove();
    mapEl.innerHTML = "";
  }

  const map = L.map("map", {
    center: [25.7617, -80.1918],
    zoom: 12,
    maxZoom: 18,
    minZoom: 10,
    zoomControl: true,
    crs: L.CRS.EPSG3857
  });

  window.mapRef = map;

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19,
    subdomains: "abc"
  }).addTo(map);

  window.heatLayer = L.heatLayer([], {
    radius: 25,
    blur: 15,
    maxZoom: 17
  }).addTo(map);

  const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    L.marker([latitude, longitude], { icon: defaultIcon })
      .addTo(map)
      .bindPopup("You are here")
      .openPopup();
  }, err => {
    console.warn("Map GPS error:", err.message);
    L.marker([25.7617, -80.1918], { icon: defaultIcon })
      .addTo(map)
      .bindPopup("Default: Brickell Core")
      .openPopup();
  });

  setTimeout(() => {
    map.invalidateSize();
  }, 500);

  window.addEventListener("resize", () => {
    map.invalidateSize();
  });

function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}