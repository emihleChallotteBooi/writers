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

    const attempt = await this.requestPassphrase();
    if (attempt === null) return false;

    const hash = await sha256Hex(attempt);
    if (hash === ADMIN_PASSPHRASE_HASH) {
      this.unlocked = true;
      sessionStorage.setItem("adminUnlocked", "true");
      return true;
    }

    this.showAccessError();
    return false;
  }

  requestPassphrase() {
    return new Promise(resolve => {
      const prompt = document.createElement("div");
      prompt.className = "admin-access-alert";
      prompt.setAttribute("role", "dialog");
      prompt.setAttribute("aria-modal", "true");
      prompt.setAttribute("aria-labelledby", "adminAccessPromptTitle");
      prompt.innerHTML = `
        <form class="admin-access-alert__panel">
          <p id="adminAccessPromptTitle" class="admin-access-alert__title">Writer access</p>
          <label class="admin-access-alert__label" for="adminAccessPassphrase">Enter the admin passphrase</label>
          <input id="adminAccessPassphrase" class="admin-access-alert__input" type="password" autocomplete="current-password" required>
          <div class="admin-access-alert__actions">
            <button class="button secondary admin-access-alert__cancel" type="button">Cancel</button>
            <button class="button primary" type="submit">Continue</button>
          </div>
        </form>
      `;

      const finish = value => {
        prompt.remove();
        document.removeEventListener("keydown", handleKeydown);
        resolve(value);
      };
      const handleKeydown = event => {
        if (event.key === "Escape") finish(null);
      };

      prompt.addEventListener("submit", event => {
        event.preventDefault();
        finish(prompt.querySelector(".admin-access-alert__input").value);
      });
      prompt.querySelector(".admin-access-alert__cancel").addEventListener("click", () => finish(null));
      document.addEventListener("keydown", handleKeydown);
      document.body.appendChild(prompt);
      prompt.querySelector(".admin-access-alert__input").focus();
    });
  }

  showAccessError() {
    const existingAlert = document.getElementById("adminAccessAlert");
    if (existingAlert) existingAlert.remove();

    const alert = document.createElement("div");
    alert.id = "adminAccessAlert";
    alert.className = "admin-access-alert";
    alert.setAttribute("role", "alertdialog");
    alert.setAttribute("aria-modal", "true");
    alert.setAttribute("aria-labelledby", "adminAccessAlertTitle");

    alert.innerHTML = `
      <div class="admin-access-alert__panel">
        <p id="adminAccessAlertTitle" class="admin-access-alert__title">Access not granted</p>
        <p class="admin-access-alert__text">That passphrase was not recognised.</p>
        <button class="button primary admin-access-alert__close" type="button">Try again</button>
      </div>
    `;

    const closeAlert = () => {
      alert.remove();
      document.removeEventListener("keydown", handleKeydown);
    };
    const handleKeydown = event => {
      if (event.key === "Escape") closeAlert();
    };

    alert.querySelector(".admin-access-alert__close").addEventListener("click", closeAlert);
    document.addEventListener("keydown", handleKeydown);
    document.body.appendChild(alert);
    alert.querySelector(".admin-access-alert__close").focus();
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
