---
title: Agent Guide
tags: [meta, conventions]
---

# Agent Guide

This repository is a personal reading and note library. The `.md` files under
`notes/` are the content; the HTML, CSS and JS at the root are a static reader
that displays them. There is no backend and no build step.

If you are an AI agent helping to organise this library, follow the rules below.

## The one rule that matters most

**Filenames are the searchable titles.** The reader builds its sidebar and its
search index from file paths alone, so it never has to download every note just
to let me find something. That only works if filenames describe the content.

- Good: `why-postgres-beats-mongo-for-this.md`, `sourdough-hydration-notes.md`
- Bad: `note-3.md`, `untitled.md`, `tmp.md`, `article.md`

Use lowercase kebab-case: words separated by hyphens, no spaces, no capitals.
The reader turns `why-rust-is-fast.md` into "Why Rust Is Fast" for display.

## Folders

Folders are the taxonomy. Put a note where I would look for it.

| Folder | Holds |
| --- | --- |
| `notes/inbox/` | Newly captured things not yet sorted. Default destination when unsure. |
| `notes/reading/` | Longer pieces I am working through, plus nested topic folders. |
| `notes/archive/` | Finished or superseded notes I still want to keep. |

Create new folders freely when a topic earns one, and nest them when it helps
(`notes/reading/books/`, `notes/reading/papers/`). Keep folder names in
lowercase kebab-case too — the reader title-cases them for display.

Do not create a folder for a single note. Move notes into a new folder once
three or four of them share a theme.

## Front matter

Optional. When present it must be the very first thing in the file:

```markdown
---
title: A Title That Differs From The Filename
tags: [rust, performance]
source: https://example.com/original-article
---
```

- `title` overrides the filename-derived title once the note is opened.
- `tags` become searchable after the note has been opened at least once.
- Any other keys are ignored by the reader but are fine to include.

Front matter is a nice-to-have. A descriptive filename matters more, because it
works without downloading the file.

## Writing a note

- Start the body with a single `# Heading`. The reader promotes it to the page
  title, so it will not appear twice.
- Use `##` and `###` for structure. Headings get anchor ids automatically.
- Link between notes with ordinary relative markdown links:
  `[see also](../inbox/other-note.md)`. The reader rewrites these to stay
  in-app.
- For a saved article, record the source URL in front matter or as a link near
  the top, so I can find the original later.

## Adding a note

1. Create the `.md` file in the right folder under `notes/`.
2. Append its path to the `paths` array in `notes-manifest.json`, keeping the
   list sorted. This is the offline and rate-limit fallback; the reader works
   without it but degrades less gracefully when it is stale.
3. Commit to `main`. The published reader picks the note up on the next load —
   there is nothing to build or deploy.

## Reorganising

When moving or renaming notes:

- Use `git mv` so history follows the file.
- Update `notes-manifest.json` to match.
- Grep for the old path and fix any relative links in other notes that pointed
  at it, otherwise the reader will show "Note not found".

## Do not

- Add a backend, database, framework or build step. The reader must stay
  openable as plain files.
- Rename or restructure `notes/` wholesale without being asked. Old links,
  including ones I have bookmarked on my phone, are paths into this tree.
- Commit large binaries. Small images next to the note that uses them are fine.
