// inputs.js — Ride Logging + DOM Guards

document.addEventListener("DOMContentLoaded", () => {
  const endRideBtn = document.getElementById("end-ride");
  const fareInput = document.getElementById("net-profit");
  const submitBtn = document.getElementById("submit-profit");

  if (endRideBtn) {
    endRideBtn.onclick = () => {
      if (fareInput) fareInput.style.display = "inline-block";
      if (submitBtn) submitBtn.style.display = "inline-block";
    };
  }

  if (submitBtn) {
    submitBtn.onclick = () => {
      const fare = parseFloat(fareInput?.value || "0");
      if (!isNaN(fare)) {
        logRide(currentMode, fare);
        resetRideFlow();
      }
    };
  }
});