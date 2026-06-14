# Writers / Subconscious Prints

A static, deployment-ready literary archive for two writers.

## Identity

- **Writers** is the outer website/platform name.
- **Subconscious Prints** is the inner literary archive and homepage identity.

The site is built to feel like a quiet, formal, two-author archive rather than a generic blog or social feed.

## Run locally

Because the archive loads Markdown files with `fetch`, open the site through a local server:

```bash
python -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

## Main features

- Warm light mode and atmospheric dark mode.
- Optional **Reading Room** ambience, kept soft and user-activated.
- Homepage with recent preserved works.
- Shared Library with filters for writer, type, and mood.
- Dedicated writer rooms:
  - `#writer/challotte`
  - `#writer/sister`
- Author portraits stored in `assets/authors/` for easy replacement.
- Formal About section.
- Custom empty states and unpreserved-page state.
- Clean full-page reader with author/date/type/read-time metadata.
- Author ownership note at the end of each reading page.

## Replacing author portraits

Replace these files and keep the same filenames:

```text
assets/authors/challotte.jpg
assets/authors/sister.jpg
```

No code changes are needed if the filenames stay the same.

## Markdown frontmatter

Use consistent metadata for each writing file:

```md
---
title: "Scars"
author: "Challotte"
type: "Poem"
mood: ["Survival", "Memory"]
date: "2026-06-13"
readTime: "1 min read"
excerpt: "A short sentence that invites the reader into the piece."
---
```

Supported content types:

```text
Book
Essay
Fragment
Letter
Poem
Reflection
Story
Thought
```

Suggested mood tags:

```text
Unspoken
Memory
Grief
Becoming
Love
Home
Loneliness
Survival
Softness
Rage
Hope
Silence
```

## Deployment checklist

Before sharing the public link:

- Replace dummy portraits if desired.
- Check all Markdown dates and author names.
- Remove placeholder content.
- Run through a local server and verify all navigation links.
- Confirm mobile layout.
- Confirm there are no missing images or console errors.
