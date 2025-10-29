function getLiveIntel(tripMeta = []) {
  const events = [
    {
      title: "Ladies Night @ Sweet Caroline Karaoke Bar",
      location: "Brickell",
      start_time: "2025-10-29T20:00:00"
    },
    {
      title: "Sabor Wednesday @ Ball & Chain",
      location: "Little Havana",
      start_time: "2025-10-29T20:00:00"
    },
    {
      title: "Country Cruising Halloween Jam",
      location: "Fort Lauderdale",
      start_time: "2025-10-29T19:00:00"
    }
  ];

  const scored = events.map(e => {
    const score = scoreEvent(e);
    return {
      title: e.title,
      zone: score.zone,
      confidence: score.confidence,
      surge: score.surge,
      recommendation: score.recommendation
    };
  });

  scored.sort((a, b) => {
    const rank = { Elite: 3, Strong: 2, Moderate: 1 };
    return rank[b.confidence] - rank[a.confidence];
  });

  return scored;
}

function scoreEvent(e) {
  const location = e.location.toLowerCase();
  const time = new Date(e.start_time).getHours();
  const title = e.title.toLowerCase();

  let confidence = "Low";
  let surge = "Low";
  let zone = "Unknown";

  if (location.includes("brickell") || title.includes("sweet caroline")) {
    zone = "Brickell";
    confidence = "Elite";
  } else if (location.includes("havana") || title.includes("ball & chain")) {
    zone = "Little Havana";
    confidence = "Strong";
  } else if (location.includes("fort lauderdale")) {
    zone = "Fort Lauderdale";
    confidence = "Moderate";
  }

  if (title.includes("party") || title.includes("crawl") || time >= 21) {
    surge = "Moderate";
    if (confidence === "Elite") surge = "High";
  }

  const recommendation = zone === "Brickell" ? "Stay Local — Brickell is optimal" :
                         confidence === "Elite" ? "Redirect: Brickell" :
                         "Hold Position — Moderate demand";

  return { confidence, surge, zone, recommendation };
}

window.getLiveIntel = getLiveIntel;