if (typeof L === "undefined") {
  console.error("Leaflet library not loaded.");
}

const map = L.map("map", {
  center: [25.7617, -80.1918],
  zoom: 12,
  maxZoom: 18,
  minZoom: 10,
  zoomControl: true,
  crs: L.CRS.EPSG3857
});

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

navigator.geolocation.getCurrentPosition(pos => {
  const { latitude, longitude } = pos.coords;
  L.marker([latitude, longitude]).addTo(map).bindPopup("You are here").openPopup();
}, err => {
  console.warn("GPS error:", err.message);
  L.marker([25.7617, -80.1918]).addTo(map).bindPopup("Default: Brickell Core").openPopup();
});

setTimeout(() => {
  map.invalidateSize();
}, 500);

window.addEventListener("resize", () => {
  map.invalidateSize();
});