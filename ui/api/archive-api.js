/**
 * Load archive from server API and cache in IndexedDB
 */
async function loadArchive() {
  try {
    // Initialize storage for local cache
    await archiveStorage.init();

    // Primary source: backend server API
    try {
      const response = await fetch(SERVER_ARCHIVE_ENDPOINT, { cache: "no-store" });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);

      const serverArchive = await response.json();
      if (!Array.isArray(serverArchive)) {
        throw new Error("Invalid server archive payload");
      }

      const loadedPosts = serverArchive
        .filter(item => item && typeof item.filePath === "string" && typeof item.markdown === "string")
        .map(item => parseMarkdownFragment(item.markdown, item.filePath));

      // Cache server result locally for resilience/offline fallback
      for (const post of loadedPosts) {
        await archiveStorage.savePiece(post);
      }

      console.log(`Loaded ${loadedPosts.length} pieces from server API`);
      return loadedPosts.sort((a, b) => safeDateValue(b.date) - safeDateValue(a.date));
    } catch (serverError) {
      console.warn("Server load failed, falling back to IndexedDB cache:", serverError);
    }

    // Static hosting fallback: Netlify and similar hosts do not run Express.
    try {
      const response = await fetch(STATIC_ARCHIVE_ENDPOINT, { cache: "no-store" });
      if (!response.ok) throw new Error(`Static archive returned ${response.status}`);

      const staticArchive = await response.json();
      if (!Array.isArray(staticArchive)) throw new Error("Invalid static archive payload");

      const loadedPosts = staticArchive
        .filter(item => item && typeof item.filePath === "string" && typeof item.markdown === "string")
        .map(item => parseMarkdownFragment(item.markdown, item.filePath));

      for (const post of loadedPosts) {
        await archiveStorage.savePiece(post);
      }

      console.log(`Loaded ${loadedPosts.length} pieces from static archive`);
      return loadedPosts.sort((a, b) => safeDateValue(b.date) - safeDateValue(a.date));
    } catch (staticError) {
      console.warn("Static archive load failed, falling back to IndexedDB cache:", staticError);
    }

    // Fallback source: cached local pieces
    const storedCount = await archiveStorage.getPieceCount();
    if (storedCount > 0) {
      const loadedPosts = await archiveStorage.getAllPieces();
      console.log(`Loaded ${storedCount} cached pieces from IndexedDB`);
      return loadedPosts.sort((a, b) => safeDateValue(b.date) - safeDateValue(a.date));
    }

    throw new Error("No server archive available and no local cache found");
  } catch (error) {
    console.error("Archive loading error:", error);
    throw error;
  }
}
