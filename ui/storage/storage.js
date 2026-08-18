/**
 * Storage Management System for Writers Archive
 * Uses IndexedDB for persistent local storage
 */

const DB_NAME = 'WritersArchive';
const DB_VERSION = 1;
const STORE_NAME = 'pieces';

class ArchiveStorage {
  constructor() {
    this.db = null;
    this.isReady = false;
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
      request.onsuccess = () => {
        this.db = request.result;
        this.isReady = true;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'slug' });
          store.createIndex('author', 'author', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('date', 'date', { unique: false });
        }
      };
    });
  }

  /**
   * Save a piece to IndexedDB
   */
  async savePiece(piece) {
    if (!this.isReady) await this.init();

    // Add sync tracking fields if not present
    if (!piece.syncStatus) piece.syncStatus = 'local';
    if (!piece.syncedAt) piece.syncedAt = null;
    if (!piece.lastModified) piece.lastModified = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(piece);

      request.onerror = () => reject(new Error('Failed to save piece'));
      request.onsuccess = () => resolve(piece);
    });
  }

  /**
   * Get a piece by slug
   */
  async getPiece(slug) {
    if (!this.isReady) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(slug);

      request.onerror = () => reject(new Error('Failed to get piece'));
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  /**
   * Get all pieces
   */
  async getAllPieces() {
    if (!this.isReady) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(new Error('Failed to get all pieces'));
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  /**
   * Get pieces by author
   */
  async getPiecesByAuthor(author) {
    if (!this.isReady) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('author');
      const request = index.getAll(author);

      request.onerror = () => reject(new Error('Failed to get pieces by author'));
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  /**
   * Delete a piece by slug
   */
  async deletePiece(slug) {
    if (!this.isReady) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(slug);

      request.onerror = () => reject(new Error('Failed to delete piece'));
      request.onsuccess = () => resolve(true);
    });
  }

  /**
   * Clear all pieces (use with caution)
   */
  async clearAll() {
    if (!this.isReady) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(new Error('Failed to clear database'));
      request.onsuccess = () => resolve(true);
    });
  }

  /**
   * Get count of pieces
   */
  async getPieceCount() {
    if (!this.isReady) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      request.onerror = () => reject(new Error('Failed to count pieces'));
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Export all pieces as JSON
   */
  async exportData() {
    const pieces = await this.getAllPieces();
    return JSON.stringify(pieces, null, 2);
  }

  /**
   * Import pieces from JSON
   */
  async importData(jsonData) {
    const pieces = JSON.parse(jsonData);
    const saved = [];
    for (const piece of pieces) {
      await this.savePiece(piece);
      saved.push(piece.slug);
    }
    return saved;
  }
}

// Create global instance
const archiveStorage = new ArchiveStorage();
