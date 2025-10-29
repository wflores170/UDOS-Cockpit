// grok_zones.js — Surge Zone Logic

function fetchLiveSurgeZones() {
  return Promise.resolve([
    { zone: "Brickell", surge: "High" },
    { zone: "Downtown", surge: "Moderate" },
    { zone: "Wynwood", surge: "Low" },
    { zone: "Hollywood", surge: "Moderate" },
    { zone: "Boca Raton", surge: "Low" }
  ]);
}

function getLiveGrokZones() {
  return fetchLiveSurgeZones().then(zones => {
    return zones.map(z => ({
      zone: z.zone,
      surge: z.surge,
      confidence: z.surge === "High" ? "Elite" : z.surge === "Moderate" ? "Strong" : "Moderate"
    }));
  });
}

window.fetchLiveSurgeZones = fetchLiveSurgeZones;
window.getLiveGrokZones = getLiveGrokZones;