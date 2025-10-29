// dashboard.js — UDOS Cockpit v2.3.5
let shiftActive = false;
let currentMode = null;
let tripStart = null;
let tripMeta = [];
let locationPing = [];

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
  console.log("UDOS Cockpit v2.3.5 — Real-Time Hourly Profit Rate");
}

// 🔄 Shift Toggle
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

// 🚗 Ride Mode
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

// 🧾 End Ride
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

// 🔁 Reset Ride Flow
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
// 📍 GPS Ping
function pingLocation() {
  if (!shiftActive) return;
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    locationPing.push({ time: Date.now(), lat: latitude, lng: longitude });
  }, err => {
    console.warn("GPS error:", err.message);
  }, { timeout: 10000 });
}

// 📊 Trip Logger
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
    netProfit: parseFloat(fare.toFixed(2))
  });

  localStorage.setItem("tripMeta", JSON.stringify(tripMeta));
  updateProfitRate();
}

// 📄 Trip Meta Viewer
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
// 🧠 Grok Intel
function initGrokIntel() {
  const intelPanel = document.getElementById("phases");
  intelPanel.innerHTML = "";

  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  const buzzZones = [
    "South Beach — Ocean Drive",
    "Brickell → MIA",
    "Wynwood → Kaseya Center",
    "Downtown → Arsht Center",
    "Midtown → E11EVEN"
  ];

  const recommendations = buzzZones.map(zone => {
    let score = 0;
    if (zone.includes("South Beach") && hour >= 16 && hour <= 22) score += 20;
    if (zone.includes("MIA") && [16,17,18].includes(hour)) score += 15;
    if (zone.includes("E11EVEN") && hour >= 22) score += 15;
    if ([5,6].includes(day)) score += 10;
    if (tripMeta.some(t => t.startLocation)) score += 5;

    return {
      zone,
      confidence: score > 30 ? "High" : score > 15 ? "Medium" : "Low",
      surge: zone.includes("South Beach") ? "Moderate" : "Low",
      score
    };
  });

  recommendations.forEach(rec => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${rec.zone}</strong><br>
      Confidence: ${rec.confidence}<br>
      Source: Buzz-based<br>
      Description: Target rides in ${rec.zone}. Score: ${rec.score}. ${rec.surge} opportunity.`;
    intelPanel.appendChild(li);
  });
}

// 🗺️ Map Sync
function initMapSync() {
  const map = L.map("map").setView([25.7617, -80.1918], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    L.marker([latitude, longitude]).addTo(map).bindPopup("You are here").openPopup();
  });
}

// 💰 Hourly Profit Rate
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

// 📏 Haversine Distance
function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}