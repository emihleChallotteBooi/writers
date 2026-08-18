/**
 * Cloud Sync System - Hybrid Local/Cloud Storage
 * Syncs content to Firebase Firestore in the background
 * Local IndexedDB acts as the primary data store
 */

class CloudSync {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.isSyncing = false;
    this.syncQueue = [];
    this.lastSyncTime = localStorage.getItem('lastCloudSync') || null;
    this.isOnline = navigator.onLine;
    this.syncInterval = null;
  }

  /**
   * Initialize Firebase and event listeners
   */
  async init() {
    if (this.isInitialized) return;
    // Check if Firebase is available
    if (typeof firebase === 'undefined' || !firebase.firestore) {
      console.warn('Firebase not configured. Cloud sync disabled.');
      this.isInitialized = false;
      return;
    }

    try {
    constructor() {
      this.db = firebase.firestore();
      this.isInitialized = true;

      // Listen for online/offline events
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());

      // Auto-sync every 30 seconds if online
      this.startAutoSync();

      console.log('Cloud sync initialized');
      return true;
    } catch (error) {
      console.warn('Cloud sync initialization failed:', error);
      return false;
    }
  }

  /**
   * Save piece with sync tracking
   */
  async savePieceWithSync(piece) {
    // Always save to local first
    const saved = await archiveStorage.savePiece({
      ...piece,
      syncStatus: 'pending',
      syncedAt: null,
      lastModified: new Date().toISOString()
    });

    // Queue for cloud sync
    if (this.isInitialized && this.isOnline) {
      this.syncQueue.push(piece.slug);
      // Try to sync immediately
      this.performSync();
    }

    return saved;
  }

  /**
   * Perform sync of queued pieces
   */
  async performSync() {
    if (!this.isInitialized || this.isSyncing || !this.isOnline) return;
    /**

    this.isSyncing = true;
    this.updateSyncStatus('syncing');

    try {
      const allPieces = await archiveStorage.getAllPieces();
      const pendingPieces = allPieces.filter(p => p.syncStatus === 'pending');

      for (const piece of pendingPieces) {
        try {
          await this.uploadPieceToCloud(piece);
          // Mark as synced locally
          await archiveStorage.savePiece({
            ...piece,
            syncStatus: 'synced',
            syncedAt: new Date().toISOString()
          });
        } catch (error) {
          console.error(`Failed to sync ${piece.slug}:`, error);
        }
      }

      // Update last sync time
      const syncTime = new Date().toISOString();
      this.lastSyncTime = syncTime;
      localStorage.setItem('lastCloudSync', syncTime);

      this.updateSyncStatus('synced');
    } catch (error) {
      console.error('Sync error:', error);
      this.updateSyncStatus('error');
    } finally {
      this.isSyncing = false;
      this.syncQueue = [];
    }
  }

  /**
   * Upload piece to Firebase Firestore
   */
  async uploadPieceToCloud(piece) {
    if (!this.db) throw new Error('Cloud database not initialized');

    // Prepare piece data (exclude local-only fields)
    const cloudData = {
      slug: piece.slug,
      title: piece.title,
      author: piece.author,
      type: piece.type,
      moods: piece.moods,
      mood: piece.mood,
      date: piece.date,
      readTime: piece.readTime,
      excerpt: piece.excerpt,
      preview: piece.preview,
      text: piece.text,
      // Don't store HTML to save space, it's generated client-side
      source: piece.source,
      createdAt: firebase.firestore.Timestamp.fromDate(new Date(piece.date)),
      uploadedAt: firebase.firestore.Timestamp.now()
    };

    // Save to Firestore with document ID based on author and slug
    const docId = `${piece.author.toLowerCase()}-${piece.slug}`;
    await this.db.collection('pieces').doc(docId).set(cloudData, { merge: true });
  }

  /**
   * Get all synced pieces from cloud
   */
  async getPiecesFromCloud(author = null) {
    if (!this.db) return [];

    try {
      let query = this.db.collection('pieces');

      if (author) {
        // Cloud stores author as lowercase
        query = query.where('author', '==', author);
      }

      const snapshot = await query.orderBy('uploadedAt', 'desc').get();
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error fetching from cloud:', error);
      return [];
    }
  }

  /**
   * Sync specific piece immediately
   */
  async syncNow(slug) {
    if (!this.isInitialized || !this.isOnline) {
      throw new Error('Cloud sync not available (offline or not initialized)');
    }

    const piece = await archiveStorage.getPiece(slug);
    if (!piece) throw new Error('Piece not found');

    try {
      await this.uploadPieceToCloud(piece);
      await archiveStorage.savePiece({
        ...piece,
        syncStatus: 'synced',
        syncedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      throw new Error(`Sync failed: ${error.message}`);
    }
  }

  /**
   * Handle online event
   */
  handleOnline() {
    this.isOnline = true;
    this.updateSyncStatus('checking');
    // Sync any pending pieces
    this.performSync();
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    this.isOnline = false;
    this.updateSyncStatus('offline');
  }

  /**
   * Start auto-sync interval
   */
  startAutoSync() {
    if (this.syncInterval) return;
    // Sync every 30 seconds if online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.performSync();
      }
    }, 30000);
  }

  /**
   * Stop auto-sync
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Update UI sync status
   */
  updateSyncStatus(status) {
    const statusEl = document.getElementById('cloudSyncStatus');
    if (!statusEl) return;

    const statusMap = {
      'syncing': '⟳ Syncing...',
      'synced': '✓ Synced',
      'pending': '⊙ Pending...',
      'offline': '⊗ Offline',
      'error': '⚠ Sync Error',
      'checking': '◐ Checking...'
    };

    statusEl.textContent = statusMap[status] || status;
    statusEl.dataset.status = status;
  }

  /**
   * Get sync status of all pieces
   */
  async getSyncStatus() {
    const allPieces = await archiveStorage.getAllPieces();
    return {
      total: allPieces.length,
      synced: allPieces.filter(p => p.syncStatus === 'synced').length,
      pending: allPieces.filter(p => p.syncStatus === 'pending').length,
      isOnline: this.isOnline,
      lastSync: this.lastSyncTime
    };
  }

  /**
   * Force manual sync
   */
  async manualSync() {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }
    await this.performSync();
  }

  /**
   * Pull latest pieces from cloud and merge with local
   */
  async pullFromCloud(author = null) {
    if (!this.isInitialized) {
      throw new Error('Cloud sync not initialized');
    }

    try {
      const cloudPieces = await this.getPiecesFromCloud(author);

      for (const cloudPiece of cloudPieces) {
        const localPiece = await archiveStorage.getPiece(cloudPiece.slug);

        if (!localPiece) {
          // Piece only in cloud, add to local
          await archiveStorage.savePiece({
            ...cloudPiece,
            syncStatus: 'synced',
            syncedAt: new Date().toISOString()
          });
        } else if (new Date(cloudPiece.uploadedAt) > new Date(localPiece.lastModified)) {
          // Cloud version is newer, update local
          await archiveStorage.savePiece({
            ...cloudPiece,
            syncStatus: 'synced',
            syncedAt: new Date().toISOString()
          });
        }
        // If local is newer, keep local (will be synced up)
      }

      return cloudPieces.length;
    } catch (error) {
      console.error('Pull from cloud failed:', error);
      throw error;
    }
  }

  /**
   * Enable/disable cloud sync
   */
  setCloudSyncEnabled(enabled) {
    localStorage.setItem('cloudSyncEnabled', enabled ? 'true' : 'false');
    if (enabled) {
      this.init();
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }

  /**
   * Check if cloud sync is enabled
   */
  isCloudSyncEnabled() {
    return localStorage.getItem('cloudSyncEnabled') !== 'false';
  }
}

// Create global instance
const cloudSync = new CloudSync();

// Auto-initialize if enabled
document.addEventListener('DOMContentLoaded', async () => {
  if (cloudSync.isCloudSyncEnabled()) {
    await cloudSync.init();
  }
});
