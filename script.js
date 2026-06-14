const archiveFiles = [
  "./challotte/fragments/scars.md",
  "./challotte/story/i_wish.md",
  "./challotte/thought/i'm_a_problem.md",
  "./sister/fragments/where-the-light-forgot-me.md",
  "./sister/reflection/She_passed.md"
];

const authors = {
  Challotte: {
    key: "challotte",
    name: "Challotte",
    image: "./assets/authors/challotte.jpg",
    themes: ["Memory", "Silence", "Becoming", "Identity", "Softness"],
    short: "Writes from memory, silence, becoming, and the private thoughts that rarely survive being spoken.",
    intro: "Challotte writes from the space between memory, silence, and becoming. Her work explores identity, emotional inheritance, private thoughts, softness, grief, and the strange tenderness of being human."
  },
  Sister: {
    key: "sister",
    name: "Inathi Booi",
    image: "./assets/authors/sister.jpg",
    themes: ["Home", "Softness", "Hope", "Grief", "Observation"],
    short: "Writes through feeling, observation, and the truths people learn to hide at home.",
    intro: "Sister writes through feeling, observation, and the truths people learn to hide at home. Her work holds softness, grief, hope, and the inner weather of ordinary days."
  }
};

const plannedContentTypes = ["Book", "Essay", "Fragment", "Letter", "Poem", "Reflection", "Story", "Thought"];

let posts = [];
let loadedFragmentsCache = [];
let currentTheme = localStorage.getItem("writersTheme") === "dark" ? "dark" : "light";
let readingRoomEnabled = localStorage.getItem("writersReadingRoom") === "on";
let audioContext;
let readingRoomNodes = null;
let writerTypeFilter = "all";
let lastRouteTarget = "library";
const ARCHIVE_DISPLAY_LIMIT = 6;
const FRAGMENT_DISPLAY_LIMIT = 2;

const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

const authorFilter = $("#authorFilter");
const typeFilter = $("#typeFilter");
const moodFilter = $("#moodFilter");
const libraryPosts = $("#libraryPosts");
const featuredPosts = $("#featuredPosts");
const fragmentGrid = $("#fragmentGrid");
const writerCards = $("#writerCards");
const writerProfile = $("#writerProfile");
const writerProfileContent = $("#writerProfileContent");
const notFound = $("#notFound");
const reader = $("#reader");
const readerTitle = $("#readerTitle");
const readerMeta = $("#readerMeta");
const readerBody = $("#readerBody");
const readerAuthor = $("#readerAuthor");

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

function titleCase(value = "") {
  return String(value)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function normalizeType(type = "Fragment") {
  const normalized = titleCase(type);
  if (normalized === "Personal Essay") return "Essay";
  return normalized;
}

function safeDateValue(dateString) {
  const value = new Date(dateString || "1970-01-01").getTime();
  return Number.isNaN(value) ? 0 : value;
}

function formatDate(dateString) {
  const value = new Date(dateString || "1970-01-01");
  if (Number.isNaN(value.getTime())) return "Undated";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(value);
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function shuffledSubset(items, limit) {
  return [...items]
    .map(item => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, limit)
    .map(entry => entry.item);
}

function createPreview(text, maxLength = 300) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  const trimmed = normalized.slice(0, maxLength).trim();
  const lastBreak = Math.max(trimmed.lastIndexOf(". "), trimmed.lastIndexOf("? "), trimmed.lastIndexOf("! "));
  return `${trimmed.slice(0, lastBreak > 120 ? lastBreak + 1 : trimmed.length).trim()}...`;
}

function estimateReadTime(text = "") {
  const words = String(text).trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 220))} min read`;
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
  return `<section class="reading-layout poem-reading" aria-label="Poem reading">${blocks.map(block => {
    if (/^#{2,6}\s*/.test(block)) return `<h3 class="reading-subtitle">${inlineMarkdown(block.replace(/^#{1,6}\s*/, ""))}</h3>`;
    return `<div class="poem-stanza">${block.split("\n").map(line => `<span>${inlineMarkdown(line)}</span>`).join("")}</div>`;
  }).join("")}</section>`;
}

function displayBook(markdown) {
  const blocks = splitMarkdownBlocks(markdown).filter(block => !/^#\s+/.test(block));
  const html = blocks.map((block, index) => {
    if (/^#{2,6}\s*/.test(block)) return `<h3 class="book-chapter-title">${inlineMarkdown(block.replace(/^#{1,6}\s*/, ""))}</h3>`;
    const paragraph = blockToHtml(block);
    return index === 0 ? paragraph.replace("<p>", "<p class=\"lead-paragraph\">") : paragraph;
  }).join("");
  return `<section class="reading-layout book-reading"><div class="reading-content">${html}</div></section>`;
}

function displayThought(markdown) {
  const blocks = splitMarkdownBlocks(markdown).filter(block => !/^#\s+/.test(block));
  return `<section class="reading-layout thought-reading">${blocks.map(block => {
    if (/^#{2,6}\s*/.test(block)) return `<h3 class="reading-subtitle">${inlineMarkdown(block.replace(/^#{1,6}\s*/, ""))}</h3>`;
    return `<p class="thought-line">${inlineMarkdown(block).replace(/\n/g, "<br>")}</p>`;
  }).join("")}</section>`;
}

function displayLetter(markdown, author) {
  const blocks = splitMarkdownBlocks(markdown).filter(block => !/^#\s+/.test(block));
  return `<section class="reading-layout letter-reading"><div class="reading-content">${blocks.map(blockToHtml).join("")}<p class="letter-signature">— ${escapeHtml(author)}</p></div></section>`;
}

function displayStandardPiece(markdown) {
  return `<section class="reading-layout standard-reading"><div class="reading-content">${splitMarkdownBlocks(markdown).map(blockToHtml).join("")}</div></section>`;
}

function markdownToReadingHtml(markdown, type = "piece", author = "") {
  const normalizedType = String(type).toLowerCase();
  if (normalizedType.includes("poem")) return displayPoem(markdown);
  if (normalizedType.includes("book") || normalizedType.includes("story") || normalizedType.includes("essay") || normalizedType.includes("reflection")) return displayBook(markdown);
  if (normalizedType.includes("thought") || normalizedType.includes("phrase") || normalizedType.includes("fragment")) return displayThought(markdown);
  if (normalizedType.includes("letter")) return displayLetter(markdown, author);
  return displayStandardPiece(markdown);
}

function parseMarkdownFragment(markdown, filePath) {
  const normalizedMarkdown = String(markdown || "").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const frontmatterMatch = normalizedMarkdown.match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/);
  const frontmatter = {};
  const bodyContent = stripMarkdownFrontmatter(normalizedMarkdown).trim();

  if (frontmatterMatch) {
    frontmatterMatch[1].split("\n").forEach(line => {
      const [rawKey, ...rawValue] = line.split(":");
      if (!rawKey || !rawValue.length) return;
      const key = rawKey.trim();
      const value = rawValue.join(":").trim();
      if (value.startsWith("[") && value.endsWith("]")) {
        frontmatter[key] = value.slice(1, -1).split(",").map(item => item.trim().replace(/^[\'"]|[\'"]$/g, "")).filter(Boolean);
      } else {
        frontmatter[key] = value.replace(/^[\'"]|[\'"]$/g, "");
      }
    });
  }

  const cleanContent = cleanRawHtmlFromMarkdown(bodyContent)
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/[_*`>]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const title = frontmatter.title || titleCase(filePath.split("/").pop().replace(".md", "").replaceAll("-", " "));
  const author = frontmatter.author || (filePath.includes("challotte") ? "Challotte" : filePath.includes("sister") ? "Sister" : "Unknown");
  const moods = Array.isArray(frontmatter.mood) ? frontmatter.mood : frontmatter.mood ? [frontmatter.mood] : ["Unsorted"];
  const type = normalizeType(frontmatter.type || filePath.split("/").slice(-2, -1)[0] || "Fragment");
  const date = frontmatter.date || frontmatter.published || "1970-01-01";
  const readTime = frontmatter.readTime || frontmatter.readtime || estimateReadTime(cleanContent);
  const slug = frontmatter.slug || filePath.replace(/^\.\//, "").replace(/\.md$/, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return {
    slug,
    title,
    author,
    moods,
    mood: moods.join(", "),
    type,
    date,
    readTime,
    excerpt: frontmatter.excerpt || createPreview(cleanContent, 170),
    preview: createPreview(cleanContent, 280),
    text: cleanContent,
    html: markdownToReadingHtml(bodyContent, type, author),
    source: filePath
  };
}

async function loadArchive() {
  const loadedPosts = await Promise.all(archiveFiles.map(async filePath => {
    const response = await fetch(encodeURI(filePath));
    if (!response.ok) throw new Error(`Could not load ${filePath}`);
    const markdown = await response.text();
    return parseMarkdownFragment(markdown, filePath);
  }));
  return loadedPosts.sort((a, b) => safeDateValue(b.date) - safeDateValue(a.date));
}

function typeClass(type = "piece") {
  return `type-${String(type).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function populateSelect(select, values) {
  [...select.querySelectorAll("option:not([value='all'])")].forEach(option => option.remove());
  values.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function postCard(post, compact = false) {
  const article = document.createElement("article");
  article.className = `post-card ${typeClass(post.type)}`;
  article.dataset.type = post.type;
  article.innerHTML = `
    <div>
      <p class="post-meta">${escapeHtml(post.author)} · ${escapeHtml(post.mood)} · ${escapeHtml(post.readTime)}</p>
      <h3>${escapeHtml(post.title)}</h3>
      <p>${escapeHtml(post.excerpt)}</p>
      ${compact ? `<p class="small">${formatDate(post.date)}</p>` : ""}
    </div>
    <button class="read-button" type="button" data-slug="${escapeHtml(post.slug)}">Read piece</button>
  `;
  return article;
}

function renderFeatured() {
  featuredPosts.innerHTML = "";
  const recentlyPreserved = [...posts].sort((a, b) => safeDateValue(b.date) - safeDateValue(a.date)).slice(0, 3);
  if (!recentlyPreserved.length) {
    featuredPosts.innerHTML = `<article class="empty-state">Nothing has been preserved here yet.</article>`;
    return;
  }
  recentlyPreserved.forEach(post => featuredPosts.appendChild(postCard(post, true)));
}

function renderLibrary() {
  const selectedAuthor = authorFilter.value;
  const selectedType = typeFilter.value;
  const selectedMood = moodFilter.value;
  const filtered = posts.filter(post => {
    const authorMatch = selectedAuthor === "all" || post.author === selectedAuthor;
    const typeMatch = selectedType === "all" || post.type === selectedType;
    const moodMatch = selectedMood === "all" || post.moods.includes(selectedMood);
    return authorMatch && typeMatch && moodMatch;
  });
  libraryPosts.innerHTML = "";
  if (!filtered.length) {
    libraryPosts.innerHTML = `<article class="empty-state">Nothing preserved here yet. This part of the archive is still waiting for its first piece.</article>`;
    return;
  }
  shuffledSubset(filtered, ARCHIVE_DISPLAY_LIMIT).forEach(post => libraryPosts.appendChild(postCard(post)));
}


function renderWriterCards() {
  writerCards.innerHTML = Object.values(authors).map(author => `
    <article class="writer-card" id="${author.key}">
      <img class="author-portrait" src="${author.image}" alt="Editorial portrait placeholder for ${author.name}">
      <div class="writer-card-content">
        <h3>${author.name}</h3>
        <p>${author.short}</p>
        <p class="tag-line">${author.themes.join(" · ")}</p>
        <a href="#writer/${author.key}" class="text-link" data-sound="paper">Read ${author.name}</a>
      </div>
    </article>
  `).join("");
}

function renderFragments() {
  loadedFragmentsCache = posts.filter(post => String(post.source || "").includes("/fragments/"));
  fragmentGrid.innerHTML = "";
  if (!loadedFragmentsCache.length) {
    fragmentGrid.innerHTML = `<article class="empty-state">No fragments have been preserved yet.</article>`;
    return;
  }
  loadedFragmentsCache.slice(0, FRAGMENT_DISPLAY_LIMIT).forEach(fragment => {
    const article = document.createElement("article");
    article.className = `fragment-card ${typeClass(fragment.type)}`;
    article.dataset.type = fragment.type;
    article.innerHTML = `
      <div>
        <p class="post-meta">${escapeHtml(fragment.author)} · ${escapeHtml(fragment.mood)}</p>
        <h3>${escapeHtml(fragment.title)}</h3>
        <blockquote class="fragment-preview">${escapeHtml(fragment.preview)}</blockquote>
      </div>
      <button class="read-button" type="button" data-fragment-slug="${escapeHtml(fragment.slug)}">Read more</button>
    `;
    fragmentGrid.appendChild(article);
  });
}

function renderWriterProfile(authorKey) {
  const author = Object.values(authors).find(item => item.key === authorKey);
  if (!author) return false;

  const writerPosts = posts.filter(post => post.author === author.name && (writerTypeFilter === "all" || post.type === writerTypeFilter));
  const availableTypes = plannedContentTypes;
  writerProfileContent.innerHTML = `
    <div class="writer-profile-header">
      <img class="author-portrait" src="${author.image}" alt="Editorial portrait placeholder for ${author.name}">
      <div>
        <p class="eyebrow">Writer room</p>
        <h2>${author.name}</h2>
        <p>${author.intro}</p>
        <p class="tag-line">${author.themes.join(" · ")}</p>
      </div>
    </div>
    <div class="writer-works-heading">
      <div>
        <p class="eyebrow">Preserved works</p>
        <h2>${author.name}'s archive</h2>
      </div>
      <div class="type-tabs" aria-label="Filter ${author.name}'s work by type">
        <button class="type-tab ${writerTypeFilter === "all" ? "is-active" : ""}" type="button" data-writer-type="all">All</button>
        ${availableTypes.map(type => `<button class="type-tab ${writerTypeFilter === type ? "is-active" : ""}" type="button" data-writer-type="${type}">${type}</button>`).join("")}
      </div>
    </div>
    <div class="post-list writer-work-list" id="writerWorkList"></div>
  `;
  const list = $("#writerWorkList");
  if (!writerPosts.length) {
    list.innerHTML = `<article class="empty-state">Nothing preserved here yet. This part of ${author.name}'s archive is still waiting.</article>`;
  } else {
    shuffledSubset(writerPosts, ARCHIVE_DISPLAY_LIMIT).forEach(post => list.appendChild(postCard(post)));
  }
  return true;
}

function showAllCoreSections() {
  $$(".page-section").forEach(section => {
    section.hidden = false;
  });
  writerProfile.hidden = true;
  notFound.hidden = true;
}

function route() {
  const hash = window.location.hash || "#home";
  closeReader(false);
  if (hash.startsWith("#writer/")) {
    const key = hash.replace("#writer/", "").trim();
    $$(".page-section").forEach(section => { section.hidden = true; });
    writerProfile.hidden = false;
    notFound.hidden = true;
    if (!renderWriterProfile(key)) {
      writerProfile.hidden = true;
      notFound.hidden = false;
      lastRouteTarget = "notFound";
      notFound.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    lastRouteTarget = "writerProfile";
    writerProfile.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  showAllCoreSections();
  const target = document.querySelector(hash);
  lastRouteTarget = target ? target.id : "notFound";
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  else {
    $$(".page-section").forEach(section => { section.hidden = true; });
    notFound.hidden = false;
    notFound.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function openReader({ title, meta, type, html, note }) {
  playPaperSound();
  reader.className = `reader-view ${typeClass(type)}`;
  readerTitle.textContent = title;
  readerMeta.textContent = meta;
  readerBody.innerHTML = html;
  readerAuthor.innerHTML = note || "";
  reader.setAttribute("aria-hidden", "false");
  reader.scrollIntoView({ behavior: "smooth", block: "start" });
}

function openPost(slug) {
  const post = posts.find(item => item.slug === slug);
  if (!post) return;
  openReader({
    title: post.title,
    meta: `${post.author} · ${post.type} · ${post.mood} · ${formatDate(post.date)} · ${post.readTime}`,
    type: post.type,
    html: post.html,
    note: `<p>Written by ${escapeHtml(post.author)}. This piece belongs to its author.</p><p class="small">Source: ${escapeHtml(post.source)}</p>`
  });
}

function openFragment(slug) {
  const fragment = loadedFragmentsCache.find(item => item.slug === slug) || posts.find(item => item.slug === slug);
  if (!fragment) return;
  openReader({
    title: fragment.title,
    meta: `${fragment.author} · ${fragment.type} · ${fragment.mood} · ${formatDate(fragment.date)} · ${fragment.readTime}`,
    type: fragment.type,
    html: fragment.html,
    note: `<p>Written by ${escapeHtml(fragment.author)}. This piece belongs to its author.</p><p class="small">Source: ${escapeHtml(fragment.source)}</p>`
  });
}

function closeReader(play = true) {
  if (!reader || reader.getAttribute("aria-hidden") !== "false") return;
  if (play) playSoftTick();
  reader.setAttribute("aria-hidden", "true");
  reader.className = "reader-view";
  readerTitle.textContent = "";
  readerMeta.textContent = "";
  readerBody.innerHTML = "";
  readerAuthor.innerHTML = "";
  const target = lastRouteTarget === "writerProfile" ? writerProfile : $("#library");
  if (play && target) target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function updateReadingRoomToggles() {
  $$(".sound-toggle").forEach(toggle => {
    toggle.textContent = readingRoomEnabled ? "Reading Room: On" : "Reading Room: Off";
    toggle.classList.toggle("is-on", readingRoomEnabled);
    toggle.setAttribute("aria-pressed", String(readingRoomEnabled));
    toggle.setAttribute("aria-label", readingRoomEnabled ? "Turn reading room ambience off" : "Turn reading room ambience on");
  });
}

function updateThemeToggles() {
  document.documentElement.dataset.theme = currentTheme;
  localStorage.setItem("writersTheme", currentTheme);
  $$(".theme-toggle").forEach(toggle => {
    const isDark = currentTheme === "dark";
    toggle.textContent = isDark ? "Light Mode" : "Dark Mode";
    toggle.classList.toggle("is-on", isDark);
    toggle.setAttribute("aria-pressed", String(isDark));
  });
}

function tone({ frequency = 440, duration = 0.08, type = "sine", gain = 0.012, delay = 0 }) {
  const ctx = getAudioContext();
  if (!ctx || !readingRoomEnabled) return;
  const oscillator = ctx.createOscillator();
  const volume = ctx.createGain();
  const start = ctx.currentTime + delay;
  const end = start + duration;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  volume.gain.setValueAtTime(0.0001, start);
  volume.gain.exponentialRampToValueAtTime(gain, start + 0.018);
  volume.gain.exponentialRampToValueAtTime(0.0001, end);
  oscillator.connect(volume);
  volume.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(end + 0.02);
}

function playPaperSound() {
  const ctx = getAudioContext();
  if (!ctx || !readingRoomEnabled) return;
  const duration = 0.18;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const volume = ctx.createGain();
  filter.type = "bandpass";
  filter.frequency.value = 920;
  volume.gain.value = 0.012;
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(volume);
  volume.connect(ctx.destination);
  source.start();
}

function playSoftTick() {
  tone({ frequency: 420, duration: 0.06, type: "triangle", gain: 0.007 });
}

function startReadingRoom() {
  const ctx = getAudioContext();
  if (!ctx || readingRoomNodes) return;
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) data[i] = (Math.random() * 2 - 1) * 0.35;
  const noise = ctx.createBufferSource();
  const lowpass = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  noise.buffer = buffer;
  noise.loop = true;
  lowpass.type = "lowpass";
  lowpass.frequency.value = 420;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.018, ctx.currentTime + 1.6);
  noise.connect(lowpass);
  lowpass.connect(gain);
  gain.connect(ctx.destination);
  noise.start();
  readingRoomNodes = { noise, gain };
}

function stopReadingRoom() {
  if (!readingRoomNodes || !audioContext) return;
  const { noise, gain } = readingRoomNodes;
  gain.gain.cancelScheduledValues(audioContext.currentTime);
  gain.gain.linearRampToValueAtTime(0.0001, audioContext.currentTime + 0.7);
  setTimeout(() => {
    try { noise.stop(); } catch (error) {}
    readingRoomNodes = null;
  }, 760);
}

function setReadingRoom(enabled) {
  readingRoomEnabled = enabled;
  localStorage.setItem("writersReadingRoom", enabled ? "on" : "off");
  updateReadingRoomToggles();
  if (enabled) {
    startReadingRoom();
    tone({ frequency: 392, duration: 0.12, type: "triangle", gain: 0.01, delay: 0.02 });
  } else {
    stopReadingRoom();
  }
}

function bindEvents() {
  [authorFilter, typeFilter, moodFilter].forEach(select => select.addEventListener("change", () => {
    playSoftTick();
    renderLibrary();
  }));

  document.addEventListener("click", event => {
    const readButton = event.target.closest("[data-slug]");
    const fragmentButton = event.target.closest("[data-fragment-slug]");
    const closeButton = event.target.closest("[data-close-reader]");
    const writerTypeButton = event.target.closest("[data-writer-type]");
    const soundTrigger = event.target.closest("[data-sound]");

    if (soundTrigger) playPaperSound();
    if (readButton) openPost(readButton.dataset.slug);
    if (fragmentButton) openFragment(fragmentButton.dataset.fragmentSlug);
    if (closeButton) closeReader();
    if (writerTypeButton) {
      writerTypeFilter = writerTypeButton.dataset.writerType;
      const key = (window.location.hash || "").replace("#writer/", "");
      playSoftTick();
      renderWriterProfile(key);
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeReader();
  });

  $$(".theme-toggle").forEach(toggle => {
    toggle.addEventListener("click", () => {
      currentTheme = currentTheme === "dark" ? "light" : "dark";
      updateThemeToggles();
      playSoftTick();
    });
  });

  $$(".sound-toggle").forEach(toggle => {
    toggle.addEventListener("click", () => setReadingRoom(!readingRoomEnabled));
  });

  const navToggle = $(".nav-toggle");
  const nav = $(".site-nav");
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    playSoftTick();
  });
  nav.addEventListener("click", event => {
    if (event.target.tagName === "A") {
      nav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });

  window.addEventListener("hashchange", () => {
    writerTypeFilter = "all";
    route();
  });
}

async function init() {
  updateThemeToggles();
  updateReadingRoomToggles();
  renderWriterCards();
  featuredPosts.innerHTML = `<article class="empty-state">Loading archive...</article>`;
  libraryPosts.innerHTML = `<article class="empty-state">Loading archive...</article>`;
  fragmentGrid.innerHTML = `<article class="empty-state">Loading fragments...</article>`;

  try {
    posts = await loadArchive();
  } catch (error) {
    console.error(error);
    posts = [];
    featuredPosts.innerHTML = `<article class="empty-state">The archive could not be loaded. Run the site through a local server instead of opening index.html directly.</article>`;
    libraryPosts.innerHTML = `<article class="empty-state">Example: python -m http.server 5500</article>`;
    fragmentGrid.innerHTML = `<article class="empty-state">Fragments could not be loaded because the Markdown archive is unavailable.</article>`;
  }

  populateSelect(authorFilter, uniqueValues(posts.map(post => post.author)));
  populateSelect(typeFilter, plannedContentTypes);
  populateSelect(moodFilter, uniqueValues(posts.flatMap(post => post.moods)));
  renderFeatured();
  renderLibrary();
  renderFragments();
  bindEvents();
  route();
}

init();
