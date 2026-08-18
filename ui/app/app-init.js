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
    const previousPageButton = event.target.closest("[data-reader-prev]");
    const nextPageButton = event.target.closest("[data-reader-next]");

    if (soundTrigger) playPaperSound();
    if (previousPageButton) turnReaderPage(-1);
    if (nextPageButton) turnReaderPage(1);
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
    if (reader.getAttribute("aria-hidden") === "false") {
      if (event.key === "ArrowRight") turnReaderPage(1);
      if (event.key === "ArrowLeft") turnReaderPage(-1);
    }
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
    featuredPosts.innerHTML = `<article class="empty-state">The archive could not be loaded. Start the backend server with npm start.</article>`;
    libraryPosts.innerHTML = `<article class="empty-state">Example: npm start</article>`;
    fragmentGrid.innerHTML = `<article class="empty-state">Fragments could not be loaded because the server archive is unavailable.</article>`;
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

// Keep globally expected hooks for admin-panel.js
window.parseMarkdownFragment = parseMarkdownFragment;
window.formatDate = formatDate;
window.renderFeatured = renderFeatured;
window.renderLibrary = renderLibrary;
window.renderFragments = renderFragments;

init();
