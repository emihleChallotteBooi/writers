WriterAdminPanel.prototype.showManageTab = function showManageTab() {
  document.getElementById("composeTab").hidden = true;
  document.getElementById("uploadTab").hidden = true;
  document.getElementById("settingsTab").hidden = true;
  document.getElementById("manageTab").hidden = false;

  document.getElementById("composeTabBtn").classList.remove("is-active");
  document.getElementById("uploadTabBtn").classList.remove("is-active");
  document.getElementById("manageTabBtn").classList.add("is-active");
  document.getElementById("settingsTabBtn").classList.remove("is-active");

  this.loadExistingContent();
};

WriterAdminPanel.prototype.loadExistingContent = async function loadExistingContent() {
  try {
    const pieces = await archiveStorage.getAllPieces();
    const contentList = document.getElementById("contentList");
    if (!contentList) return;

    if (pieces.length === 0) {
      contentList.innerHTML = '<p class="empty-state">No content stored yet.</p>';
      return;
    }

    const sortedPieces = pieces.sort((a, b) => new Date(b.date) - new Date(a.date));
    contentList.innerHTML = sortedPieces.map(piece => `
      <div class="content-item">
        <div class="content-item-info">
          <h4>${this.escapeHtml(piece.title)}</h4>
          <p class="meta">${this.escapeHtml(piece.author)} · ${piece.type} · ${formatDate(piece.date)}</p>
        </div>
        <div class="content-item-actions">
          <button type="button" class="btn-small btn-secondary" onclick="writerAdminPanel.editContent('${this.escapeHtml(piece.slug)}')">Edit</button>
          <button type="button" class="btn-small btn-danger" onclick="writerAdminPanel.deleteContent('${this.escapeHtml(piece.slug)}')">Delete</button>
        </div>
      </div>
    `).join("");

    const countElement = document.getElementById("contentCount");
    if (countElement) countElement.textContent = pieces.length;
  } catch (error) {
    console.error("Error loading content:", error);
    this.showMessage("Error loading content", "error");
  }
};

WriterAdminPanel.prototype.deleteContent = async function deleteContent(slug) {
  if (!confirm("Are you sure you want to delete this piece?")) return;

  try {
    await archiveStorage.deletePiece(slug);
    this.showMessage("Piece deleted successfully", "success");
    await this.loadExistingContent();
    this.refreshMainDisplay();
  } catch (error) {
    this.showMessage("Error deleting piece", "error");
  }
};

WriterAdminPanel.prototype.editContent = function editContent() {
  this.showMessage("Edit functionality coming soon", "info");
};

WriterAdminPanel.prototype.syncExistingContent = async function syncExistingContent() {
  const btn = document.getElementById("syncExistingBtn");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Syncing...";

  try {
    const existingCount = await archiveStorage.getPieceCount();
    if (existingCount > 0) {
      const shouldContinue = confirm(`You already have ${existingCount} pieces. Do you want to re-sync from the server archive?`);
      if (!shouldContinue) return;
    }

    const response = await fetch("/api/archive", { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load server archive (${response.status})`);

    const serverArchive = await response.json();
    if (!Array.isArray(serverArchive)) {
      throw new Error("Invalid server archive response");
    }

    const loadedPosts = serverArchive
      .filter(item => item && typeof item.filePath === "string" && typeof item.markdown === "string")
      .map(item => parseMarkdownFragment(item.markdown, item.filePath));

    let saved = 0;
    for (const post of loadedPosts) {
      if (!post) continue;
      await archiveStorage.savePiece(post);
      saved += 1;
    }

    this.showMessage(`✓ Synced ${saved} pieces from server archive`, "success");
    await this.loadExistingContent();
    this.refreshMainDisplay();
  } catch (error) {
    console.error("Sync error:", error);
    this.showMessage("Error syncing content", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
};

WriterAdminPanel.prototype.refreshMainDisplay = function refreshMainDisplay() {
  if (typeof renderFeatured === "function") renderFeatured();
  if (typeof renderLibrary === "function") renderLibrary();
  if (typeof renderFragments === "function") renderFragments();
};
