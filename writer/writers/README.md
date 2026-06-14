# Writers / Subconscious Prints

A static literary archive for two writers.

## Run locally

```bash
python -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

## Writing types

Each Markdown file can choose a display style through the `type` field in the frontmatter.

```md
---
title: "Scars"
author: "Challotte"
type: "Poem"
mood: ["Survival", "Memory"]
date: "2026-06-13"
readTime: "1 min read"
---
```

Supported types:

```text
Poem
Book
Story
Thought
Phrase
Fragment
Letter
```

## Clean display rules

The site now uses different reading structures without turning the full piece into fake textboxes.

- `Poem`: preserves line breaks and stanza spacing.
- `Book` / `Story`: uses a clean article layout with chapter headings.
- `Thought` / `Phrase` / `Fragment`: uses larger reflective lines with breathing room.
- `Letter`: uses calm paragraph spacing and a signature at the end.

## Markdown guidance

### Poem

Use short lines and blank lines between stanzas.

```md
# Title

first line
second line
third line

next stanza line
next stanza line
```

### Book / Story

Use `##` headings for chapters or sections.

```md
## Chapter 1 — The Beginning

Paragraph one.

Paragraph two.
```

### Thought / Phrase / Fragment

Use one idea per paragraph. Shorter paragraphs look better.

```md
A thought can be one sentence.

Or it can breathe across two lines.
```

### Letter

Write it like a normal letter. The site adds the author signature automatically.

```md
Dear someone,

I kept this sentence for too long.

Now I am leaving it here.
```

## Archive loading

The Library no longer uses hardcoded sample posts. `script.js` now loads Markdown files listed in `archiveFiles` from the `challotte` and `sister` folders.

When a new piece is added, save it as a `.md` file inside the correct writer folder and add its path to `archiveFiles` near the top of `script.js`.

`Recently preserved` now shows the 3 newest pieces from both writers, sorted by the frontmatter `date` field.
