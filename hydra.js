// Miami base coordinates
const MIAMI_LAT = 25.7617;
const MIAMI_LNG = -80.1918;

// Haversine distance in miles
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

// Normalize and deduplicate tags
function normalizeTags(tags) {
  const seen = new Set();
  return tags
    .map(t => t.trim().toLowerCase())
    .filter(t => t && !seen.has(t) && seen.add(t));
}

// Classify event type for scoring
export function classifyEventTags(tags) {
  if (tags.some(t => /party|club|concert|after|bar|dj|booze/i.test(t))) return "booze";
  if (tags.some(t => /family|kids|museum|parade|school/i.test(t))) return "family";
  return "neutral";
}

// Simulated local event feed (replace with real scraper if needed)
const rawEvents = [
  {
    name: "Wynwood Halloween Bash",
    tags: ["party", "DJ", "after hours", "costume"],
    lat: 25.8007,
    lng: -80.1998,
    date: "2025-10-29"
  },
  {
    name: "Brickell Tech Mixer",
    tags: ["networking", "startup", "tech", "cocktails"],
    lat: 25.7617,
    lng: -80.1918,
    date: "2025-10-29"
  },
  {
    name: "Family Day at Frost Museum",
    tags: ["family", "museum", "kids", "science"],
    lat: 25.7850,
    lng: -80.1867,
    date: "2025-10-29"
  },
  {
    name: "Ultra Prep Meetup",
    tags: ["EDM", "club", "after hours", "booze"],
    lat: 25.7743,
    lng: -80.1331,
    date: "2025-10-29"
  },
  {
    name: "Palm Beach Book Fair",
    tags: ["books", "authors", "family", "reading"],
    lat: 26.7153,
    lng: -80.0534,
    date: "2025-10-29"
  }
];

// Main export: fetch filtered, normalized events
export async function fetchHydraEvents() {
  const today = new Date().toISOString().slice(0, 10);
  return rawEvents
    .filter(e => e.date === today)
    .filter(e => haversineMiles(MIAMI_LAT, MIAMI_LNG, e.lat, e.lng) <= 100)
    .map(e => ({
      name: e.name,
      tags: normalizeTags(e.tags),
      type: classifyEventTags(e.tags),
      lat: e.lat,
      lng: e.lng
    }));
}