# Writers / Subconscious Prints — Orange Archive + Micro-Sound Edition

A simple static HTML/CSS/JS website for a two-writer literary archive.

## What changed in this version

- Added restrained burnt-orange accents.
- Added subtle old-computer/archive details.
- Added window-style archive panels.
- Added an optional sound toggle in the navigation.
- Added small generated micro-sounds for buttons, filters, post open/close, and About.
- Kept the overall mood quiet, literary, and readable.
- Still no login, no database, no build step, and no external audio files.

## Sound behavior

Sound is off by default. Readers must click `Sound Off` to turn it on.

The sounds are generated with the browser Web Audio API inside `script.js`, so there are no `.mp3` or `.wav` files to manage and no audio path issues.

## File structure

Keep these files in the same folder:

```txt
index.html
styles.css
script.js
README.md
```

Open `index.html` in a browser.

## Editing content

Posts and fragments are currently stored in `script.js`.
Later, this can be replaced with Markdown, MDX, a CMS, or a database.
