/**
 * Note loading and markdown rendering.
 *
 * A note body is fetched only when it is opened, parsed for optional front
 * matter, rendered with marked, and sanitised with DOMPurify before it reaches
 * the page.
 */
window.Render = (function () {
  'use strict';

  var CFG = window.NOTE_APP_CONFIG || {};
  var WORDS_PER_MINUTE = 220;

  var hasMarked = typeof window.marked !== 'undefined';
  var hasPurify = typeof window.DOMPurify !== 'undefined';

  if (hasMarked) {
    window.marked.setOptions({ gfm: true, breaks: false });
  }

  /* ------------------------------------------------------------------ loading */

  /**
   * @param {string} path repository-relative path, e.g. "notes/reading/foo.md"
   * @returns {Promise<{path: string, title: string, tags: string[], readingMinutes: number, fragment: DocumentFragment}>}
   */
  function loadNote(path) {
    return fetch(Notes.resolveUrl(path), { cache: 'no-cache' })
      .then(function (res) {
        if (res.status === 404) throw notFound(path);
        if (!res.ok) throw new Error('Could not load this note (HTTP ' + res.status + ').');
        return res.text();
      })
      .then(function (text) {
        return buildNote(path, text);
      });
  }

  function notFound(path) {
    var err = new Error('No note at ' + path + '.');
    err.status = 404;
    return err;
  }

  function buildNote(path, text) {
    var parsed = Notes.parseFrontMatter(text);
    var data = parsed.data;
    Notes.rememberMeta(path, data);

    var fragment = toFragment(parsed.body);
    var title = typeof data.title === 'string' ? data.title.trim() : '';

    // A note usually opens with its own H1. Promote it to the page title rather
    // than rendering the same heading twice.
    if (!title) {
      var first = firstElement(fragment);
      if (first && first.tagName === 'H1') {
        title = first.textContent.trim();
        fragment.removeChild(first);
      }
    }

    enhance(fragment, path);

    return {
      path: path,
      title: title || Notes.titleFromPath(path),
      tags: Notes.toTags(data.tags),
      readingMinutes: readingMinutes(parsed.body),
      fragment: fragment,
    };
  }

  function firstElement(fragment) {
    for (var i = 0; i < fragment.childNodes.length; i++) {
      if (fragment.childNodes[i].nodeType === 1) return fragment.childNodes[i];
    }
    return null;
  }

  function readingMinutes(body) {
    var words = body.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  }

  /* ---------------------------------------------------------------- rendering */

  function toFragment(markdown) {
    if (!hasMarked || !hasPurify) return plainTextFragment(markdown);

    var html = window.marked.parse(markdown);
    return window.DOMPurify.sanitize(html, { RETURN_DOM_FRAGMENT: true });
  }

  /**
   * Shown when the CDN is unreachable: the note is still readable as plain
   * text, which beats a blank page.
   */
  function plainTextFragment(markdown) {
    var fragment = document.createDocumentFragment();
    var notice = document.createElement('p');
    notice.className = 'callout';
    notice.textContent = 'The markdown renderer could not be loaded, so this note is shown as plain text.';
    var pre = document.createElement('pre');
    pre.className = 'raw-note';
    pre.textContent = markdown;
    fragment.appendChild(notice);
    fragment.appendChild(pre);
    return fragment;
  }

  /* -------------------------------------------------------------- enhancement */

  function enhance(root, notePath) {
    rewriteLinks(root, notePath);
    rewriteImages(root, notePath);
    addHeadingIds(root);
    markExternalTables(root);
  }

  /**
   * Links between notes are turned into in-app routes so tapping one keeps you
   * in the reader; everything external opens in a new tab.
   */
  function rewriteLinks(root, notePath) {
    Array.prototype.forEach.call(root.querySelectorAll('a[href]'), function (link) {
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;

      if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.indexOf('//') === 0) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        link.classList.add('external-link');
        return;
      }

      var resolved = resolveRelative(notePath, href);
      if (Notes.isNote(resolved.path)) {
        link.setAttribute('href', '#/' + resolved.path + resolved.hash);
        link.classList.add('note-link');
      } else {
        link.setAttribute('href', Notes.resolveUrl(resolved.path) + resolved.hash);
      }
    });
  }

  function rewriteImages(root, notePath) {
    Array.prototype.forEach.call(root.querySelectorAll('img[src]'), function (img) {
      var src = img.getAttribute('src');
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
      if (!src || /^[a-z][a-z0-9+.-]*:/i.test(src) || src.indexOf('//') === 0) return;
      // Relative to the note, not to index.html, so it needs resolving.
      img.setAttribute('src', Notes.resolveUrl(resolveRelative(notePath, src).path));
    });
  }

  /** Resolve a link found inside a note against that note's folder. */
  function resolveRelative(notePath, href) {
    var hashAt = href.indexOf('#');
    var hash = hashAt === -1 ? '' : href.slice(hashAt);
    var target = hashAt === -1 ? href : href.slice(0, hashAt);

    if (target.charAt(0) === '/') {
      return { path: target.replace(/^\/+/, ''), hash: hash };
    }

    var dir = notePath.split('/').slice(0, -1).join('/');
    var base = 'https://notes.invalid/' + (dir ? dir + '/' : '');
    var resolved = new URL(target, base);
    var path = decodeURIComponent(resolved.pathname.replace(/^\/+/, ''));
    return { path: path, hash: hash };
  }

  /** Heading ids make in-note anchor links and shared deep links work. */
  function addHeadingIds(root) {
    var used = Object.create(null);
    Array.prototype.forEach.call(root.querySelectorAll('h1, h2, h3, h4, h5, h6'), function (heading) {
      if (heading.id) {
        used[heading.id] = true;
        return;
      }
      var slug = heading.textContent.toLowerCase().trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-') || 'section';

      var id = slug;
      var counter = 2;
      while (used[id]) id = slug + '-' + counter++;
      used[id] = true;
      heading.id = id;
    });
  }

  /** Wrap tables so wide ones scroll rather than stretching the page. */
  function markExternalTables(root) {
    Array.prototype.forEach.call(root.querySelectorAll('table'), function (table) {
      var wrapper = document.createElement('div');
      wrapper.className = 'table-scroll';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  /* ----------------------------------------------------------- source linking */

  /** "Edit on GitHub" target for the note currently on screen. */
  function editUrl(path) {
    var repo = Notes.detectRepo();
    if (!repo) return null;
    return 'https://github.com/' + repo.owner + '/' + repo.repo +
      '/edit/' + Notes.branch + '/' + path;
  }

  function newNoteUrl(folder) {
    var repo = Notes.detectRepo();
    if (!repo) return null;
    var dir = folder || (Notes.notesDir + '/inbox');
    return 'https://github.com/' + repo.owner + '/' + repo.repo +
      '/new/' + Notes.branch + '?filename=' + encodeURIComponent(dir + '/new-note.md');
  }

  return {
    loadNote: loadNote,
    editUrl: editUrl,
    newNoteUrl: newNoteUrl,
    rendererAvailable: hasMarked && hasPurify,
    agentsFile: CFG.agentsFile || 'AGENTS.md',
  };
})();
