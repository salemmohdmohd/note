# Notes

A personal reading and note library: a folder of markdown files, plus a small
static web app that makes them pleasant to read on a phone.

No backend, no database, no build step. The whole app is `index.html`, one
stylesheet and three scripts, hosted on GitHub Pages straight from the
repository.

## How it works

```
notes/**.md   →   GitHub Pages   →   phone browser
```

1. The reader asks the GitHub API for the list of `.md` files under `notes/`.
2. It builds a folder tree and a search index from those paths.
3. When you open a note, it fetches that one file and renders the markdown.

Note bodies are never downloaded to build the sidebar or to search, so the app
stays fast whether the library holds ten notes or a thousand. See
[what gets downloaded](#what-gets-downloaded) for the numbers.

## Setup

### 1. Publish it

Settings → Pages → Build and deployment:

- **Source**: Deploy from a branch
- **Branch**: `main`, folder `/ (root)`

The site appears at `https://<your-username>.github.io/<repo>/` a minute later.
Add it to your phone's home screen and it behaves like an app.

The repository needs to be **public** for GitHub Pages on a free account, and
the reader's file listing also relies on public API access.

### 2. Custom domain (optional)

The reader works out which repository to query from the URL, which only works on
`*.github.io`. On a custom domain, set the repository explicitly in
[`js/config.js`](js/config.js):

```js
window.NOTE_APP_CONFIG = {
  repo: 'your-username/your-repo',
  // ...
};
```

## Adding notes

Notes are files. Add them however you add files to a repository:

- **Phone**: the **New note** button in the sidebar opens GitHub's editor with
  the path pre-filled.
- **Computer**: create the `.md` file, commit, push.
- **AI agent**: point it at [`AGENTS.md`](AGENTS.md), which describes the
  conventions it should follow.

Refresh the page and the note is there. Nothing is compiled or deployed.

### Naming matters

The reader derives titles and its search index from file paths, so filenames do
real work:

```
notes/reading/why-postgres-beats-mongo-for-this.md   →   "Why Postgres Beats Mongo For This"
```

Lowercase kebab-case. A file called `note-3.md` is effectively unfindable.

### Optional front matter

```markdown
---
title: A Title That Differs From The Filename
tags: [rust, performance]
---

# Heading
```

`title` and `tags` are used once a note has been opened, and are remembered for
search afterwards. They are optional; the filename is what search relies on.

## Layout

```
index.html               App shell
css/style.css            Layout, themes, reading typography
js/config.js             Repository, branch, folders — edit this
js/notes.js              File discovery, caching, folder tree, front matter
js/render.js             Fetch a note, render and sanitise markdown
js/app.js                Routing, sidebar, search, theme
AGENTS.md                Conventions for AI agents organising the library
notes/                   All content
  README.md              The page shown when the app opens
  inbox/                 Unsorted captures
  reading/               In progress, with nested topic folders
  archive/               Finished
notes-manifest.json      Optional fallback file list
```

## What gets downloaded

| What | Size | When |
| --- | --- | --- |
| App shell (HTML, CSS, JS) | a few KB | First visit, then browser-cached |
| `marked` + `DOMPurify` from jsDelivr | ~57 KB | First visit, then browser-cached |
| File list | ~250 bytes per note | Once, then cached until you commit again |
| A note body | 2–50 KB | Only when you open that note |

The file list is cached in `localStorage` against the latest commit SHA, so a
return visit costs one tiny request to check the SHA and nothing more. A library
of a few hundred notes produces a file list well under 100 KB.

### Search is deliberately not full-text

Searching note *contents* would mean downloading every note. Instead search
covers filenames, folder paths, and the tags of notes you have already opened.
That keeps search instant and free at any library size — and it is why
descriptive filenames and sensible folders matter.

## Local development

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. On `localhost` the repository cannot be
detected from the URL, so the reader falls back to
[`notes-manifest.json`](notes-manifest.json) for its file list. Either keep that
file current, or set `repo` in `js/config.js` while developing.

## Reliability notes

- **Rate limits.** Unauthenticated GitHub API access allows 60 requests per hour
  per IP. Normal use costs one or two. If the limit is hit, the reader keeps
  serving its cached file list and says so in the sidebar.
- **Offline.** Previously visited notes come from the browser's HTTP cache, and
  the file list from `localStorage`.
- **CDN unavailable.** If jsDelivr cannot be reached, notes render as plain text
  rather than failing. To remove the dependency entirely, download
  `marked.min.js` and `purify.min.js` into a `vendor/` folder and point the two
  `<script>` tags in `index.html` at them.
- **Private repository.** The file list needs a token, which cannot be embedded
  in a public static page safely. Keep the repository public, or maintain
  `notes-manifest.json` and serve the notes some other way.

## Browser support

Any current version of Safari, Chrome or Firefox, on desktop or mobile. The app
uses no framework and no build tooling, so there is nothing to keep up to date
beyond the two CDN libraries.
