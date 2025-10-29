document.addEventListener('DOMContentLoaded', () => {
  // Initialize Leaflet map
  const map = L.map('map').setView([25.7617, -80.1918], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Tactical zones
  const zones = [
    { name: 'Miami Intl Airport', coords: [25.7959, -80.2870], color: 'red' },
    { name: 'Wynwood', coords: [25.8007, -80.1998], color: 'yellow' },
    { name: 'Brickell', coords: [25.7610, -80.1910], color: 'purple' }
  ];

  function isMassiveEventActive() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    return month === 10 && day >= 28 && day <= 31;
  }

  zones.forEach(zone => {
    let glowColor = zone.color;
    if (zone.name.includes('Brickell') && isMassiveEventActive()) {
      glowColor = 'purple';
    }
    L.circle(zone.coords, {
      color: glowColor,
      fillColor: glowColor,
      fillOpacity: 0.5,
      radius: 500
    }).addTo(map).bindPopup(zone.name);
  });

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      L.marker([lat, lng]).addTo(map).bindPopup('You are here').openPopup();
      map.setView([lat, lng], 13);
    });
  }

  let rideHistory = [];
  let shiftStartTime = null;
  let pciTotal = 0;
  let rideCount = 0;

  function updatePCI(fare, surge, mode) {
    const now = Date.now();
    if (!shiftStartTime) shiftStartTime = now;
    const hours = (now - shiftStartTime) / (1000 * 60 * 60);
    const payout = fare * surge;
    pciTotal += payout;
    rideCount++;
    const pci = (pciTotal / hours).toFixed(2);
    document.getElementById('pci-score').textContent = `$${pci}/hr`;

    if (pci < 15) {
      document.getElementById('pci-score').classList.add('alert');
      document.getElementById('grok-status').textContent = `PCI below threshold. Bail recommended (Confidence: 82%)`;
      document.getElementById('grok-status').classList.add('alert');
    }

    if (mode === 'Comfort') {
      const comfortRides = rideHistory.filter(r => r.mode === 'Comfort');
      const comfortTotal = comfortRides.reduce((sum, r) => sum + r.payout, 0);
      const comfortAvg = (comfortTotal / comfortRides.length).toFixed(2);
      document.getElementById('comfort-score').textContent = `Comfort: $${comfortAvg}`;
    }
  }

  function checkGrokBail() {
    const now = Date.now();
    const hours = (now - shiftStartTime) / (1000 * 60 * 60);
    const last3 = rideHistory.slice(-3);
    const weakRides = last3.filter(r => r.payout < 10).length;

    if (hours > 7 && weakRides >= 2) {
      document.getElementById('grok-status').textContent = `Surge trending down. Bail recommended (Confidence: 82%)`;
      document.getElementById('grok-status').classList.add('alert');
    }
  }

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      document.getElementById('ride-active').classList.remove('hidden');
      document.getElementById('ride-log-output').textContent = `Mode selected: ${mode}`;
      rideHistory.push({ mode, payout: 0, timestamp: Date.now() });
    });
  });

  document.getElementById('end-ride-btn').addEventListener('click', () => {
    document.getElementById('ride-active').classList.add('hidden');
    document.getElementById('fare-entry').classList.remove('hidden');
  });

  document.getElementById('submit-fare').addEventListener('click', () => {
    const fare = parseFloat(document.getElementById('fare-input').value);
    const surge = parseFloat(document.getElementById('surge-input').value);
    const lastRide = rideHistory[rideHistory.length - 1];
    lastRide.fare = fare;
    lastRide.surge = surge;
    lastRide.payout = fare * surge;

    updatePCI(fare, surge, lastRide.mode);
    checkGrokBail();

    document.getElementById('fare-entry').classList.add('hidden');
    document.getElementById('ride-log-output').textContent += `\nFare submitted: $${fare} x${surge}`;
  });

  document.getElementById('start-shift-btn').addEventListener('click', () => {
    shiftStartTime = Date.now();
    document.getElementById('shift-status-display').textContent = 'Shift is currently: Online';
  });
});