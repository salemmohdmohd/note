/**
 * Wiring: discovery on load, hash routing, sidebar, search, theme and the
 * mobile sidebar overlay.
 */
(function () {
  'use strict';

  var CFG = window.NOTE_APP_CONFIG || {};
  var AGENTS_FILE = CFG.agentsFile || 'AGENTS.md';
  var HOME_FILE = CFG.homeFile || 'notes/README.md';

  var THEME_KEY = 'noteapp:theme';
  var FOLDERS_KEY = 'noteapp:open-folders:v1';
  var AUTO_OPEN_LIMIT = 25;   // below this many notes, show the tree expanded
  var MAX_RESULTS = 60;
  var MOBILE_QUERY = '(max-width: 860px)';

  var state = {
    paths: [],
    tree: null,
    index: [],
    query: '',
    currentPath: null,
    source: null,
    stale: false,
    openFolders: readJson(FOLDERS_KEY) || {},
    autoOpen: true,
  };

  var els = {
    tree: document.getElementById('tree'),
    note: document.getElementById('note'),
    search: document.getElementById('search'),
    searchClear: document.getElementById('search-clear'),
    sidebar: document.getElementById('sidebar'),
    scrim: document.getElementById('scrim'),
    menuToggle: document.getElementById('menu-toggle'),
    themeToggle: document.getElementById('theme-toggle'),
    refresh: document.getElementById('refresh'),
    newNote: document.getElementById('new-note'),
    noteCount: document.getElementById('note-count'),
  };

  /* ------------------------------------------------------------------ startup */

  applyStoredTheme();
  bindEvents();
  window.addEventListener('hashchange', route);
  loadLibrary();

  function loadLibrary(options) {
    setTreeStatus('Loading notes…');

    return Notes.discover(options).then(function (result) {
      state.paths = result.paths;
      state.source = result.source;
      state.stale = result.stale;
      state.tree = Notes.buildTree(result.paths.filter(function (p) { return p !== HOME_FILE; }));
      state.index = buildSearchIndex(result.paths);
      state.autoOpen = result.paths.length <= AUTO_OPEN_LIMIT;

      renderSidebar();
      updateLibraryStatus(result);
      route();
    }).catch(function (err) {
      setTreeStatus(err.message || 'Could not load the note list.');
      renderDiscoveryError(err);
    });
  }

  /* ------------------------------------------------------------------- search */

  function buildSearchIndex(paths) {
    return paths.map(function (path) {
      var meta = Notes.getMeta(path) || {};
      var folder = path.split('/').slice(0, -1).join('/');
      var title = meta.title || Notes.titleFromPath(path);
      var tags = meta.tags || [];

      return {
        path: path,
        title: title,
        folder: folder,
        tags: tags,
        // Only path-derived text and front matter already seen, so searching
        // never triggers a download.
        haystack: (title + ' ' + path + ' ' + tags.join(' ')).toLowerCase(),
      };
    });
  }

  function search(query) {
    var terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];

    return state.index.filter(function (entry) {
      return terms.every(function (term) { return entry.haystack.indexOf(term) !== -1; });
    }).sort(function (a, b) {
      // Title matches are what people usually mean, so float them up.
      var aTitle = a.title.toLowerCase().indexOf(terms[0]) !== -1 ? 0 : 1;
      var bTitle = b.title.toLowerCase().indexOf(terms[0]) !== -1 ? 0 : 1;
      if (aTitle !== bTitle) return aTitle - bTitle;
      return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
    });
  }

  /* ------------------------------------------------------------------ sidebar */

  function renderSidebar() {
    els.tree.textContent = '';

    if (state.query) {
      renderSearchResults();
      return;
    }

    els.tree.appendChild(renderPinned());

    if (!state.tree.children.length) {
      els.tree.appendChild(emptyLibraryHint());
      return;
    }

    var heading = document.createElement('p');
    heading.className = 'tree-heading';
    heading.textContent = 'Library';
    els.tree.appendChild(heading);
    els.tree.appendChild(renderDir(state.tree));

    syncActiveLink();
  }

  function renderPinned() {
    var list = document.createElement('ul');
    list.className = 'tree-list pinned';

    if (state.paths.indexOf(HOME_FILE) !== -1) {
      list.appendChild(pinnedItem(HOME_FILE, 'Start here', 'M4 11l8-6 8 6v8a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1z'));
    }
    list.appendChild(pinnedItem(AGENTS_FILE, 'Agent guide', 'M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z'));
    return list;
  }

  function pinnedItem(path, label, iconPath) {
    var item = document.createElement('li');
    var link = document.createElement('a');
    link.className = 'tree-link';
    link.href = '#/' + path;
    link.dataset.path = path;

    link.appendChild(icon(iconPath));
    var text = document.createElement('span');
    text.className = 'tree-label';
    text.textContent = label;
    link.appendChild(text);

    item.appendChild(link);
    return item;
  }

  function renderDir(dir) {
    var list = document.createElement('ul');
    list.className = 'tree-list';

    dir.children.forEach(function (child) {
      var item = document.createElement('li');
      item.appendChild(child.type === 'dir' ? renderFolder(child) : renderFile(child));
      list.appendChild(item);
    });

    return list;
  }

  function renderFolder(node) {
    var details = document.createElement('details');
    details.className = 'folder';
    details.open = isFolderOpen(node.path);

    var summary = document.createElement('summary');
    summary.className = 'folder-summary';
    summary.appendChild(icon('M4 7a1 1 0 011-1h4l2 2h8a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1z', 'folder-icon'));

    var label = document.createElement('span');
    label.className = 'tree-label';
    label.textContent = node.title;
    summary.appendChild(label);

    var count = document.createElement('span');
    count.className = 'folder-count';
    count.textContent = String(countNotes(node));
    summary.appendChild(count);

    details.appendChild(summary);
    details.appendChild(renderDir(node));
    details.dataset.path = node.path;

    // Listening for clicks rather than the `toggle` event keeps opening a
    // folder to reveal the active note from being recorded as a preference.
    summary.addEventListener('click', function () {
      state.openFolders[node.path] = !details.open;
      writeJson(FOLDERS_KEY, state.openFolders);
    });

    return details;
  }

  function renderFile(node) {
    var link = document.createElement('a');
    link.className = 'tree-link';
    link.href = '#/' + node.path;
    link.dataset.path = node.path;

    var text = document.createElement('span');
    text.className = 'tree-label';
    text.textContent = node.title;
    link.appendChild(text);
    return link;
  }

  function renderSearchResults() {
    var results = search(state.query);

    var heading = document.createElement('p');
    heading.className = 'tree-heading';
    heading.textContent = results.length
      ? results.length + (results.length === 1 ? ' match' : ' matches')
      : 'No matches';
    els.tree.appendChild(heading);

    if (!results.length) {
      var hint = document.createElement('p');
      hint.className = 'tree-status';
      hint.textContent = 'Search covers note titles, folders, and tags of notes you have opened before.';
      els.tree.appendChild(hint);
      return;
    }

    var list = document.createElement('ul');
    list.className = 'tree-list results';

    results.slice(0, MAX_RESULTS).forEach(function (entry) {
      var item = document.createElement('li');
      var link = document.createElement('a');
      link.className = 'tree-link result';
      link.href = '#/' + entry.path;
      link.dataset.path = entry.path;

      var title = document.createElement('span');
      title.className = 'tree-label';
      title.textContent = entry.title;
      link.appendChild(title);

      var folder = document.createElement('span');
      folder.className = 'result-folder';
      folder.textContent = entry.folder;
      link.appendChild(folder);

      item.appendChild(link);
      list.appendChild(item);
    });

    els.tree.appendChild(list);

    if (results.length > MAX_RESULTS) {
      var more = document.createElement('p');
      more.className = 'tree-status';
      more.textContent = 'Showing the first ' + MAX_RESULTS + ' matches. Keep typing to narrow it down.';
      els.tree.appendChild(more);
    }

    syncActiveLink();
  }

  function countNotes(node) {
    if (node.type === 'file') return 1;
    return node.children.reduce(function (total, child) { return total + countNotes(child); }, 0);
  }

  function isFolderOpen(path) {
    if (Object.prototype.hasOwnProperty.call(state.openFolders, path)) {
      return !!state.openFolders[path];
    }
    if (state.currentPath && state.currentPath.indexOf(path + '/') === 0) return true;
    return state.autoOpen;
  }

  function emptyLibraryHint() {
    var wrap = document.createElement('p');
    wrap.className = 'tree-status';
    wrap.textContent = 'No .md files found under ' + Notes.notesDir + '/ yet.';
    return wrap;
  }

  function setTreeStatus(message) {
    els.tree.textContent = '';
    var status = document.createElement('p');
    status.className = 'tree-status';
    status.textContent = message;
    els.tree.appendChild(status);
  }

  function updateLibraryStatus(result) {
    var count = result.paths.length;
    var label = count + (count === 1 ? ' note' : ' notes');
    if (result.stale) label += ' · offline copy';
    else if (result.source === 'manifest') label += ' · from manifest';
    if (result.truncated) label += ' · list truncated by GitHub';
    els.noteCount.textContent = label;
  }

  function syncActiveLink() {
    var links = els.tree.querySelectorAll('.tree-link');
    Array.prototype.forEach.call(links, function (link) {
      var active = link.dataset.path === state.currentPath;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    if (!state.currentPath) return;

    // Reveal the active note if it sits inside collapsed folders.
    Array.prototype.forEach.call(els.tree.querySelectorAll('details.folder'), function (details) {
      if (state.currentPath.indexOf(details.dataset.path + '/') === 0) details.open = true;
    });
  }

  /* ------------------------------------------------------------------ routing */

  function parseHash() {
    var raw = window.location.hash.replace(/^#\/?/, '');
    if (!raw) return { path: '', anchor: '' };

    var hashAt = raw.indexOf('#');
    var path = hashAt === -1 ? raw : raw.slice(0, hashAt);
    var anchor = hashAt === -1 ? '' : raw.slice(hashAt + 1);

    path = decodeURIComponent(path).replace(/^\/+/, '');
    if (path && !/\.md$/i.test(path)) path += '.md';
    return { path: path, anchor: anchor };
  }

  function defaultPath() {
    if (state.paths.indexOf(HOME_FILE) !== -1) return HOME_FILE;
    if (state.paths.length) return state.paths[0];
    return AGENTS_FILE;
  }

  function route() {
    var target = parseHash();
    var path = target.path || defaultPath();

    state.currentPath = path;
    syncActiveLink();
    showLoading();

    Render.loadNote(path).then(function (note) {
      if (state.currentPath !== path) return; // a newer navigation won
      renderNote(note, target.anchor);
    }).catch(function (err) {
      if (state.currentPath !== path) return;
      renderNoteError(path, err);
    });
  }

  function showLoading() {
    els.note.textContent = '';
    var status = document.createElement('p');
    status.className = 'note-status';
    status.textContent = 'Loading…';
    els.note.appendChild(status);
  }

  function renderNote(note, anchor) {
    document.title = note.title + ' · Notes';
    els.note.textContent = '';

    els.note.appendChild(noteHeader(note));
    els.note.appendChild(note.fragment);
    els.note.appendChild(noteFooter(note));

    if (anchor) {
      var heading = document.getElementById(anchor);
      if (heading) {
        heading.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }

  function noteHeader(note) {
    var header = document.createElement('header');
    header.className = 'note-header';

    var folder = note.path.split('/').slice(0, -1).join('/');
    if (folder) {
      var crumb = document.createElement('p');
      crumb.className = 'breadcrumb';
      folder.split('/').forEach(function (segment, index) {
        if (index) crumb.appendChild(document.createTextNode(' / '));
        var span = document.createElement('span');
        span.textContent = Notes.titleFromSlug(segment);
        crumb.appendChild(span);
      });
      header.appendChild(crumb);
    }

    var title = document.createElement('h1');
    title.className = 'note-title';
    title.textContent = note.title;
    header.appendChild(title);

    var meta = document.createElement('p');
    meta.className = 'note-meta';
    meta.appendChild(document.createTextNode(note.readingMinutes + ' min read'));
    header.appendChild(meta);

    if (note.tags.length) {
      var tags = document.createElement('ul');
      tags.className = 'tag-list';
      note.tags.forEach(function (tag) {
        var item = document.createElement('li');
        var link = document.createElement('a');
        link.className = 'tag';
        link.href = '#/' + note.path;
        link.textContent = tag;
        link.addEventListener('click', function (event) {
          event.preventDefault();
          setQuery(tag);
          els.search.value = tag;
        });
        item.appendChild(link);
        tags.appendChild(item);
      });
      header.appendChild(tags);
    }

    return header;
  }

  function noteFooter(note) {
    var footer = document.createElement('footer');
    footer.className = 'note-footer';

    var editHref = Render.editUrl(note.path);
    if (editHref) {
      var edit = document.createElement('a');
      edit.className = 'text-link';
      edit.href = editHref;
      edit.target = '_blank';
      edit.rel = 'noopener noreferrer';
      edit.textContent = 'Edit this note on GitHub';
      footer.appendChild(edit);
    }

    var path = document.createElement('span');
    path.className = 'note-path';
    path.textContent = note.path;
    footer.appendChild(path);

    return footer;
  }

  function renderNoteError(path, err) {
    document.title = 'Notes';
    els.note.textContent = '';

    var wrap = document.createElement('div');
    wrap.className = 'note-status';

    var heading = document.createElement('h1');
    heading.className = 'note-title';
    heading.textContent = err.status === 404 ? 'Note not found' : 'Could not open this note';
    wrap.appendChild(heading);

    var message = document.createElement('p');
    message.textContent = err.status === 404
      ? 'There is no file at ' + path + '. It may have been renamed or moved.'
      : err.message;
    wrap.appendChild(message);

    var back = document.createElement('a');
    back.className = 'text-link';
    back.href = '#/';
    back.textContent = 'Back to the start page';
    wrap.appendChild(back);

    els.note.appendChild(wrap);
  }

  function renderDiscoveryError(err) {
    els.note.textContent = '';

    var wrap = document.createElement('div');
    wrap.className = 'note-status';

    var heading = document.createElement('h1');
    heading.className = 'note-title';
    heading.textContent = 'Could not list your notes';
    wrap.appendChild(heading);

    var message = document.createElement('p');
    message.textContent = err.rateLimited
      ? 'GitHub is rate limiting this network for now. Notes you have already opened still work, and the list returns shortly.'
      : (err.message || 'The note list could not be loaded.');
    wrap.appendChild(message);

    var hint = document.createElement('p');
    hint.textContent = Notes.detectRepo()
      ? 'If this keeps happening, add a notes-manifest.json listing your note paths as a fallback.'
      : 'Serving from a custom domain or a local server means the repository cannot be detected. Set "repo" in js/config.js, or add a notes-manifest.json.';
    wrap.appendChild(hint);

    els.note.appendChild(wrap);
  }

  /* ------------------------------------------------------------------- events */

  function bindEvents() {
    els.search.addEventListener('input', function () {
      setQuery(els.search.value);
    });

    els.search.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        els.search.value = '';
        setQuery('');
        els.search.blur();
      }
    });

    els.searchClear.addEventListener('click', function () {
      els.search.value = '';
      setQuery('');
      els.search.focus();
    });

    els.menuToggle.addEventListener('click', function () {
      setSidebar(!document.body.classList.contains('sidebar-open'));
    });

    els.scrim.addEventListener('click', function () { setSidebar(false); });

    els.themeToggle.addEventListener('click', toggleTheme);

    els.refresh.addEventListener('click', function () {
      els.refresh.disabled = true;
      els.noteCount.textContent = 'Checking for new notes…';
      loadLibrary({ force: true }).then(function () {
        els.refresh.disabled = false;
      });
    });

    // Tapping a note on a phone should hand the screen back to the reader.
    els.tree.addEventListener('click', function (event) {
      var link = event.target.closest ? event.target.closest('.tree-link') : null;
      if (link && isMobile()) setSidebar(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && document.body.classList.contains('sidebar-open')) {
        setSidebar(false);
        return;
      }
      // "/" jumps to search, the way most readers and docs sites behave.
      if (event.key === '/' && !isTypingTarget(event.target)) {
        event.preventDefault();
        if (isMobile()) setSidebar(true);
        els.search.focus();
        els.search.select();
      }
    });

    window.matchMedia(MOBILE_QUERY).addEventListener('change', function (event) {
      if (!event.matches) setSidebar(false);
    });

    if (els.newNote) {
      var href = Render.newNoteUrl(Notes.notesDir + '/inbox');
      if (href) els.newNote.href = href;
      else els.newNote.hidden = true;
    }
  }

  function isTypingTarget(node) {
    if (!node || !node.tagName) return false;
    var tag = node.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || node.isContentEditable;
  }

  function setQuery(query) {
    state.query = query.trim();
    els.searchClear.hidden = !state.query;
    renderSidebar();
  }

  function isMobile() {
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  function setSidebar(open) {
    document.body.classList.toggle('sidebar-open', open);
    els.scrim.hidden = !open;
    els.menuToggle.setAttribute('aria-expanded', String(open));
    els.menuToggle.setAttribute('aria-label', open ? 'Hide notes list' : 'Show notes list');
  }

  /* -------------------------------------------------------------------- theme */

  function applyStoredTheme() {
    var stored = null;
    try {
      stored = window.localStorage.getItem(THEME_KEY);
    } catch (err) {
      stored = null;
    }
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.setAttribute('data-theme', stored);
    }
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme');
    var effective = current || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = effective === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch (err) {
      /* Theme choice simply will not persist. */
    }
  }

  /* ------------------------------------------------------------------ helpers */

  function icon(pathData, className) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'tree-icon' + (className ? ' ' + className : ''));

    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    svg.appendChild(path);
    return svg;
  }

  function readJson(key) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function writeJson(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      /* Folder open/closed state simply will not persist. */
    }
  }
})();
