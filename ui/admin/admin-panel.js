/**
 * Writer Admin Panel Core
 * Shared panel lifecycle, common utilities, and event wiring.
 */

// SHA-256 hash of the admin passphrase. The plaintext passphrase is never
// stored in source. See ADMIN-ACCESS.md for instructions to rotate it.
const ADMIN_PASSPHRASE_HASH =
  "fd43461367ef6e0c7d246221a6cbf9a745c3bc2372003854de723ee6a7b655bd";

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

class WriterAdminPanel {
  constructor() {
    this.currentWriter = null;
    this.isOpen = false;
    this.unlocked = sessionStorage.getItem("adminUnlocked") === "true";
  }

  async requestAccess() {
    if (this.unlocked) return true;

    const attempt = window.prompt("Enter the admin passphrase:");
    if (attempt === null) return false;

    const hash = await sha256Hex(attempt);
    if (hash === ADMIN_PASSPHRASE_HASH) {
      this.unlocked = true;
      sessionStorage.setItem("adminUnlocked", "true");
      return true;
    }

    // The panel itself is hidden until unlocked, so showMessage() (which
    // writes into a child of the panel) isn't visible yet — use alert().
    window.alert("Incorrect passphrase.");
    return false;
  }

  init() {
    this.setDefaultDates();

    const adminBtn = document.getElementById("adminButton");
    if (adminBtn) adminBtn.addEventListener("click", () => this.openPanel());

    const closeBtn = document.getElementById("adminCloseBtn");
    if (closeBtn) closeBtn.addEventListener("click", () => this.closePanel());

    const composeForm = document.getElementById("composeForm");
    if (composeForm) composeForm.addEventListener("submit", event => this.handleComposeSubmit(event));

    const uploadForm = document.getElementById("adminUploadForm");
    if (uploadForm) uploadForm.addEventListener("submit", event => this.handleFormSubmit(event));

    const fileInput = document.getElementById("uploadFile");
    if (fileInput) fileInput.addEventListener("change", event => this.handleFileSelect(event));

    const composeWriterSelect = document.getElementById("composeWriterSelect");
    if (composeWriterSelect) {
      composeWriterSelect.addEventListener("change", event => {
        this.currentWriter = event.target.value;
      });
    }

    const writerSelect = document.getElementById("writerSelect");
    if (writerSelect) {
      writerSelect.addEventListener("change", event => {
        this.currentWriter = event.target.value;
      });
    }

    const composeTypeSelect = document.getElementById("composeTypeSelect");
    if (composeTypeSelect) {
      composeTypeSelect.addEventListener("change", event => this.updateComposeMoodSuggestions(event.target.value));
    }

    const contentTypeSelect = document.getElementById("contentType");
    if (contentTypeSelect) {
      contentTypeSelect.addEventListener("change", event => this.updateMoodSuggestions(event.target.value));
    }

    const composeTabBtn = document.getElementById("composeTabBtn");
    if (composeTabBtn) composeTabBtn.addEventListener("click", () => this.showComposeTab());

    const uploadTabBtn = document.getElementById("uploadTabBtn");
    if (uploadTabBtn) uploadTabBtn.addEventListener("click", () => this.showUploadTab());

    const manageTabBtn = document.getElementById("manageTabBtn");
    if (manageTabBtn) manageTabBtn.addEventListener("click", () => this.showManageTab());

    const settingsTabBtn = document.getElementById("settingsTabBtn");
    if (settingsTabBtn) settingsTabBtn.addEventListener("click", () => this.showSettingsTab());

    const syncBtn = document.getElementById("syncExistingBtn");
    if (syncBtn) syncBtn.addEventListener("click", () => this.syncExistingContent());

    const enableCloudSyncCheckbox = document.getElementById("enableCloudSync");
    if (enableCloudSyncCheckbox) {
      enableCloudSyncCheckbox.checked = cloudSync.isCloudSyncEnabled();
      enableCloudSyncCheckbox.addEventListener("change", event => {
        cloudSync.setCloudSyncEnabled(event.target.checked);
        this.showMessage(event.target.checked ? "Cloud sync enabled" : "Cloud sync disabled", "info");
      });
    }

    const syncNowBtn = document.getElementById("syncNowBtn");
    if (syncNowBtn) syncNowBtn.addEventListener("click", () => this.triggerManualSync());

    const pullFromCloudBtn = document.getElementById("pullFromCloudBtn");
    if (pullFromCloudBtn) pullFromCloudBtn.addEventListener("click", () => this.pullFromCloud());
  }

  setDefaultDates() {
    const today = new Date().toISOString().split("T")[0];
    const dateInput = document.getElementById("contentDate");
    const composeDateInput = document.getElementById("composeDateInput");
    if (dateInput) dateInput.value = today;
    if (composeDateInput) composeDateInput.value = today;
  }

  async openPanel() {
    const panel = document.getElementById("adminPanel");
    if (!panel) return;

    const allowed = await this.requestAccess();
    if (!allowed) return;

    panel.classList.add("is-open");
    this.isOpen = true;
    this.loadExistingContent();
  }

  closePanel() {
    const panel = document.getElementById("adminPanel");
    if (!panel) return;
    panel.classList.remove("is-open");
    this.isOpen = false;
  }

  showMessage(text, type = "info") {
    const messageEl = document.getElementById("adminMessage");
    if (!messageEl) return;

    messageEl.textContent = text;
    messageEl.className = `admin-message admin-message-${type}`;
    messageEl.hidden = false;

    if (type === "success" || type === "info") {
      setTimeout(() => {
        messageEl.hidden = true;
      }, 4000);
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}
