# Quick Start Checklist

## Prerequisites ✓
- [x] Python 3 or Node.js installed (for local server)
- [x] Modern web browser (Chrome, Firefox, Safari, Edge)
- [x] Project files in place
- [ ] Firebase credentials (optional for cloud sync)

## Setup Steps

### Step 1: Start Local Server
```bash
# From the project directory, run:
npm start
# or if Python 3 isn't in PATH:
node backend/server.js
```

### Step 2: Open in Browser
Navigate to: `http://localhost:5500/`

### Step 3: Access Admin Panel
Click the **⚙️ Admin** button in the top navigation

### Step 4: Choose Writing Method

#### Option A: Write Directly in Browser (Recommended)
1. Go to **✏️ Compose** tab
2. Write your piece directly
3. Click **💾 Save to Archive**

#### Option B: Upload Files
1. Go to **📤 Upload** tab
2. Upload PDF, Markdown, or text files
3. Fill in metadata
4. Click **Upload & Save**

#### Option C: Sync Server Archive (First Time)
1. Go to **📤 Upload** tab
2. Click **"Sync Server Archive"** (if upgrading)

### Step 5: Optional - Enable Cloud Backup
1. Go to **⚙️ Settings** tab
2. Enable "Cloud Sync"
3. Content saves locally **instantly**
4. Auto-syncs to cloud every 30 seconds
5. See sync status in header: ✓ Synced, ⊙ Pending, etc.

## Hybrid Local/Cloud System

```
You Write ──> Instant Local Save ──> Auto Cloud Backup
              (IndexedDB)            (Every 30 sec)
```

**Key Benefits:**
- ✅ Write offline, sync when online
- ✅ No waiting for cloud (instant local save)
- ✅ Automatic backup (no manual action needed)
- ✅ Works without cloud (cloud is optional)

## File Requirements for Upload

### For Markdown Files (.md)
Must include YAML frontmatter:
```markdown
---
title: "Your Title"
author: "Challotte"
type: "Poem"
mood: ["Memory", "Softness"]
date: "2026-08-18"
readTime: "2 min read"
excerpt: "Brief preview"
---

Your content here...
```

### For PDF Files
Just select the file - the system will:
- Extract text automatically
- Create frontmatter
- Calculate reading time

### For Plain Text Files (.txt)
Just the content - frontmatter will be auto-generated

## Verify Installation

- [ ] Admin button visible in navigation
- [ ] Can click admin button and panel opens
- [ ] Can see ✏️ Compose tab
- [ ] Can write and save content
- [ ] New content appears in Library
- [ ] Sync status shows in admin header

## Common Issues

| Issue | Solution |
|-------|----------|
| Admin button not visible | Hard refresh (Ctrl+F5) |
| Can't upload file | Make sure you selected a writer first |
| PDF upload fails | Check browser console for errors |
| Changes don't save | Start backend API with `npm start` |
| Cloud sync not working | Firebase not configured (optional - works without it) |

## Next: Explore Features

- [x] Write or upload content in admin panel
- [ ] Try uploading a PDF
- [ ] Try uploading a Markdown file with frontmatter
- [ ] Filter content in the Library
- [ ] View content in the Reader
- [ ] Try dark mode toggle
- [ ] Try Reading Room ambience
- [ ] Enable cloud sync (optional)

## Documentation

- **[STORAGE-GUIDE.md](STORAGE-GUIDE.md)** - Local storage details
- **[CLOUD-SYNC-GUIDE.md](CLOUD-SYNC-GUIDE.md)** - Cloud backup setup
- **[README.md](README.md)** - Project overview

## Support

1. **Something not working?**
   - Open DevTools: F12 or Right-click → Inspect
   - Go to Console tab
   - Look for error messages
   - Report with the error text

2. **Need more help?**
   - Read [STORAGE-GUIDE.md](STORAGE-GUIDE.md) for local storage details
   - Read [CLOUD-SYNC-GUIDE.md](CLOUD-SYNC-GUIDE.md) for cloud setup
   - Check [README.md](README.md) for project overview

---

**You're all set! Start adding content to your archive.** 📝✨

**With hybrid cloud sync, your work is always safe—locally AND in the cloud.** ☁️🔒

