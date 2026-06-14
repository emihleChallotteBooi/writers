const posts = [
  {
    title: "The Things I Never Said",
    slug: "the-things-i-never-said",
    author: "Challotte",
    type: "Personal Essay",
    moods: ["Unspoken", "Memory"],
    date: "2026-06-12",
    readTime: "4 min read",
    featured: true,
    excerpt: "Some thoughts do not disappear. They wait in the body until language becomes safe enough to hold them.",
    body: [
      "There are sentences I swallowed so many times they started to feel like organs. They lived quietly under my ribs, learning the rhythm of my breathing.",
      "I used to think silence was the opposite of speech. Now I think silence is a room where every unsaid thing keeps growing furniture.",
      "This is me opening the door slowly, not because I am fearless, but because I am tired of leaving myself outside."
    ]
  },
  {
    title: "A House That Knows My Name",
    slug: "a-house-that-knows-my-name",
    author: "Sister",
    type: "Story",
    moods: ["Home", "Survival"],
    date: "2026-06-10",
    readTime: "5 min read",
    featured: true,
    excerpt: "Every room remembered a version of her she was trying to outgrow.",
    body: [
      "The house knew her name, but it never said it gently. It held every argument in the walls and every apology under the floorboards.",
      "At night, she walked through the passage like a guest in her own childhood, touching the doors without opening them.",
      "Leaving was not a betrayal. It was the first honest sentence her body had ever written."
    ]
  },
  {
    title: "Becoming Without Witnesses",
    slug: "becoming-without-witnesses",
    author: "Challotte",
    type: "Reflection",
    moods: ["Becoming", "Hope"],
    date: "2026-06-08",
    readTime: "3 min read",
    featured: true,
    excerpt: "Growth does not always arrive loudly. Sometimes it looks like choosing yourself in private.",
    body: [
      "There is a kind of becoming that no one claps for. It happens between ordinary mornings, in decisions too small to photograph.",
      "You stop explaining your pain to people committed to misunderstanding it. You stop shrinking the future so the past can recognize you.",
      "And one day, without ceremony, you belong to yourself a little more."
    ]
  },
  {
    title: "Soft Rage",
    slug: "soft-rage",
    author: "Sister",
    type: "Poem",
    moods: ["Rage", "Softness"],
    date: "2026-06-04",
    readTime: "2 min read",
    featured: false,
    excerpt: "Anger can arrive quietly and still rearrange the room.",
    body: [
      "I am not loud today, but do not mistake this for peace.",
      "There is a fire learning manners inside me. There is a door I will not keep holding open.",
      "Softness was never surrender. It was the cloth around the blade."
    ]
  },
  {
    title: "Notes From a Quiet Morning",
    slug: "notes-from-a-quiet-morning",
    author: "Challotte",
    type: "Thought",
    moods: ["Silence", "Softness"],
    date: "2026-06-01",
    readTime: "2 min read",
    featured: false,
    excerpt: "The day began softly, as if it did not want to interrupt what I was becoming.",
    body: [
      "Morning arrived without demanding anything from me. For once, the light did not feel like evidence.",
      "I made tea. I sat near the window. I let myself be a person without turning it into a performance.",
      "Maybe peace begins as something ordinary enough to miss."
    ]
  },
  {
    title: "What We Carry Home",
    slug: "what-we-carry-home",
    author: "Sister",
    type: "Letter",
    moods: ["Love", "Grief"],
    date: "2026-05-28",
    readTime: "4 min read",
    featured: false,
    excerpt: "A letter to the people we love and the versions of us they could not protect.",
    body: [
      "I am writing this to the child who thought love meant staying quiet enough to keep everyone comfortable.",
      "You carried too much home in your hands. None of it was shaped like childhood, but you held it anyway.",
      "I hope you learn that love does not need your disappearance to survive."
    ]
  }
];

const fragmentFiles = [
  "./challotte/fragments/scars.md",
  "./sister/fragments/where-the-light-forgot-me.md"
];

const authorFilter = document.querySelector("#authorFilter");
const typeFilter = document.querySelector("#typeFilter");
const moodFilter = document.querySelector("#moodFilter");
const libraryPosts = document.querySelector("#libraryPosts");
const featuredPosts = document.querySelector("#featuredPosts");
const fragmentGrid = document.querySelector("#fragmentGrid");
const modal = document.querySelector("#postModal");
const modalTitle = document.querySelector("#modalTitle");
const modalMeta = document.querySelector("#modalMeta");
const modalBody = document.querySelector("#modalBody");
const modalAuthor = document.querySelector("#modalAuthor");

const soundToggle = document.querySelector("#soundToggle");
let soundEnabled = localStorage.getItem("writersSound") === "on";
let audioContext;

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
  if (!soundToggle) return;
  soundToggle.textContent = soundEnabled ? "Sound On" : "Sound Off";
  soundToggle.classList.toggle("is-on", soundEnabled);
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  soundToggle.setAttribute(
    "aria-label",
    soundEnabled ? "Turn website micro-sounds off" : "Turn website micro-sounds on"
  );
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

function postCard(post, compact = false) {
  const article = document.createElement("article");
  article.className = "post-card";
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
  posts.filter(post => post.featured).slice(0, 3).forEach(post => {
    featuredPosts.appendChild(postCard(post, true));
  });
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
    libraryPosts.innerHTML = `<p class="post-card">No pieces match this filter yet.</p>`;
    return;
  }

  filtered.forEach(post => libraryPosts.appendChild(postCard(post)));
}

function parseMarkdownFragment(markdown, filePath) {
  const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---\n?/);
  const frontmatter = {};
  let content = markdown.trim();

  if (frontmatterMatch) {
    content = markdown.slice(frontmatterMatch[0].length).trim();

    frontmatterMatch[1].split("\n").forEach(line => {
      const [rawKey, ...rawValue] = line.split(":");
      if (!rawKey || !rawValue.length) return;

      const key = rawKey.trim();
      const value = rawValue.join(":").trim();

      if (value.startsWith("[") && value.endsWith("]")) {
        frontmatter[key] = value
          .slice(1, -1)
          .split(",")
          .map(item => item.trim().replace(/^['"]|['"]$/g, ""))
          .filter(Boolean);
      } else {
        frontmatter[key] = value.replace(/^['"]|['"]$/g, "");
      }
    });
  }

  const cleanContent = content
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[_*`>]/g, "")
    .replace(/\n{2,}/g, " ")
    .trim();

  return {
    title: frontmatter.title || filePath.split("/").pop().replace(".md", ""),
    author: frontmatter.author || "Unknown",
    mood: Array.isArray(frontmatter.mood) ? frontmatter.mood.join(", ") : frontmatter.mood || "Fragment",
    text: cleanContent
  };
}

async function loadFragments() {
  const loadedFragments = await Promise.all(
    fragmentFiles.map(async filePath => {
      const response = await fetch(filePath);
      if (!response.ok) throw new Error(`Could not load ${filePath}`);
      const markdown = await response.text();
      return parseMarkdownFragment(markdown, filePath);
    })
  );

  return loadedFragments;
}

async function renderFragments() {
  fragmentGrid.innerHTML = `<p class="small">Loading fragments...</p>`;

  try {
    const fragments = await loadFragments();
    fragmentGrid.innerHTML = "";

    fragments.forEach(fragment => {
      const article = document.createElement("article");
      article.className = "fragment-card";
      article.innerHTML = `
        <blockquote>${fragment.text}</blockquote>
        <footer>${fragment.author} · ${fragment.mood}</footer>
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

function openPost(slug) {
  const post = posts.find(item => item.slug === slug);
  if (!post) return;
  playSound("open");

  modalTitle.textContent = post.title;
  modalMeta.textContent = `${post.author} · ${post.type} · ${post.moods.join(", ")} · ${formatDate(post.date)} · ${post.readTime}`;
  modalBody.innerHTML = post.body.map(paragraph => `<p>${paragraph}</p>`).join("");
  modalAuthor.innerHTML = `<strong>Author note:</strong> More from ${post.author} can be explored through the Library filters.`;
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closePost() {
  if (modal.getAttribute("aria-hidden") === "false") playSound("close");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(dateString));
}

function init() {
  populateSelect(authorFilter, uniqueValues(posts.map(post => post.author)));
  populateSelect(typeFilter, uniqueValues(posts.map(post => post.type)));
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
    const closeButton = event.target.closest("[data-close-modal]");
    const authorLink = event.target.closest("[data-author-link]");
    const soundTrigger = event.target.closest("[data-sound]");

    if (soundTrigger) playSound(soundTrigger.dataset.sound);
    if (readButton) openPost(readButton.dataset.slug);
    if (closeButton) closePost();
    if (authorLink) {
      playSound("tick");
      authorFilter.value = authorLink.dataset.authorLink;
      typeFilter.value = "all";
      moodFilter.value = "all";
      renderLibrary();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closePost();
  });

  setSoundToggleState();

  if (soundToggle) {
    soundToggle.addEventListener("click", () => {
      soundEnabled = !soundEnabled;
      localStorage.setItem("writersSound", soundEnabled ? "on" : "off");
      setSoundToggleState();
      if (soundEnabled) {
        getAudioContext();
        tone({ frequency: 420, duration: 0.08, type: "triangle", gain: 0.018 });
        tone({ frequency: 560, duration: 0.08, type: "triangle", gain: 0.014, delay: 0.06 });
      }
    });
  }

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
