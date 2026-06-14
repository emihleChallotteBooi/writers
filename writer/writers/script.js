const archiveFiles = [
  "./challotte/fragments/scars.md",
  "./challotte/story/i_wish.md",
  "./challotte/thought/i'm_a_problem.md",
  "./sister/fragments/where-the-light-forgot-me.md",
  "./sister/reflection/She_passed.md"
];

let posts = [];
let loadedFragmentsCache = [];

const plannedContentTypes = [
  "Book",
  "Essay",
  "Fragment",
  "Letter",
  "Poem",
  "Reflection",
  "Story",
  "Thought"
];

const authorFilter = document.querySelector("#authorFilter");
const typeFilter = document.querySelector("#typeFilter");
const moodFilter = document.querySelector("#moodFilter");
const libraryPosts = document.querySelector("#libraryPosts");
const featuredPosts = document.querySelector("#featuredPosts");
const fragmentGrid = document.querySelector("#fragmentGrid");
const reader = document.querySelector("#reader");
const readerTitle = document.querySelector("#readerTitle");
const readerMeta = document.querySelector("#readerMeta");
const readerBody = document.querySelector("#readerBody");
const readerAuthor = document.querySelector("#readerAuthor");
const soundToggles = document.querySelectorAll(".sound-toggle");
const themeToggles = document.querySelectorAll(".theme-toggle");
let soundEnabled = localStorage.getItem("writersSound") === "on";
let currentTheme = localStorage.getItem("writersTheme") === "dark" ? "dark" : "light";
let audioContext;

function applyTheme(theme) {
  currentTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = currentTheme;
  localStorage.setItem("writersTheme", currentTheme);

  themeToggles.forEach(toggle => {
    const isDark = currentTheme === "dark";
    toggle.textContent = isDark ? "Light Mode" : "Dark Mode";
    toggle.classList.toggle("is-on", isDark);
    toggle.setAttribute("aria-pressed", String(isDark));
    toggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  });
}

applyTheme(currentTheme);

function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function setSoundToggleState() {
  soundToggles.forEach(toggle => {
    toggle.textContent = soundEnabled ? "Sound On" : "Sound Off";
    toggle.classList.toggle("is-on", soundEnabled);
    toggle.setAttribute("aria-pressed", String(soundEnabled));
    toggle.setAttribute(
      "aria-label",
      soundEnabled ? "Turn website micro-sounds off" : "Turn website micro-sounds on"
    );
  });
}

function tone({ frequency = 440, duration = 0.12, type = "sine", gain = 0.035, delay = 0 }) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const volume = ctx.createGain();
  const start = ctx.currentTime + delay;
  const end = start + duration;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  volume.gain.setValueAtTime(0.0001, start);
  volume.gain.exponentialRampToValueAtTime(gain, start + 0.015);
  volume.gain.exponentialRampToValueAtTime(0.0001, end);

  oscillator.connect(volume);
  volume.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(end + 0.02);
}

function noise({ duration = 0.18, gain = 0.025, filterFrequency = 1800 }) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const volume = ctx.createGain();

  filter.type = "highpass";
  filter.frequency.value = filterFrequency;
  volume.gain.value = gain;

  source.buffer = buffer;
  source.connect(filter);
  filter.connect(volume);
  volume.connect(ctx.destination);
  source.start();
}

function playSound(name) {
  if (!soundEnabled) return;

  if (name === "page") {
    noise({ duration: 0.2, gain: 0.018, filterFrequency: 900 });
    tone({ frequency: 620, duration: 0.05, type: "triangle", gain: 0.012, delay: 0.05 });
  }

  if (name === "tick") {
    tone({ frequency: 520, duration: 0.045, type: "square", gain: 0.012 });
  }

  if (name === "open") {
    noise({ duration: 0.16, gain: 0.014, filterFrequency: 700 });
    tone({ frequency: 392, duration: 0.12, type: "sine", gain: 0.018, delay: 0.03 });
  }

  if (name === "close") {
    tone({ frequency: 300, duration: 0.08, type: "triangle", gain: 0.014 });
  }

  if (name === "about") {
    tone({ frequency: 293.66, duration: 0.42, type: "sine", gain: 0.018 });
    tone({ frequency: 440, duration: 0.42, type: "sine", gain: 0.012, delay: 0.04 });
  }
}


function safeDateValue(dateString) {
  const value = new Date(dateString || "1970-01-01").getTime();
  return Number.isNaN(value) ? 0 : value;
}

function uniqueValues(values) {
  return [...new Set(values)].sort();
}

function populateSelect(select, values) {
  values.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function typeClass(type = "piece") {
  return `type-${String(type).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function postCard(post, compact = false) {
  const article = document.createElement("article");
  article.className = `post-card ${typeClass(post.type)}`;
  article.innerHTML = `
    <div>
      <p class="post-meta">${post.author} · ${post.type} · ${post.moods.join(", ")} · ${post.readTime}</p>
      <h3>${post.title}</h3>
      <p>${post.excerpt}</p>
      ${compact ? `<p class="small">${formatDate(post.date)}</p>` : ""}
    </div>
    <button class="read-button" type="button" data-slug="${post.slug}">Read piece</button>
  `;
  return article;
}

function renderFeatured() {
  featuredPosts.innerHTML = "";

  const recentlyPreserved = [...posts]
    .sort((a, b) => safeDateValue(b.date) - safeDateValue(a.date))
    .slice(0, 3);

  if (!recentlyPreserved.length) {
    featuredPosts.innerHTML = `<p class="post-card">No work has been preserved yet.</p>`;
    return;
  }

  recentlyPreserved.forEach(post => {
    featuredPosts.appendChild(postCard(post, true));
  });
}

function renderLibrary() {
  const selectedAuthor = authorFilter.value;
  const selectedType = typeFilter.value;
  const selectedMood = moodFilter.value;

  const filtered = posts.filter(post => {
    const authorMatch = selectedAuthor === "all" || post.author === selectedAuthor;
    const typeMatch = selectedType === "all" || post.type === selectedType || (selectedType === "Essay" && post.type === "Personal Essay");
    const moodMatch = selectedMood === "all" || post.moods.includes(selectedMood);
    return authorMatch && typeMatch && moodMatch;
  });

  libraryPosts.innerHTML = "";

  if (!filtered.length) {
    libraryPosts.innerHTML = `<p class="post-card">No pieces match this filter yet.</p>`;
    return;
  }

  filtered.forEach(post => libraryPosts.appendChild(postCard(post)));
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function inlineMarkdown(value = "") {
  return escapeHtml(value)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/_(.*?)_/g, "<em>$1</em>");
}

function stripMarkdownFrontmatter(markdown = "") {
  return String(markdown)
    .replace(/^\uFEFF/, "")
    .replace(/^---\s*[\r\n]+[\s\S]*?[\r\n]+---\s*(?:[\r\n]+|$)/, "");
}

function cleanRawHtmlFromMarkdown(markdown = "") {
  return stripMarkdownFrontmatter(markdown)
    .replace(/\r\n/g, "\n")
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/p\s*>/gi, "\n\n")
    .replace(/<\s*p(?:\s+[^>]*)?>/gi, "")
    .replace(/<\s*em\s*>/gi, "*")
    .replace(/<\s*\/em\s*>/gi, "*")
    .replace(/<\s*strong\s*>/gi, "**")
    .replace(/<\s*\/strong\s*>/gi, "**")
    .replace(/<\s*\/?div(?:\s+[^>]*)?>/gi, "\n\n")
    .replace(/<\s*\/?section(?:\s+[^>]*)?>/gi, "\n\n")
    .replace(/<[^>]+>/g, "");
}

function splitMarkdownBlocks(markdown = "") {
  return cleanRawHtmlFromMarkdown(markdown)
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(Boolean);
}

function blockToHtml(block) {
  block = cleanRawHtmlFromMarkdown(block).trim();

  if (/^#{1,6}\s*/.test(block)) {
    const level = Math.min((block.match(/^#+/) || ["###"])[0].length + 2, 6);
    return `<h${level}>${inlineMarkdown(block.replace(/^#{1,6}\s*/, ""))}</h${level}>`;
  }

  if (/^>\s?/.test(block)) {
    const quote = block.replace(/^>\s?/gm, "");
    return `<blockquote>${inlineMarkdown(quote).replace(/\n/g, "<br>")}</blockquote>`;
  }

  return `<p>${inlineMarkdown(block).replace(/\n/g, "<br>")}</p>`;
}

function displayPoem(markdown) {
  const blocks = splitMarkdownBlocks(markdown).filter(block => !/^#\s+/.test(block));
  const html = blocks.map(block => {
    if (/^#{2,6}\s*/.test(block)) {
      return `<h3 class="reading-subtitle">${inlineMarkdown(block.replace(/^#{1,6}\s*/, ""))}</h3>`;
    }

    return `<div class="poem-stanza">${block
      .split("\n")
      .map(line => `<span>${inlineMarkdown(line)}</span>`)
      .join("")}</div>`;
  }).join("");

  return `<section class="reading-layout poem-reading" aria-label="Poem reading">${html}</section>`;
}

function displayBook(markdown, title, author) {
  const blocks = splitMarkdownBlocks(markdown).filter(block => !/^#\s+/.test(block));
  const html = blocks.map((block, index) => {
    if (/^#{2,6}\s*/.test(block)) {
      return `<h3 class="book-chapter-title">${inlineMarkdown(block.replace(/^#{1,6}\s*/, ""))}</h3>`;
    }

    const paragraph = blockToHtml(block);
    return index === 0 ? paragraph.replace('<p>', '<p class="lead-paragraph">') : paragraph;
  }).join("");

  return `
    <section class="reading-layout book-reading" aria-label="Book reading">
      <div class="reading-content">${html}</div>
    </section>
  `;
}

function displayThought(markdown) {
  const blocks = splitMarkdownBlocks(markdown).filter(block => !/^#\s+/.test(block));
  const html = blocks.map(block => {
    if (/^#{2,6}\s*/.test(block)) {
      return `<h3 class="reading-subtitle">${inlineMarkdown(block.replace(/^#{1,6}\s*/, ""))}</h3>`;
    }

    return `<p class="thought-line">${inlineMarkdown(block).replace(/\n/g, "<br>")}</p>`;
  }).join("");

  return `<section class="reading-layout thought-reading" aria-label="Thought reading">${html}</section>`;
}

function displayLetter(markdown, author) {
  const blocks = splitMarkdownBlocks(markdown).filter(block => !/^#\s+/.test(block));
  const html = blocks.map(block => blockToHtml(block)).join("");

  return `
    <section class="reading-layout letter-reading" aria-label="Letter reading">
      <div class="reading-content">
        ${html}
        <p class="letter-signature">— ${escapeHtml(author)}</p>
      </div>
    </section>
  `;
}

function displayStandardPiece(markdown) {
  return `<section class="reading-layout standard-reading"><div class="reading-content">${splitMarkdownBlocks(markdown).map(blockToHtml).join("")}</div></section>`;
}

function markdownToReadingHtml(markdown, type = "piece", title = "", author = "") {
  const normalizedType = String(type).toLowerCase();

  if (normalizedType.includes("poem")) return displayPoem(markdown);
  if (normalizedType.includes("book") || normalizedType.includes("story")) return displayBook(markdown, title, author);
  if (normalizedType.includes("thought") || normalizedType.includes("phrase") || normalizedType.includes("fragment")) return displayThought(markdown);
  if (normalizedType.includes("letter")) return displayLetter(markdown, author);

  return displayStandardPiece(markdown);
}

function createPreview(text, maxLength = 360) {
  const normalized = String(text || "").trim();
  if (normalized.length <= maxLength) return normalized;
  const trimmed = normalized.slice(0, maxLength).trim();
  const lastBreak = Math.max(trimmed.lastIndexOf(". "), trimmed.lastIndexOf("? "), trimmed.lastIndexOf("! "), trimmed.lastIndexOf("\n"));
  return `${trimmed.slice(0, lastBreak > 120 ? lastBreak + 1 : trimmed.length).trim()}...`;
}

function postToMarkdown(post) {
  const title = `# ${post.title}`;
  const body = Array.isArray(post.body) ? post.body.join("\n\n") : String(post.body || "");
  return `${title}\n\n${body}`;
}

function titleCase(value = "") {
  return String(value)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function estimateReadTime(text = "") {
  const words = String(text).trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 220))} min read`;
}

function parseMarkdownPiece(markdown, filePath) {
  const piece = parseMarkdownFragment(markdown, filePath);
  const normalizedMarkdown = String(markdown || "").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const bodyContent = stripMarkdownFrontmatter(normalizedMarkdown).trim();
  const date = piece.date || "1970-01-01";

  return {
    ...piece,
    moods: piece.moods,
    mood: piece.moods.join(", "),
    type: titleCase(piece.type || "Fragment"),
    readTime: piece.readTime || estimateReadTime(piece.text),
    excerpt: piece.excerpt || createPreview(piece.text, 170),
    date,
    html: markdownToReadingHtml(bodyContent, piece.type, piece.title, piece.author),
    source: filePath
  };
}

async function loadArchive() {
  const loadedPosts = await Promise.all(
    archiveFiles.map(async filePath => {
      const response = await fetch(encodeURI(filePath));
      if (!response.ok) throw new Error(`Could not load ${filePath}`);
      const markdown = await response.text();
      return parseMarkdownPiece(markdown, filePath);
    })
  );

  return loadedPosts.sort((a, b) => safeDateValue(b.date) - safeDateValue(a.date));
}

function parseMarkdownFragment(markdown, filePath) {
  const normalizedMarkdown = String(markdown || "").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const frontmatterMatch = normalizedMarkdown.match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/);
  const frontmatter = {};
  let content = stripMarkdownFrontmatter(normalizedMarkdown).trim();

  if (frontmatterMatch) {

    frontmatterMatch[1].split("\n").forEach(line => {
      const [rawKey, ...rawValue] = line.split(":");
      if (!rawKey || !rawValue.length) return;

      const key = rawKey.trim();
      const value = rawValue.join(":").trim();

      if (value.startsWith("[") && value.endsWith("]")) {
        frontmatter[key] = value
          .slice(1, -1)
          .split(",")
          .map(item => item.trim().replace(/^[\'"]|[\'"]$/g, ""))
          .filter(Boolean);
      } else {
        frontmatter[key] = value.replace(/^[\'"]|[\'"]$/g, "");
      }
    });
  }

  const cleanContent = cleanRawHtmlFromMarkdown(content)
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/[_*`>]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const title = frontmatter.title || filePath.split("/").pop().replace(".md", "").replaceAll("-", " ");
  const author = frontmatter.author || (filePath.includes("challotte") ? "Challotte" : filePath.includes("sister") ? "Sister" : "Unknown");
  const moods = Array.isArray(frontmatter.mood)
    ? frontmatter.mood
    : Array.isArray(frontmatter.moods)
      ? frontmatter.moods
      : frontmatter.mood
        ? [frontmatter.mood]
        : ["Fragment"];
  const mood = moods.join(", ");
  const type = frontmatter.type || filePath.split("/").slice(-2, -1)[0] || "Fragment";
  const readTime = frontmatter.readTime || frontmatter.readtime || "";
  const date = frontmatter.date || frontmatter.published || "1970-01-01";
  const excerpt = frontmatter.excerpt || "";
  const slug = frontmatter.slug || filePath.replace(/^\.\//, "").replace(/\.md$/, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return {
    slug,
    title,
    author,
    mood,
    moods,
    type,
    readTime,
    date,
    excerpt,
    text: cleanContent,
    preview: createPreview(cleanContent),
    html: markdownToReadingHtml(content, type, title, author)
  };
}

async function loadFragments() {
  return posts.filter(post => String(post.source || "").includes("/fragments/"));
}

async function renderFragments() {
  fragmentGrid.innerHTML = `<p class="small">Loading fragments...</p>`;

  try {
    loadedFragmentsCache = await loadFragments();
    fragmentGrid.innerHTML = "";

    loadedFragmentsCache.forEach(fragment => {
      const article = document.createElement("article");
      article.className = `fragment-card ${typeClass(fragment.type)}`;
      article.innerHTML = `
        <div>
          <p class="post-meta">${fragment.author} · ${fragment.type} · ${fragment.mood}${fragment.readTime ? ` · ${fragment.readTime}` : ""}</p>
          <h3>${fragment.title}</h3>
          <blockquote class="fragment-preview">${fragment.preview}</blockquote>
        </div>
        <button class="read-button" type="button" data-fragment-slug="${fragment.slug}">Read more</button>
      `;
      fragmentGrid.appendChild(article);
    });
  } catch (error) {
    fragmentGrid.innerHTML = `
      <article class="fragment-card">
        <blockquote>Fragments could not be loaded. Run the site through a local server instead of opening index.html directly.</blockquote>
        <footer>Example: python -m http.server 5500</footer>
      </article>
    `;
    console.error(error);
  }
}

function openReader({ title, meta, type, html, note }) {
  playSound("open");
  reader.className = `reader-view ${typeClass(type)}`;
  readerTitle.textContent = title;
  readerMeta.textContent = "";
  readerBody.innerHTML = html;
  readerAuthor.innerHTML = note || "";
  reader.setAttribute("aria-hidden", "false");
  reader.scrollIntoView({ behavior: "smooth", block: "start" });
  document.body.classList.add("reader-open");
}

function openFragment(slug) {
  const fragment = loadedFragmentsCache.find(item => item.slug === slug);
  if (!fragment) return;

  openReader({
    title: fragment.title,
    meta: "",
    type: fragment.type,
    html: fragment.html,
    note: ""
  });
}

function openPost(slug) {
  const post = posts.find(item => item.slug === slug);
  if (!post) return;

  openReader({
    title: post.title,
    meta: "",
    type: post.type,
    html: post.html,
    note: ""
  });
}

function closeReader() {
  if (reader.getAttribute("aria-hidden") === "false") playSound("close");
  reader.setAttribute("aria-hidden", "true");
  reader.className = "reader-view";
  readerTitle.textContent = "";
  readerMeta.textContent = "";
  readerBody.innerHTML = "";
  readerAuthor.innerHTML = "";
  document.body.classList.remove("reader-open");
  document.querySelector("#library").scrollIntoView({ behavior: "smooth", block: "start" });
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(dateString));
}

async function init() {
  featuredPosts.innerHTML = `<p class="small">Loading archive...</p>`;
  libraryPosts.innerHTML = `<p class="small">Loading archive...</p>`;

  try {
    posts = await loadArchive();
  } catch (error) {
    console.error(error);
    featuredPosts.innerHTML = `<p class="post-card">The archive could not be loaded. Run the site through a local server instead of opening index.html directly.</p>`;
    libraryPosts.innerHTML = `<p class="post-card">Example: python -m http.server 5500</p>`;
    fragmentGrid.innerHTML = `<p class="post-card">Fragments could not be loaded because the Markdown archive is unavailable.</p>`;
    posts = [];
  }

  populateSelect(authorFilter, uniqueValues(posts.map(post => post.author)));
  populateSelect(typeFilter, plannedContentTypes);
  populateSelect(moodFilter, uniqueValues(posts.flatMap(post => post.moods)));

  renderFeatured();
  renderLibrary();
  renderFragments();

  [authorFilter, typeFilter, moodFilter].forEach(select => select.addEventListener("change", () => {
    playSound("tick");
    renderLibrary();
  }));

  document.addEventListener("click", event => {
    const readButton = event.target.closest("[data-slug]");
    const fragmentButton = event.target.closest("[data-fragment-slug]");
    const closeButton = event.target.closest("[data-close-reader]");
    const authorLink = event.target.closest("[data-author-link]");
    const soundTrigger = event.target.closest("[data-sound]");

    if (soundTrigger) playSound(soundTrigger.dataset.sound);
    if (readButton) openPost(readButton.dataset.slug);
    if (fragmentButton) openFragment(fragmentButton.dataset.fragmentSlug);
    if (closeButton) closeReader();
    if (authorLink) {
      playSound("tick");
      authorFilter.value = authorLink.dataset.authorLink;
      typeFilter.value = "all";
      moodFilter.value = "all";
      renderLibrary();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeReader();
  });

  setSoundToggleState();

  themeToggles.forEach(toggle => {
    toggle.addEventListener("click", () => {
      applyTheme(currentTheme === "dark" ? "light" : "dark");
      playSound("tick");
    });
  });

  soundToggles.forEach(toggle => {
    toggle.addEventListener("click", () => {
      soundEnabled = !soundEnabled;
      localStorage.setItem("writersSound", soundEnabled ? "on" : "off");
      setSoundToggleState();
      if (soundEnabled) {
        getAudioContext();
        tone({ frequency: 420, duration: 0.08, type: "triangle", gain: 0.018 });
        tone({ frequency: 560, duration: 0.08, type: "triangle", gain: 0.014, delay: 0.06 });
      }
    });
  });

  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  navToggle.addEventListener("click", () => {
    playSound("tick");
    const isOpen = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", () => {
    nav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
}

init();
