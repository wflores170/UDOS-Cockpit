async function refreshCockpit() {
  if (typeof updateGrokIntel === "function") {
    await updateGrokIntel();
  }

  if (typeof updateMapOverlays === "function") {
    updateMapOverlays();
  }
}

setInterval(() => refreshCockpit(), 3000);
refreshCockpit();