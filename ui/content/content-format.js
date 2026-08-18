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
        frontmatter[key] = value.slice(1, -1).split(",").map(item => item.trim().replace(/^[\'\"]|[\'\"]$/g, "")).filter(Boolean);
      } else {
        frontmatter[key] = value.replace(/^[\'\"]|[\'\"]$/g, "");
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
