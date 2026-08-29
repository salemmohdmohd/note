---
title: Start Here
tags: [meta]
---

# Start Here

This is your reading library. Every note is an ordinary `.md` file in this
repository, and this page is `notes/README.md`.

## Reading

Tap the menu button (top left on a phone) to browse folders, or use the search
box to filter by title, folder, or tag. On a keyboard, `/` jumps straight to
search.

The moon and sun button switches between light and dark. Your choice is
remembered on the device; without a choice it follows your phone's system
setting.

## Adding a note

There is no editor in the app — notes are files, and you add them the way you
add any file to a GitHub repository:

- **On your phone**: the **New note** button at the bottom of the sidebar opens
  GitHub's file editor with the path pre-filled. Change the filename, write, and
  commit.
- **On a computer**: create the file, `git commit`, `git push`.
- **With an AI agent**: point it at [the agent guide](../AGENTS.md) and ask it to
  file the note for you.

Refresh the page after committing and the note appears. There is no build step.

## Naming notes

Give files descriptive, hyphenated, lowercase names:

```
notes/reading/why-postgres-beats-mongo-for-this.md
```

The reader shows that as "Why Postgres Beats Mongo For This" and searches it.
Search only looks at filenames, folders, and tags of notes you have already
opened — never at note bodies — which is why the app stays fast no matter how
many notes pile up. Vague filenames like `note-3.md` are effectively invisible.

## Folders

Three folders come set up, and you can add as many as you like:

- [`inbox/`](inbox/) — anything captured but not yet sorted
- [`reading/`](reading/) — longer pieces, with nested topic folders
- [`archive/`](archive/) — finished, kept for reference

## What to read next

- [Markdown formatting reference](reading/markdown-formatting-reference.md) —
  every element the reader can render, useful for checking it works
- [Example captured link](inbox/example-captured-link.md) — how a saved article
  tends to look
- [Agent guide](../AGENTS.md) — the conventions an AI agent should follow when
  organising this library

Delete the example notes whenever you like; nothing depends on them.
