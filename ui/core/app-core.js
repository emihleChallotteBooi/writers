const SERVER_ARCHIVE_ENDPOINT = "/api/archive";
const STATIC_ARCHIVE_ENDPOINT = "./archive.json";

const authors = {
  Challotte: {
    key: "challotte",
    name: "Challotte",
    image: "./ui/assets/authors/challotte.jpg",
    themes: ["Memory", "Silence", "Becoming", "Identity", "Softness"],
    short: "Writes from memory, silence, becoming, and the private thoughts that rarely survive being spoken.",
    intro: "Challotte writes from the space between memory, silence, and becoming. Her work explores identity, emotional inheritance, private thoughts, softness, grief, and the strange tenderness of being human."
  },
  Sister: {
    key: "sister",
    name: "Inathi Booi",
    image: "./ui/assets/authors/sister.jpg",
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
let readerPageState = { pages: [], current: 0, type: "piece", paginated: false };
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
const readerPageSurface = $("#readerPageSurface");
const readerPagination = $("#readerPagination");
const readerPageStatus = $("#readerPageStatus");
const readerAuthor = $("#readerAuthor");
