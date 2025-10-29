// timeline.js — Tactical Ride Timeline Logger

let timelineLog = [];

function logRideToTimeline(ride) {
  if (!ride || !ride.mode || !ride.start || !ride.end || typeof ride.profit !== "number") {
    console.warn("Invalid ride object:", ride);
    return;
  }

  const startTime = new Date(ride.start);
  const endTime = new Date(ride.end);
  const durationHours = (endTime - startTime) / 3600000;
  const netPerHour = ride.profit / durationHours;

  const entry = {
    mode: ride.mode,
    start: ride.start,
    end: ride.end,
    profit: ride.profit,
    netPerHour: parseFloat(netPerHour.toFixed(2)),
    timestamp: new Date().toISOString()
  };

  timelineLog.push(entry);
  renderTimelineEntry(entry);
}

function renderTimelineEntry(entry) {
  const list = document.getElementById("ride-log-list");
  if (!list || !entry) return;

  const li = document.createElement("li");
  li.textContent = `${entry.mode} | $${entry.profit} | ${entry.netPerHour}/hr | ${formatTime(entry.start)} → ${formatTime(entry.end)}`;
  list.appendChild(li);
}

function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Optional: expose timelineLog for export
function getTimelineData() {
  return timelineLog;
}