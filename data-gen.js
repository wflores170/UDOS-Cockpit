const fs = require('fs');
const path = './data.json';
const tmpPath = './data.tmp.json';
let tick = 0;

function generateData() {
  const now = new Date();
  const hourBlock = now.getHours();
  const timeString = now.toLocaleTimeString();

  // ✈️ Dynamic Flights (next 4 hours)
  const miaFlights = Array.from({ length: 4 }, (_, i) => {
    const hour = (hourBlock + i) % 24;
    const time = `${hour}:00`;
    return {
      flight: `A320 (JetBlue)`,
      time,
      seats: 150
    };
  });

  // 🧠 MIA Surge Logic
  const totalSeats = miaFlights.reduce((sum, f) => sum + f.seats, 0);
  let miaSurgeAdvice = "Monitor MIA — no surge expected";
  if (totalSeats >= 600) {
    miaSurgeAdvice = "Stage near MIA for Premier pickups — surge likely";
  } else if (totalSeats >= 400) {
    miaSurgeAdvice = "Hold Comfort/XL near MIA — moderate surge possible";
  } else {
    miaSurgeAdvice = "Avoid MIA — low inbound volume";
  }

  // 🎟️ Relevant Events (evening Miami venues)
  const topEvents = [
    {
      name: "Heat vs Celtics",
      location: "Kaseya Center",
      time: "7:30 PM",
      floodProb: "Low",
      crowdProb: "High",
      profitProb: "High",
      avoidFrom: "7:00 PM",
      bailBy: "9:30 PM",
      mode: "Premier"
    },
    {
      name: "Bad Bunny Live",
      location: "Bayfront Park",
      time: "8:00 PM",
      floodProb: "Medium",
      crowdProb: "High",
      profitProb: "Medium",
      avoidFrom: "7:30 PM",
      bailBy: "9:45 PM",
      mode: "Comfort"
    }
  ];

  const data = {
    tripNet: +(6 + Math.random() * 4).toFixed(2),
    rideDistance: +(3 + Math.random() * 2).toFixed(2),
    rideTime: +(12 + Math.random() * 5).toFixed(2),
    speed: +(12 + Math.random() * 6).toFixed(2),
    ratePerMin: +(0.4 + Math.random() * 0.2).toFixed(2),
    ratePerMile: +(0.4 + Math.random() * 0.2).toFixed(2),
    tags: ["Hi Tag", "Medium", `Surge: ${(1 + Math.random() * 0.5).toFixed(1)}x`],
    modeTrigger: {
      Comfort: "✅ Use Comfort",
      XL: "✅ Use XL",
      Premier: "✅ Use Premier"
    },
    bailTrigger: "✅ Stay Active",
    shiftLog: [
      { time: "12:00 PM", mode: "Comfort", net: 14.25, zone: "Downtown" },
      { time: "1:00 PM", mode: "XL", net: 18.00, zone: "MIA" },
      { time: "2:00 PM", mode: "Premier", net: 21.50, zone: "Brickell" }
    ],
    shift: {
      totalNet: 53.75,
      totalMiles: 18.4,
      totalTime: 145,
      avgLambda: 1.38,
      modeCount: {
        Comfort: 1,
        XL: 1,
        Premier: 1
      },
      topZone: "Brickell",
      recommendation: {
        Comfort: "Use Comfort if λ drops below 1.2",
        XL: "Hold XL unless surge > 1.3x",
        Premier: "Use Premier only in Brickell or MIA"
      }
    },
    weatherTonight: {
      condition: "Clear",
      temp: 80,
      wind: 7,
      humidity: "78%",
      visibility: "10 mi",
      pressure: "29.94 in",
      rain: +(75 + Math.random() * 10).toFixed(0),
      floodRisk: "Low",
      surgeAccess: "✅ AWD → Surge Access",
      tags: ["Hi Wind", "Rain: 81%", "80s"],
      forecast: [
        { hour: "2 AM", temp: 76, wind: 7, rain: 82 },
        { hour: "3 AM", temp: 77, wind: 7, rain: 81 },
        { hour: "4 AM", temp: 78, wind: 6, rain: 79 }
      ]
    },
    miaFlights,
    miaSurgeAdvice,
    strategyZones: [
      {
        name: "Brickell",
        avoid: false,
        surge: "1.4x",
        mode: "Premier",
        tipProb: "High",
        λ: 1.5
      },
      {
        name: "Wynwood",
        avoid: true,
        surge: "1.2x",
        mode: "Comfort",
        tipProb: "Medium",
        λ: 1.3
      },
      {
        name: "MIA",
        avoid: miaSurgeAdvice.includes("Avoid"),
        surge: miaSurgeAdvice.includes("surge") ? "1.3x+" : "1.0x",
        mode: "Premier",
        tipProb: "High",
        λ: miaSurgeAdvice.includes("Stage") ? 1.6 : 1.1
      }
    ],
    topEvents
  };

  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
  fs.renameSync(tmpPath, path);

  tick++;
  if (tick % 6 === 0) console.log(`✅ Updated at ${timeString}`);
}

setInterval(generateData, 300000); // every 5 minutes
generateData(); // initial run