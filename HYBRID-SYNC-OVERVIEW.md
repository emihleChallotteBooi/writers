# Hybrid Local-First Cloud Sync ☁️

## What is It?

A two-tier storage system that keeps your work **safe and fast**:

### Tier 1: Local Storage (IndexedDB) 🏠
- **Where**: Browser's local database
- **Speed**: Instant (no waiting)
- **Availability**: Works offline
- **Purpose**: Primary data store

### Tier 2: Cloud Storage (Firebase) ☁️
- **Where**: Cloud servers (optional)
- **Speed**: Background sync (30-sec intervals)
- **Availability**: Requires internet
- **Purpose**: Backup & sync across devices

## How It Works

```
Timeline of Writing & Saving:

10:15:30 AM
You write something
         ↓
10:15:30 AM + 1ms
Saves to IndexedDB immediately ✓
User sees: "Saved!"
         ↓
10:15:30 AM + 5 sec (background)
Starts cloud upload (doesn't block)
User can keep writing
         ↓
10:15:35 AM
Uploaded to Firebase ✓
Sync status updates: "✓ Synced"
```

## Key Features

### 1. Local-First (Instant Feedback)
✅ Write offline, sync when online  
✅ No waiting for cloud  
✅ Works anywhere with or without internet  

### 2. Automatic Cloud Backup
✅ Syncs every 30 seconds  
✅ No manual action needed  
✅ Happens in background (doesn't interrupt writing)  

### 3. Manual Sync Option
✅ "Sync Now" button in Settings  
✅ Force immediate upload if needed  
✅ Useful before submitting to someone  

### 4. Pull from Cloud
✅ Restore pieces from cloud backup  
✅ Sync to new device  
✅ Access shared archive  

### 5. Sync Status Indicator
✅ Real-time status in admin panel header  
✅ See: ✓ Synced, ⊙ Pending, ⟳ Syncing, ⊗ Offline  

## Use Cases

### Case 1: Normal Writing Session
```
1. Open admin → Compose tab
2. Write your piece
3. Click "Save to Archive"
4. Content saved to IndexedDB immediately ✓
5. Background sync uploads to cloud ✓
```
**Result**: Content in 2 places, no waiting!

### Case 2: Writing Offline
```
1. Write piece while offline
2. Click "Save to Archive"
3. Saves to IndexedDB ✓
4. Marked as "pending" sync
5. When connection returns, auto-syncs ✓
```
**Result**: No data loss, everything backed up!

### Case 3: Urgent Backup
```
1. Wrote something important
2. Go to Settings tab
3. Click "Sync Now"
4. Forces immediate cloud upload ✓
```
**Result**: Peace of mind!

### Case 4: Recover from Device Crash
```
1. Old device crashed (data locally deleted)
2. Open archive on new device
3. Go to Settings tab
4. Click "Pull from Cloud"
5. All synced pieces restored ✓
```
**Result**: Nothing lost!

## Storage Status

Each piece tracked with sync status:

| Status | Meaning | Action |
|--------|---------|--------|
| `local` | Only on this device | Will sync soon |
| `pending` | Queued to upload | Waiting for internet/sync |
| `synced` | In local AND cloud | Fully backed up ✓ |

## Sync Status Display

### In Admin Header (Real-Time)
```
✓ Synced        (All pieces backed up to cloud)
⊙ Pending       (Some pieces waiting to sync)
⟳ Syncing       (Currently uploading)
⊗ Offline       (No internet connection)
○ Local         (Cloud sync disabled)
```

### In Settings Tab (Detailed)
```
Total pieces: 42
Synced: 40
Pending: 2
Status: Online
Last sync: 10:15 AM today
```

## Without Firebase (Standalone Mode)

Cloud sync is **optional**. The archive works perfectly without it:

✅ Write and save locally  
✅ All storage features work  
✅ Just no cloud backup  

**Good for:**
- Private local-only archives
- Testing/development
- Low-tech environments

## With Firebase (Full Hybrid)

Cloud backup enabled:

✅ Local-first writing (instant)  
✅ Automatic cloud backup (30-sec sync)  
✅ Works offline  
✅ Backup across devices  

**Good for:**
- Important collections
- Multi-device access
- Safety/redundancy

## Network Scenarios

### Scenario 1: Good Internet ✓
```
Write → Instant save to local
     → Auto-sync in 30 sec
Result: Content in 2 places
```

### Scenario 2: Intermittent Connection ◐
```
Write → Instant save to local ✓
     → Sync fails (no internet)
     → Auto-retry when online ✓
Result: No data loss
```

### Scenario 3: Offline ⊗
```
Write → Instant save to local ✓
     → Queued to sync
     → Waits for connection
     → Auto-syncs when online ✓
Result: Works great offline!
```

### Scenario 4: No Connection Setup ✗
```
Cloud sync disabled
Write → Instant save to local ✓
     → (No cloud attempt)
Result: Standalone archive
```

## Data Locations

### Local (IndexedDB)
- Location: Browser
- Persistence: Browser storage (survives restart)
- Size limit: 50MB-500MB
- Cleared by: User clearing browser data
- Access: This device only

### Cloud (Firebase)
- Location: Google servers
- Persistence: Cloud storage (persists across devices)
- Size limit: 1GB free tier
- Cleared by: User deletes in Firestore
- Access: All devices with sync enabled

## Conflict Resolution

**What if the same piece is edited in 2 places?**

On "Pull from Cloud":
1. **Cloud is newer** → Use cloud version
2. **Local is newer** → Keep local (will sync up)

Result: Latest version always wins, no data loss.

## Privacy & Security

### Local Storage
- Only on your device
- Your browser, your rules
- Not shared anywhere (unless you upload)

### Cloud Storage
- Firebase servers (Google infrastructure)
- Depends on your security rules
- Can be private (auth required) or public
- Encrypted in transit

**Recommended**: Start with cloud, add auth if you want privacy.

## Bandwidth Usage

Very minimal:

- **First sync**: Full piece content (text only)
- **Subsequent syncs**: Only changed pieces
- **Auto-sync**: Happens in background, not noticed

For a 1000-piece archive:
- Initial: ~5-10 MB
- Per sync: ~100 KB (new pieces only)

## Best Practices

### 1. Enable Cloud Sync Early
- Enables immediate backup
- Don't lose work to crashes
- Easy multi-device sync

### 2. Manual "Sync Now" Before Sharing
```
1. Finish writing
2. Go to Settings
3. Click "Sync Now"
4. Wait for ✓ Synced
5. Then share/export
```

### 3. Regular "Pull from Cloud"
- Weekly pull ensures latest
- Catches any cloud-only pieces
- Keeps devices in sync

### 4. Export Periodically
```javascript
// Browser console
const json = await archiveStorage.exportData();
// Save json locally as backup
```

### 5. Monitor Sync Status
- Check header status regularly
- Fix "Pending" pieces with "Sync Now"
- Notice offline indicator, expect delay

## Advanced: Monitoring

### Browser Console Commands

Check sync status:
```javascript
await cloudSync.getSyncStatus();
// Shows: total, synced, pending, isOnline, lastSync
```

See pending pieces:
```javascript
const all = await archiveStorage.getAllPieces();
all.filter(p => p.syncStatus === 'pending');
```

Force sync:
```javascript
await cloudSync.manualSync();
```

Check if online:
```javascript
cloudSync.isOnline  // true or false
```

## Troubleshooting

### "Pending" stuck?

1. Check internet connection
2. Check Firebase credentials
3. Check Firestore security rules
4. Try "Sync Now" manually
5. Check browser console for errors

### Cloud sync not starting?

1. Firebase not configured? → Add credentials to `firebase.js`
2. Cloud sync disabled? → Enable in Settings tab
3. Offline? → Waits for connection

### Lost a piece?

1. Check IndexedDB locally
   ```javascript
   const all = await archiveStorage.getAllPieces();
   console.log(all);
   ```
2. Check Firebase cloud
   ```javascript
   const snap = await firebase.firestore().collection('pieces').get();
   console.log(snap.docs.length);
   ```
3. Pull from cloud if needed

## Summary

**Hybrid = Best of Both Worlds:**

- 🏠 **Local**: Speed + Offline + Control
- ☁️ **Cloud**: Backup + Sync + Safety

**No compromise. Always fast. Always backed up.**

---

See **[CLOUD-SYNC-GUIDE.md](CLOUD-SYNC-GUIDE.md)** for detailed setup.

**Version**: 2.1 (Hybrid Local/Cloud)  
**Last Updated**: 2026-08-18
