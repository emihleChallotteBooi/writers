function isPaginatedType(type = "") {
  const normalizedType = String(type).toLowerCase();
  return ["book", "story", "essay", "reflection", "letter"].some(name => normalizedType.includes(name));
}

function getPageLengthTarget(type = "") {
  const normalizedType = String(type).toLowerCase();
  if (normalizedType.includes("letter")) return 1500;
  if (normalizedType.includes("book") || normalizedType.includes("story")) return 2400;
  return 1900;
}

function getChaptersPerReaderPage(type = "") {
  const normalizedType = String(type).toLowerCase();
  if (normalizedType.includes("book") || normalizedType.includes("story")) return 2;
  return 0;
}

function groupReaderSections(items = []) {
  const groups = [];
  let current = null;

  items.forEach(item => {
    const isHeading = /^H[1-6]$/.test(item.tagName);
    const html = item.outerHTML;
    const length = Math.max(90, item.textContent.trim().length);

    if (isHeading) {
      if (current && current.items.length) groups.push(current);
      current = { items: [html], length, isChapter: true };
      return;
    }

    if (!current) current = { items: [], length: 0, isChapter: false };
    current.items.push(html);
    current.length += length;
  });

  if (current && current.items.length) groups.push(current);

  if (groups.length > 1 && !groups[0].isChapter && groups[0].length < 420) {
    groups[1].items = [...groups[0].items, ...groups[1].items];
    groups[1].length += groups[0].length;
    groups.shift();
  }

  return groups;
}

function buildReaderPages(html = "", type = "piece") {
  if (!isPaginatedType(type)) return [html];

  const template = document.createElement("template");
  template.innerHTML = html.trim();
  const layout = template.content.querySelector(".reading-layout");
  const content = template.content.querySelector(".reading-content") || layout;
  if (!layout || !content) return [html];

  const items = Array.from(content.children);
  if (items.length <= 4) return [html];

  const targetLength = getPageLengthTarget(type);
  const chaptersPerPage = getChaptersPerReaderPage(type);
  const groups = groupReaderSections(items);
  if (groups.length <= 1) return [html];

  const hasChapterGroups = groups.some(group => group.isChapter);
  const pages = [];
  let currentGroups = [];
  let currentLength = 0;
  let currentChapters = 0;

  const pushPage = () => {
    if (!currentGroups.length) return;
    pages.push(currentGroups.map(group => group.items.join("")).join(""));
    currentGroups = [];
    currentLength = 0;
    currentChapters = 0;
  };

  groups.forEach(group => {
    const groupChapters = group.isChapter ? 1 : 0;
    const wouldExceedChapterLimit = chaptersPerPage > 0
      && hasChapterGroups
      && group.isChapter
      && currentChapters > 0
      && currentChapters + groupChapters > chaptersPerPage;

    const wouldExceedLength = chaptersPerPage === 0
      && currentGroups.length > 0
      && currentLength + group.length > targetLength;

    if (wouldExceedChapterLimit || wouldExceedLength) pushPage();

    currentGroups.push(group);
    currentLength += group.length;
    currentChapters += groupChapters;
  });

  pushPage();

  if (pages.length <= 1) return [html];

  const layoutClasses = layout.className || "reading-layout";
  const contentClasses = content.className || "";
  const contentIsLayout = content === layout;

  return pages.map(page => {
    if (contentIsLayout) return `<section class="${layoutClasses}">${page}</section>`;
    return `<section class="${layoutClasses}"><div class="${contentClasses}">${page}</div></section>`;
  });
}

function renderReaderPage(direction = "next") {
  const { pages, current, paginated } = readerPageState;
  if (!pages.length) return;

  readerPageSurface.classList.remove("turn-next", "turn-prev");
  void readerPageSurface.offsetWidth;
  readerPageSurface.classList.add(direction === "prev" ? "turn-prev" : "turn-next");

  readerBody.innerHTML = pages[current];
  readerPagination.hidden = !paginated;
  readerPageStatus.textContent = `Page ${current + 1} of ${pages.length}`;

  const prev = readerPagination.querySelector("[data-reader-prev]");
  const next = readerPagination.querySelector("[data-reader-next]");
  if (prev) prev.disabled = current === 0;
  if (next) next.disabled = current >= pages.length - 1;
}

function turnReaderPage(direction) {
  if (!readerPageState.paginated) return;
  const nextIndex = readerPageState.current + direction;
  if (nextIndex < 0 || nextIndex >= readerPageState.pages.length) return;
  readerPageState.current = nextIndex;
  playPaperSound();
  renderReaderPage(direction < 0 ? "prev" : "next");
  reader.scrollIntoView({ behavior: "smooth", block: "start" });
}

function openReader({ title, meta, type, html, note }) {
  playPaperSound();
  const pages = buildReaderPages(html, type);
  readerPageState = { pages, current: 0, type, paginated: pages.length > 1 };
  reader.className = `reader-view ${typeClass(type)} ${pages.length > 1 ? "is-paginated" : ""}`;
  readerTitle.textContent = title;
  readerMeta.textContent = meta;
  readerAuthor.innerHTML = note || "";
  reader.setAttribute("aria-hidden", "false");
  renderReaderPage("next");
  reader.scrollIntoView({ behavior: "smooth", block: "start" });
}

function openPost(slug) {
  const post = posts.find(item => item.slug === slug);
  if (!post) return;
  openReader({
    title: post.title,
    meta: `${post.author} · ${post.type} · ${post.readTime}`,
    type: post.type,
    html: post.html,
    note: `<p>Written by ${escapeHtml(post.author)}.</p>`
  });
}

function openFragment(slug) {
  const fragment = loadedFragmentsCache.find(item => item.slug === slug) || posts.find(item => item.slug === slug);
  if (!fragment) return;
  openReader({
    title: fragment.title,
    meta: `${fragment.author} · ${fragment.type} · ${fragment.readTime}`,
    type: fragment.type,
    html: fragment.html,
    note: `<p>Written by ${escapeHtml(fragment.author)}.</p>`
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
  readerPagination.hidden = true;
  readerPageStatus.textContent = "Page 1 of 1";
  readerPageState = { pages: [], current: 0, type: "piece", paginated: false };
  readerAuthor.innerHTML = "";
  const target = lastRouteTarget === "writerProfile" ? writerProfile : $("#library");
  if (play && target) target.scrollIntoView({ behavior: "smooth", block: "start" });
}
