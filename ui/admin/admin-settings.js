WriterAdminPanel.prototype.showSettingsTab = function showSettingsTab() {
  document.getElementById("composeTab").hidden = true;
  document.getElementById("uploadTab").hidden = true;
  document.getElementById("manageTab").hidden = true;
  document.getElementById("settingsTab").hidden = false;

  document.getElementById("composeTabBtn").classList.remove("is-active");
  document.getElementById("uploadTabBtn").classList.remove("is-active");
  document.getElementById("manageTabBtn").classList.remove("is-active");
  document.getElementById("settingsTabBtn").classList.add("is-active");

  this.updateSyncStats();
};

WriterAdminPanel.prototype.updateSyncStats = async function updateSyncStats() {
  const stats = await cloudSync.getSyncStatus();
  document.getElementById("totalPieces").textContent = stats.total;
  document.getElementById("syncedPieces").textContent = stats.synced;
  document.getElementById("pendingPieces").textContent = stats.pending;
  document.getElementById("syncStatusDetail").textContent = stats.isOnline ? "Online" : "Offline";
  document.getElementById("lastSyncTime").textContent = stats.lastSync ? new Date(stats.lastSync).toLocaleString() : "Never";
};

WriterAdminPanel.prototype.triggerManualSync = async function triggerManualSync() {
  const btn = document.getElementById("syncNowBtn");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Syncing...";

  try {
    if (!cloudSync.isOnline) throw new Error("You are offline. Cannot sync now.");
    await cloudSync.manualSync();
    this.showMessage("✓ Sync completed", "success");
    await this.updateSyncStats();
  } catch (error) {
    this.showMessage(`Sync failed: ${error.message}`, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
};

WriterAdminPanel.prototype.pullFromCloud = async function pullFromCloud() {
  const btn = document.getElementById("pullFromCloudBtn");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Pulling...";

  try {
    if (!cloudSync.isOnline) throw new Error("You are offline. Cannot pull from cloud.");
    const count = await cloudSync.pullFromCloud();
    this.showMessage(`✓ Pulled ${count} pieces from cloud`, "success");
    await this.updateSyncStats();
    this.refreshMainDisplay();
  } catch (error) {
    this.showMessage(`Pull failed: ${error.message}`, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
};
