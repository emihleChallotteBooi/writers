WriterAdminPanel.prototype.showUploadTab = function showUploadTab() {
  document.getElementById("composeTab").hidden = true;
  document.getElementById("manageTab").hidden = true;
  document.getElementById("settingsTab").hidden = true;
  document.getElementById("uploadTab").hidden = false;

  document.getElementById("composeTabBtn").classList.remove("is-active");
  document.getElementById("uploadTabBtn").classList.add("is-active");
  document.getElementById("manageTabBtn").classList.remove("is-active");
  document.getElementById("settingsTabBtn").classList.remove("is-active");
};

WriterAdminPanel.prototype.handleFileSelect = async function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const fileName = document.getElementById("fileName");
  if (fileName) fileName.textContent = file.name;

  if (file.type === "application/pdf") {
    try {
      const title = file.name.replace(/\.pdf$/i, "");
      const titleInput = document.getElementById("contentTitle");
      if (titleInput && !titleInput.value) titleInput.value = title;
      this.showMessage(`PDF selected: ${file.name}`, "success");
    } catch (error) {
      this.showMessage("Error reading PDF file", "error");
    }
  }
};

WriterAdminPanel.prototype.escapeFrontmatter = function escapeFrontmatter(text) {
  return String(text).replace(/"/g, '\\"').replace(/\$/g, "\\$");
};

WriterAdminPanel.prototype.addFrontmatterToText = function addFrontmatterToText(text, metadata) {
  const moodArray = Array.isArray(metadata.mood) ? metadata.mood : [metadata.mood];
  return `---
title: "${this.escapeFrontmatter(metadata.title)}"
author: "${this.escapeFrontmatter(metadata.author)}"
type: "${this.escapeFrontmatter(metadata.type)}"
mood: [${moodArray.map(mood => `"${this.escapeFrontmatter(mood)}"`).join(", ")}]
date: "${metadata.date}"
readTime: "${pdfConverter.estimateReadTime(text)}"
excerpt: "${this.escapeFrontmatter(metadata.excerpt || pdfConverter.getExcerpt(text))}"
---

${text}`;
};

WriterAdminPanel.prototype.getSelectedMoods = function getSelectedMoods() {
  const checkboxes = document.querySelectorAll("input[name='mood']:checked");
  return Array.from(checkboxes).map(checkbox => checkbox.value);
};

WriterAdminPanel.prototype.updateMoodSuggestions = function updateMoodSuggestions(type) {
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
  const moodContainer = document.getElementById("moodCheckboxes");
  if (!moodContainer) return;

  moodContainer.innerHTML = suggestions.map(mood => `
    <label class="checkbox-label">
      <input type="checkbox" name="mood" value="${mood}">
      ${mood}
    </label>
  `).join("");
};

WriterAdminPanel.prototype.handleFormSubmit = async function handleFormSubmit(event) {
  event.preventDefault();

  if (!this.currentWriter) {
    this.showMessage("Please select a writer", "error");
    return;
  }

  const fileInput = document.getElementById("uploadFile");
  const file = fileInput.files[0];
  if (!file) {
    this.showMessage("Please select a file", "error");
    return;
  }

  const submitBtn = event.target.querySelector("button[type='submit']");
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Processing...";

  try {
    const metadata = {
      title: document.getElementById("contentTitle")?.value || "",
      type: document.getElementById("contentType")?.value || "Fragment",
      mood: this.getSelectedMoods(),
      date: document.getElementById("contentDate")?.value || new Date().toISOString().split("T")[0],
      excerpt: document.getElementById("contentExcerpt")?.value || ""
    };

    const authorMap = {
      challotte: "Challotte",
      sister: "Inathi Booi"
    };
    metadata.author = authorMap[this.currentWriter] || this.currentWriter;

    let markdown;
    if (file.type === "application/pdf") {
      this.showMessage("Converting PDF to Markdown...", "info");
      markdown = await pdfConverter.pdfToMarkdown(file, metadata);
    } else if (file.type === "text/markdown" || file.type === "text/plain" || file.name.endsWith(".md")) {
      markdown = await file.text();
      if (!markdown.startsWith("---")) {
        markdown = this.addFrontmatterToText(markdown, metadata);
      }
    } else {
      throw new Error("Unsupported file type. Please use PDF, Markdown, or text files.");
    }

    const piece = parseMarkdownFragment(markdown, `admin/${this.currentWriter}/uploaded/${Date.now()}.md`);

    if (cloudSync.isInitialized && cloudSync.isCloudSyncEnabled()) {
      await cloudSync.savePieceWithSync(piece);
    } else {
      await archiveStorage.savePiece(piece);
    }

    this.showMessage(`✓ "${piece.title}" added successfully!`, "success");
    event.target.reset();
    document.getElementById("fileName").textContent = "No file selected";
    fileInput.value = "";

    await this.loadExistingContent();
    this.refreshMainDisplay();
  } catch (error) {
    console.error("Upload error:", error);
    this.showMessage(`Error: ${error.message}`, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
};
