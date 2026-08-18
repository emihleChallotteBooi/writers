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
      <img class="author-portrait" src="${author.image}" alt="Portrait of ${author.name}">
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
      <img class="author-portrait" src="${author.image}" alt="Portrait of ${author.name}">
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
