const fs = require('fs');
const path = './data.json';
let tick = 0;

function generateData() {
  const now = new Date();
  const hour = now.getHours();
  const timeString = now.toLocaleTimeString();

  const data = {
    now: timeString,
    hour,
    stage: "3",
    trigger: "Stage 3 – Low Net",
    rideFare: +(15 + Math.random() * 5).toFixed(2),
    rideDistance: +(4 + Math.random() * 2).toFixed(2),
    rideTime: +(12 + Math.random() * 5).toFixed(1),
    addTime: +(0.5 + Math.random()).toFixed(2),
    addDistance: +(1 + Math.random()).toFixed(2),
    tripNet: +(2 + Math.random() * 4).toFixed(2),
    tripNetVerdict: "✅ Profitable",
    λ: +(1.2 + Math.random() * 0.3).toFixed(2),
    tipProb: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)],
    surgeMultiplier: +(1.2 + Math.random() * 0.2).toFixed(1),
    modeTrigger: {
      Comfort: "✅ Use Comfort",
      XL: "❌ Hold XL",
      Premier: "✅ Use Premier"
    },
    bailTrigger: "✅ Stay Active",
    shiftLog: [
      { time: "12:00 AM", mode: "Comfort", net: 14.25, zone: "Downtown" },
      { time: "1:00 AM", mode: "XL", net: 18.00, zone: "MIA" },
      { time: "2:00 AM", mode: "Premier", net: 21.50, zone: "Knight Center" }
    ],
    shift: {
      totalNet: +(40 + Math.random() * 20).toFixed(2),
      totalMiles: +(15 + Math.random() * 5).toFixed(1),
      totalTime: 145,
      avgLambda: +(1.3 + Math.random() * 0.2).toFixed(2),
      modeCount: { Comfort: 1, XL: 1, Premier: 1 },
      topZone: "Knight Center",
      recommendation: "Stay XL until 3 AM, then switch to Comfort if λ drops below 1.2"
    },
    weatherTonight: {
      condition: "Rain",
      temp: 80,
      wind: 6,
      windDir: "E",
      visibility: "10 mi",
      humidity: "74%",
      uvIndex: "7 (High)",
      rainProbability: 84,
      floodRisk: "High",
      surgeAccess: "✅ AWD → Surge Access",
      forecast: [
        { hour: "2 AM", temp: 76, wind: 7, rain: 82 },
        { hour: "3 AM", temp: 77, wind: 6, rain: 84 }
      ]
    },
    miaFlights: [
      { flight: "A321 (Delta)", time: "6:00 AM" },
      { flight: "A319 (Frontier)", time: "6:15 AM" },
      { flight: "A330 (Iberia)", time: "6:20 AM" },
      { flight: "A320 (JetBlue)", time: "6:24 AM" }
    ],
    strategyZones: [
      {
        name: "Knight Center",
        avoid: true,
        surge: "25%+",
        mode: "Premier",
        tipProb: "High",
        λ: 1.4
      },
      {
        name: "Miccosukee Village",
        avoid: true,
        surge: "20%",
        mode: "Comfort",
        tipProb: "Medium",
        λ: 1.2
      },
      {
        name: "FTX Arena",
        avoid: true,
        surge: "18%",
        mode: "XL",
        tipProb: "Medium",
        λ: 1.3
      },
      {
        name: "MIA",
        avoid: false,
        surge: "Clustered",
        mode: "Premier",
        tipProb: "High",
        λ: 1.5
      }
    ],
    topEvents: [
      {
        name: "Daddy Yankee",
        location: "Knight Center",
        time: "7:30 PM",
        floodProb: "High",
        crowdProb: "High",
        profitProb: "High",
        avoidFrom: "7:00 PM",
        bailBy: "9:30 PM",
        mode: "Premier"
      },
      {
        name: "Pitbull",
        location: "Miccosukee Village",
        time: "7:00 PM",
        floodProb: "Medium",
        crowdProb: "High",
        profitProb: "Medium",
        avoidFrom: "7:00 PM",
        bailBy: "9:00 PM",
        mode: "Comfort"
      },
      {
        name: "Marc Anthony",
        location: "FTX Arena",
        time: "7:00 PM",
        floodProb: "Low",
        crowdProb: "High",
        profitProb: "High",
        avoidFrom: "7:00 PM",
        bailBy: "9:15 PM",
        mode: "XL"
      }
    ]
  };

  fs.writeFileSync(path, JSON.stringify(data, null, 2));
  tick++;
  if (tick % 6 === 0) console.log(`✅ Updated at ${timeString}`);
}

setInterval(generateData, 10000);
generateData();