WriterAdminPanel.prototype.getComposedMoods = function getComposedMoods() {
  const checkboxes = document.querySelectorAll("input[name='composeMood']:checked");
  return Array.from(checkboxes).map(checkbox => checkbox.value);
};

WriterAdminPanel.prototype.updateComposeMoodSuggestions = function updateComposeMoodSuggestions(type) {
  const moodSuggestions = {
    Poem: ["Memory", "Grief", "Love", "Hope"],
    Fragment: ["Unspoken", "Softness", "Silence", "Observation"],
    Thought: ["Memory", "Becoming", "Identity", "Softness"],
    Reflection: ["Home", "Grief", "Hope", "Softness"],
    Letter: ["Love", "Softness", "Home", "Unspoken"],
    Essay: ["Observation", "Memory", "Becoming", "Identity"],
    Story: ["Memory", "Home", "Love", "Hope"],
    Book: ["Memory", "Identity", "Becoming", "Hope"]
  };

  const suggestions = moodSuggestions[type] || ["Unspoken", "Memory", "Softness", "Hope"];
  const moodContainer = document.getElementById("composeMoodCheckboxes");
  if (!moodContainer) return;

  moodContainer.innerHTML = suggestions.map(mood => `
    <label class="checkbox-label">
      <input type="checkbox" name="composeMood" value="${mood}">
      ${mood}
    </label>
  `).join("");
};

WriterAdminPanel.prototype.showComposeTab = function showComposeTab() {
  document.getElementById("uploadTab").hidden = true;
  document.getElementById("manageTab").hidden = true;
  document.getElementById("settingsTab").hidden = true;
  document.getElementById("composeTab").hidden = false;

  document.getElementById("composeTabBtn").classList.add("is-active");
  document.getElementById("uploadTabBtn").classList.remove("is-active");
  document.getElementById("manageTabBtn").classList.remove("is-active");
  document.getElementById("settingsTabBtn").classList.remove("is-active");
};

WriterAdminPanel.prototype.handleComposeSubmit = async function handleComposeSubmit(event) {
  event.preventDefault();

  const writerSelect = document.getElementById("composeWriterSelect");
  const titleInput = document.getElementById("composeTitleInput");
  const typeSelect = document.getElementById("composeTypeSelect");
  const dateInput = document.getElementById("composeDateInput");
  const contentTextarea = document.getElementById("composeContentTextarea");
  const excerptInput = document.getElementById("composeExcerptInput");

  const writer = writerSelect?.value;
  if (!writer) {
    this.showMessage("Please select a writer", "error");
    return;
  }

  const submitBtn = event.target.querySelector("button[type='submit']");
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";

  try {
    const metadata = {
      title: titleInput?.value || "Untitled",
      type: typeSelect?.value || "Fragment",
      date: dateInput?.value || new Date().toISOString().split("T")[0],
      mood: this.getComposedMoods(),
      excerpt: excerptInput?.value || ""
    };

    const authorMap = {
      challotte: "Challotte",
      sister: "Inathi Booi"
    };
    metadata.author = authorMap[writer] || writer;

    const markdown = this.addFrontmatterToText(contentTextarea?.value || "", metadata);
    const piece = parseMarkdownFragment(markdown, `admin/${writer}/composed/${Date.now()}.md`);

    await archiveStorage.savePiece(piece);

    this.showMessage(`✓ "${piece.title}" saved to your archive!`, "success");
    event.target.reset();

    const today = new Date().toISOString().split("T")[0];
    if (dateInput) dateInput.value = today;

    this.refreshMainDisplay();
  } catch (error) {
    console.error("Compose error:", error);
    this.showMessage(`Error: ${error.message}`, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
};
