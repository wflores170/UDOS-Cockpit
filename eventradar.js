// === Cockpit v3.1.9 — EventRadar.js ===

document.addEventListener('DOMContentLoaded', () => {
  const map = L.map('map-overlay').setView([25.7617, -80.1918], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  const zoneList = document.getElementById('zone-list');
  const tacticalZones = [
    { name: 'Brickell', lat: 25.7617, lon: -80.1918, surge: 1.2 },
    { name: 'Miami Intl Airport', lat: 25.7959, lon: -80.2870, surge: 1.5 },
    { name: 'Wynwood', lat: 25.8007, lon: -80.1998, surge: 1.3 }
  ];

  tacticalZones.forEach(zone => {
    const marker = L.circle([zone.lat, zone.lon], {
      radius: 300,
      color: getSurgeColor(zone.surge),
      fillColor: getSurgeColor(zone.surge),
      fillOpacity: 0.5
    }).addTo(map);
  });

  function getSurgeColor(surge) {
    if (surge >= 2.5) return '#c800ff'; // Massive event
    if (surge >= 1.8) return '#ff0000'; // High surge
    if (surge >= 1.3) return '#ffff00'; // Moderate
    return '#888'; // Low
  }

  function updateZoneList() {
    zoneList.innerHTML = '';
    tacticalZones
      .sort((a, b) => b.surge - a.surge)
      .slice(0, 3)
      .forEach(zone => {
        const li = document.createElement('li');
        li.textContent = `${zone.name} (${zone.surge.toFixed(1)}x)`;
        zoneList.appendChild(li);
      });
  }

  updateZoneList();
  setInterval(updateZoneList, 30000); // refresh every 30 sec
});