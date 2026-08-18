# Hybrid Cloud Sync - Setup Guide

## Overview

The Writers archive now uses a **hybrid local-first approach**:

✅ **Local Storage First** - All content saved instantly to IndexedDB  
✅ **Background Cloud Sync** - Automatically synced to Firebase in the background  
✅ **Works Offline** - Continue writing even without internet  
✅ **No Data Loss** - Content exists locally before cloud backup  
✅ **Automatic & Manual Sync** - Syncs every 30 seconds OR on demand  

## Architecture

```
Writer ──> IndexedDB (Local) ──> Cloud Sync Queue ──> Firebase Firestore
            (Instant)            (Background)         (Backup)
```

### How It Works

1. **Writer composes or uploads** → Saved to IndexedDB immediately
2. **Content marked as "pending"** → Added to sync queue
3. **Auto-sync runs** (every 30 sec or when connection restored)
4. **Content uploaded to Firebase** → Marked as "synced"
5. **Sync status updated** → UI shows ✓ Synced or ⊙ Pending

## Setup Requirements

### 1. Firebase Configuration

You already have `firebase.js` in your project. Make sure it's configured:

```javascript
// firebase.js should contain:
firebase.initializeApp({
  projectId: "YOUR_PROJECT_ID",
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  // ... other config
});
```

### 2. Enable Firestore Database

In Firebase Console:
1. Go to **Firestore Database**
2. Click **Create Database**
3. Start in **production mode** (or test mode for development)
4. Choose a location
5. Create collection named **"pieces"**

### 3. Firestore Security Rules

For a public archive (recommended for this project):

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /pieces/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
      allow delete: if false;
    }
  }
}
```

For development (while testing):
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Using Cloud Sync

### Enable/Disable Cloud Sync

1. Click **⚙️ Admin** button
2. Go to **⚙️ Settings** tab
3. Toggle **"Enable Cloud Sync"**

### Manual Sync

1. Go to **⚙️ Settings** tab
2. Click **"Sync Now"** button
3. Waits for pending pieces to upload

### Pull from Cloud

1. Go to **⚙️ Settings** tab
2. Click **"Pull from Cloud"** button
3. Brings any cloud-only pieces to local storage

### View Sync Status

1. Go to **⚙️ Settings** tab
2. See:
   - Total pieces in archive
   - Number synced to cloud
   - Number pending sync
   - Last sync time
   - Connection status (Online/Offline)

### Sync Status Indicator

In the admin panel header, see real-time sync status:
- **✓ Synced** - All pieces synced to cloud
- **⊙ Pending** - Waiting to sync
- **⟳ Syncing** - Currently syncing
- **⊗ Offline** - No internet connection
- **○ Local** - Cloud sync disabled

## Sync Behavior

### Automatic Sync

- **Enabled by default** (if Firebase configured)
- Syncs every **30 seconds** if online
- Auto-retries on connection restore
- Shows status indicator in header

### Manual Sync

- Click "Sync Now" in Settings tab
- Useful if you want to backup immediately
- Shows success/error message

### Offline Mode

- Write and save content normally
- Content marked as "pending"
- Syncs automatically when connection returns
- No data loss

### Conflict Resolution

If piece modified in two places:
- **Cloud version newer** → Local updated on pull
- **Local version newer** → Keeps local (will sync up)

## Data Structure in Firebase

Each piece stored with:

```json
{
  "slug": "unique-id",
  "title": "Piece Title",
  "author": "Challotte",
  "type": "Poem",
  "moods": ["Memory", "Softness"],
  "mood": "Memory, Softness",
  "date": "2026-08-18",
  "readTime": "2 min read",
  "excerpt": "Brief preview...",
  "preview": "Longer preview...",
  "text": "Full plain text content",
  "source": "admin/challotte/composed/1234567890.md",
  "createdAt": <Timestamp>,
  "uploadedAt": <Timestamp>
}
```

Note: HTML rendering is done client-side, not stored in cloud (saves space)

## Troubleshooting

### Cloud sync not working

**Check:** Firebase configured correctly
```javascript
// In browser console
firebase.firestore().collection("pieces").get().then(snap => console.log(snap.size));
```

If error: Firebase not initialized

**Solution:** Update `firebase.js` with correct credentials

### Pieces not syncing

**Check:** Cloud sync enabled
- Go to Settings tab
- Toggle should be ON
- Status should show "Online"

**Check:** Internet connection
- Offline? Sync will resume when online

**Check:** Firestore security rules
- Make sure writes allowed
- Check browser console for permission errors

### Pull from cloud failing

**Check:** You have internet connection

**Check:** Firestore has data
```javascript
// Browser console
firebase.firestore().collection("pieces").limit(1).get().then(snap => 
  console.log('Found', snap.size, 'pieces'));
```

### Sync takes too long

Normal: Large files (especially with PDF) may take seconds

**Speed up:** Click "Sync Now" only when needed (not continuous)

## Browser Console Commands

Debug sync status:

```javascript
// Check sync status
await cloudSync.getSyncStatus();

// Check pending pieces
const all = await archiveStorage.getAllPieces();
all.filter(p => p.syncStatus === 'pending');

// Manually sync
await cloudSync.manualSync();

// Check if online
cloudSync.isOnline;

// Get last sync time
cloudSync.lastSyncTime;

// Pull from cloud
await cloudSync.pullFromCloud();
```

## Data Backup Strategy

### Local Backup
- IndexedDB stores everything locally
- Survives browser restarts
- Cleared if user deletes browser data

### Cloud Backup  
- Firebase stores all synced pieces
- Survives device failure
- Can pull to new device

### Recommended Workflow

1. **Write locally** → Instant save to IndexedDB
2. **Auto-sync** → Backs up to cloud every 30 sec
3. **Manual export** (optional) → Backup JSON locally
4. **Peace of mind** → Content in 2 places

## Advanced: Export & Import

### Export to JSON

```javascript
// Browser console
const json = await archiveStorage.exportData();
console.save(json, "archive-backup.json");
```

### Import from JSON

```javascript
// Browser console
const json = JSON.stringify([...pieces]);
await archiveStorage.importData(json);
```

## Deployment

### Firebase Hosting (Recommended)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

Automatic backup to cloud for all users!

### Static Hosting (GitHub Pages, Netlify)

Cloud sync still works if Firebase configured.
Each writer syncs their own content.

## FAQ

**Q: What happens if I clear browser data?**
A: Local storage cleared, but cloud still has synced pieces. Click "Pull from Cloud" to restore.

**Q: Can multiple devices share the same archive?**
A: Yes! Pull from cloud on new device to get synced pieces.

**Q: Is my writing private?**
A: Depends on Firestore rules. Public rules = readable by anyone. Use authentication for private.

**Q: What if internet cuts out during writing?**
A: No problem! Saves to local, syncs when connection back.

**Q: How much storage do I get?**
A: Firebase free tier: 1GB storage, 50k reads/day. More than enough for a literary archive.

---

**Next Steps:** 
1. Configure Firebase credentials in `firebase.js`
2. Create Firestore database and "pieces" collection
3. Set up security rules
4. Enable cloud sync in Admin > Settings
5. Start writing and syncing!

**Version:** 2.1 (Hybrid Local/Cloud)  
**Last Updated:** 2026-08-18
