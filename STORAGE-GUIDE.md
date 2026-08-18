# Writers Archive - Local Storage Setup Guide

## Overview

This updated version of the Writers archive has been restructured to use **IndexedDB** for local content storage instead of serving files from the filesystem. This allows:

- ✅ Writers to upload content directly through the browser
- ✅ Support for PDF files (automatically converted to Markdown)
- ✅ Persistent storage in the browser's local database
- ✅ No need to manually manage folder structures
- ✅ Easy content management through an admin panel

## System Architecture

### New Components

1. **storage.js** - IndexedDB management system
   - Handles all database operations
   - Persistent storage across sessions
   - Import/export functionality

2. **pdf-converter.js** - PDF to Markdown conversion
   - Uses PDF.js library to extract text from PDFs
   - Automatically adds frontmatter with metadata
   - Estimates reading time and generates excerpts

3. **admin-panel.js** - Writer admin interface
   - Upload interface for new content
   - Content management (view, edit, delete)
   - Sync server archive to IndexedDB

4. **styles.css** - Updated with admin panel styling
   - Responsive admin panel UI
   - Dark mode support
   - Mobile-friendly design

## Getting Started

### Running the Local Server

The project still requires a local server (same as before):

```bash
# Python 3
npm start

# Python 2
python -m SimpleHTTPServer 5500

# Node.js (if you have http-server installed)
node backend/server.js
```

Then open: `http://localhost:5500/`

### First Time Setup

1. **Open the Admin Panel**
   - Click the **⚙️ Admin** button in the header navigation

2. **Sync Server Content** (if upgrading from file-based system)
   - Go to the "Upload Content" tab
   - Click **"Sync Server Archive"**
   - This will load all pieces from the `server-side/content/` directory into IndexedDB
   - Your content is now stored locally in the browser

### Adding New Content

#### Via PDF Upload

1. Open the **Admin Panel** (⚙️ button)
2. Select the **writer** (Challotte or Inathi Booi)
3. Click the **file input** and select a PDF
4. Fill in the details:
   - **Title** - auto-populated from PDF filename
   - **Type** - content category (Poem, Fragment, Essay, etc.)
   - **Date** - defaults to today
   - **Mood tags** - select relevant moods for categorization
   - **Excerpt** - optional preview text (auto-generated if blank)
5. Click **"Upload & Save"**

#### Via Markdown Upload

1. Open the **Admin Panel**
2. Select the **writer**
3. Upload a `.md` file with YAML frontmatter
4. Frontmatter example:

```markdown
---
title: "My Piece"
author: "Challotte"
type: "Poem"
mood: ["Memory", "Softness"]
date: "2026-08-18"
readTime: "3 min read"
excerpt: "A brief preview of the piece..."
---

Content goes here...
```

#### Via Plain Text Upload

1. Upload a `.txt` file
2. The system will automatically add frontmatter
3. Fill in the metadata form

### Managing Content

1. Open the **Admin Panel**
2. Go to the **"Manage Content"** tab
3. View all stored pieces
4. Delete pieces with the **Delete** button
5. Edit functionality coming soon

## Data Storage Details

### Where is Content Stored?

All content is stored in the browser's **IndexedDB** database:
- Database name: `WritersArchive`
- Store name: `pieces`
- Indexes: author, type, date

### Browser Compatibility

- ✅ Chrome/Chromium 24+
- ✅ Firefox 16+
- ✅ Safari 10+
- ✅ Edge (all versions)
- ✅ Opera 15+

### Storage Limits

Most browsers allow 50MB-500MB of IndexedDB storage per origin. For a literary archive, this is more than enough.

## Content Metadata

Each piece stored includes:

```javascript
{
  slug: "unique-identifier",
  title: "Piece Title",
  author: "Challotte",
  type: "Poem",
  moods: ["Memory", "Softness"],
  mood: "Memory, Softness",
  date: "2026-08-18",
  readTime: "2 min read",
  excerpt: "Brief preview...",
  preview: "Longer preview for listing...",
  text: "Plain text content",
  html: "<section>...</section>", // Formatted HTML for reading
  source: "admin/challotte/uploaded/1234567890.md"
}
```

## Content Types Supported

- Book
- Essay
- Fragment
- Letter
- Poem
- Reflection
- Story
- Thought

## Mood Tags (Suggested)

- Becoming
- Grief
- Home
- Hope
- Loneliness
- Love
- Memory
- Rage
- Silence
- Softness
- Survival
- Unspoken

## FAQ

### Q: How do I back up my content?

**A:** Use browser DevTools or implement export functionality. The admin panel includes export methods.

### Q: Can multiple devices access the same content?

**A:** Not directly. IndexedDB is browser-specific. You can export and re-import on another device.

### Q: What happens if I clear browser data?

**A:** IndexedDB will be cleared. Keep backups of important content.

### Q: How do I migrate back to file-based storage?

**A:** Export your content as JSON and manually create `.md` files in the appropriate folders.

### Q: Can I edit existing pieces?

**A:** Edit functionality is coming soon. For now, delete and re-upload.

## Troubleshooting

### Content not loading

1. Make sure you're using a local server (not opening file:// directly)
2. Open DevTools (F12) and check the Console for errors
3. Try syncing server archive again

### PDF upload fails

1. Make sure PDF.js library is loaded (check DevTools Network tab)
2. Try a simpler PDF file first
3. Check browser console for specific error messages

### Admin panel doesn't appear

1. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
2. Check that all script files loaded (DevTools Network tab)
3. Verify JavaScript is enabled in your browser

## Advanced Usage

### Accessing IndexedDB Directly

In the browser console:

```javascript
// Get all pieces
archiveStorage.getAllPieces().then(pieces => console.log(pieces));

// Get pieces by author
archiveStorage.getPiecesByAuthor('Challotte').then(pieces => console.log(pieces));

// Export all data
archiveStorage.exportData().then(json => console.log(json));

// Clear all (be careful!)
archiveStorage.clearAll();
```

### Custom Mood Tags

Modify the mood suggestions in `admin-panel.js`:

```javascript
const moodSuggestions = {
  'Poem': ['Memory', 'Grief', 'Love', 'Hope'],
  // Add or modify here
};
```

## Deployment

When deploying to production:

1. All content is stored locally in each visitor's browser
2. No backend database needed
3. No server-side changes required
4. Standard static hosting works fine (GitHub Pages, Netlify, etc.)
5. Each writer uses their own device to add content

## File Structure

```
writers/
├── index.html           # Main HTML (updated with admin panel)
├── script.js            # Updated to use IndexedDB
├── styles.css           # Updated with admin panel styles
├── storage.js           # IndexedDB management (NEW)
├── pdf-converter.js     # PDF to Markdown conversion (NEW)
├── admin-panel.js       # Admin UI and logic (NEW)
├── firebase.js          # Firebase config (existing)
├── package.json
├── README.md            # Original README
├── STORAGE-GUIDE.md     # This file (NEW)
└── challotte/           # Original files (can be deleted after sync)
    └── ...
```

## Next Steps

1. ✅ Initial setup complete
2. 🔜 Add password protection to admin panel
3. 🔜 Implement cloud backup functionality
4. 🔜 Add in-browser piece editing
5. 🔜 Create writer collaboration features

## Support

For issues or questions:
1. Check the browser console (F12 > Console)
2. Review this guide
3. Check the original README.md
4. Test with a simple text file first

---

**Version:** 2.0 (Local Storage Edition)  
**Last Updated:** 2026-08-18
