// dashboard.js — UDOS Tactical Cockpit v2.4.1
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
  console.log("UDOS Cockpit v2.4.1 — Grok Intel Mobile Grid + CORS Patch");
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
// 🧠 Grok Intel v3.0 — Mobile Grid + CORS Proxy
function initGrokIntel() {
  const grid = document.getElementById("phases-grid");
  grid.innerHTML = "";

  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  const isWeekend = [5, 6].includes(day);
  const isLateNight = hour >= 22 || hour <= 3;

  const buzzZones = [
    { zone: "South Beach — Ocean Drive", income: "high", nightlife: true, city: "Miami" },
    { zone: "Brickell → MIA", income: "high", airport: true, city: "Miami" },
    { zone: "Wynwood → Kaseya Center", income: "medium", nightlife: true, city: "Miami" },
    { zone: "Downtown → Arsht Center", income: "medium", event: true, city: "Miami" },
    { zone: "Midtown → E11EVEN", income: "high", nightlife: true, city: "Miami" },
    { zone: "Las Olas → FLL", income: "medium", nightlife: true, city: "Fort Lauderdale" },
    { zone: "Downtown WPB → Kravis Center", income: "medium", event: true, city: "West Palm Beach" }
  ];

  const keywords = ["miami nightlife", "concert", "party", "after hours", "festival", "conference"];
  const eventMatches = [];

  const baseURL = "https://www.miamiandbeaches.com/events";
  const proxyURL = "https://corsproxy.io/?" + encodeURIComponent(baseURL);

  fetch(proxyURL)
    .then(res => res.text())
    .then(html => {
      keywords.forEach(keyword => {
        if (html.toLowerCase().includes(keyword)) {
          eventMatches.push(keyword);
        }
      });

      const recommendations = buzzZones.map(zone => {
        let score = 0;

        if (zone.income === "high") score += 15;
        if (zone.nightlife && isLateNight) score += 10;
        if (zone.airport && [16, 17, 18, 19].includes(hour)) score += 15;
        if (zone.event && eventMatches.length > 0) score += 25;
        if (isWeekend) score += 10;
        if (tripMeta.length > 0) score += 5;

        const isMiami = zone.city === "Miami";
        const meetsProfitThreshold = isMiami || score >= 50;

        const confidence = score >= 40 ? "High" : score >= 20 ? "Medium" : "Low";
        const surge = score >= 50 ? "Massive" : score >= 30 ? "Moderate" : "Low";

        return {
          zone: zone.zone,
          confidence,
          score,
          surge,
          show: meetsProfitThreshold,
          description: `Target rides in ${zone.zone}. Score: ${score}. ${surge} opportunity.`
        };
      });

      recommendations
        .filter(rec => rec.show)
        .forEach(rec => {
          const card = document.createElement("div");
          card.className = "grok-card";
          card.innerHTML = `
            <div class="grok-zone">${rec.zone}</div>
            <div class="grok-confidence">${rec.confidence} Confidence</div>
            <div class="grok-surge">${rec.surge} Surge</div>
            <div class="grok-desc">${rec.description}</div>
          `;
          grid.appendChild(card);
        });
    })
    .catch(err => {
      console.warn("Event fetch failed:", err.message);
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
  const R = 3958.8; // Radius of Earth in miles
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}