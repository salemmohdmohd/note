/**
 * Discovery and indexing.
 *
 * The reader stays cheap on a phone by never downloading note bodies to build
 * the sidebar: one small list of file paths drives the tree and the search box,
 * and a body is only fetched when a note is opened.
 */
window.Notes = (function () {
  'use strict';

  var CFG = window.NOTE_APP_CONFIG || {};
  var NOTES_DIR = (CFG.notesDir || 'notes').replace(/^\/+|\/+$/g, '');
  var BRANCH = CFG.branch || 'main';
  var FOLDER_ORDER = CFG.folderOrder || [];

  var TREE_CACHE_PREFIX = 'noteapp:tree:v1:';
  var META_CACHE_KEY = 'noteapp:meta:v1';

  // Lower-cased inside a title, but never as the first word.
  var MINOR_WORDS = ['a', 'an', 'the', 'and', 'or', 'but', 'of', 'in', 'on', 'at',
    'to', 'for', 'from', 'by', 'with', 'as', 'vs', 'via', 'per'];

  /* ---------------------------------------------------------------- storage */

  function readStore(key) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function writeStore(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      /* Private browsing or a full quota: caching is an optimisation, not a
         requirement, so a failure here is not worth surfacing. */
    }
  }

  /* ------------------------------------------------------------------- repo */

  /**
   * Work out which repository to query. A project page at
   * https://owner.github.io/repo/ carries both halves in its URL; a custom
   * domain carries neither, so it needs `repo` set in config.js.
   */
  function detectRepo() {
    if (CFG.repo) {
      var parts = String(CFG.repo).split('/');
      if (parts.length === 2 && parts[0] && parts[1]) {
        return { owner: parts[0], repo: parts[1] };
      }
      return null;
    }

    var host = window.location.hostname;
    if (!/\.github\.io$/i.test(host)) return null;

    var owner = host.replace(/\.github\.io$/i, '');
    var segments = window.location.pathname.split('/').filter(Boolean);
    var first = segments.length ? segments[0] : '';

    // A trailing "index.html" is the document, not a repository name.
    if (!first || /\.[a-z0-9]+$/i.test(first)) {
      return { owner: owner, repo: host };
    }
    return { owner: owner, repo: first };
  }

  function apiBase(repo) {
    return 'https://api.github.com/repos/' + encodeURIComponent(repo.owner) +
      '/' + encodeURIComponent(repo.repo);
  }

  /** Absolute URL for a repository-relative path, served alongside the app. */
  function resolveUrl(path) {
    return new URL(path.replace(/^\/+/, ''), document.baseURI).href;
  }

  /* -------------------------------------------------------------- discovery */

  function isNote(path) {
    return path.slice(-3).toLowerCase() === '.md' &&
      path.indexOf(NOTES_DIR + '/') === 0;
  }

  /**
   * The latest commit SHA, requested with a media type that returns the bare
   * SHA rather than the full commit object. Used as the cache key so an
   * unchanged repository costs one tiny request instead of a full tree.
   */
  function fetchHeadSha(repo) {
    return fetch(apiBase(repo) + '/commits/' + encodeURIComponent(BRANCH), {
      headers: { Accept: 'application/vnd.github.sha' },
    }).then(function (res) {
      if (!res.ok) throw httpError(res, 'commit lookup');
      return res.text();
    }).then(function (sha) {
      return sha.trim();
    });
  }

  function fetchTree(repo, sha) {
    var url = apiBase(repo) + '/git/trees/' + encodeURIComponent(sha) + '?recursive=1';
    return fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (res) {
        if (!res.ok) throw httpError(res, 'file list');
        return res.json();
      })
      .then(function (data) {
        var entries = (data && data.tree) || [];
        var paths = entries
          .filter(function (entry) { return entry.type === 'blob' && isNote(entry.path); })
          .map(function (entry) { return entry.path; });
        return { paths: paths, truncated: !!(data && data.truncated) };
      });
  }

  /**
   * Optional hand-maintained fallback, used when the API is unreachable or rate
   * limited, and when serving from a plain local static server. Accepts either
   * a bare array of paths or `{ "paths": [...] }`.
   */
  function fetchManifest() {
    return fetch(resolveUrl('notes-manifest.json'), { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw httpError(res, 'notes-manifest.json');
        return res.json();
      })
      .then(function (data) {
        var list = Array.isArray(data) ? data : (data && data.paths);
        if (!Array.isArray(list)) throw new Error('notes-manifest.json has no path list.');
        return list.filter(function (p) { return typeof p === 'string' && isNote(p); });
      });
  }

  function httpError(res, what) {
    var err = new Error('Could not load the ' + what + ' (HTTP ' + res.status + ').');
    err.status = res.status;
    if (res.status === 403 || res.status === 429) {
      err.message = 'GitHub rate limit reached while loading the ' + what + '.';
      err.rateLimited = true;
    }
    return err;
  }

  /**
   * Resolve the list of note paths, preferring a warm cache.
   *
   * @param {{force?: boolean}} [options] force skips the cache and re-reads the tree.
   * @returns {Promise<{paths: string[], source: string, stale: boolean, truncated: boolean}>}
   */
  function discover(options) {
    var force = !!(options && options.force);
    var repo = detectRepo();
    var cacheKey = repo ? TREE_CACHE_PREFIX + repo.owner + '/' + repo.repo + '@' + BRANCH : null;
    var cached = cacheKey ? readStore(cacheKey) : null;
    var hasCache = !!(cached && Array.isArray(cached.paths) && cached.paths.length);

    if (!repo) {
      return fetchManifest().then(function (paths) {
        return result(paths, 'manifest', false, false);
      });
    }

    return fetchHeadSha(repo).then(function (sha) {
      if (!force && hasCache && cached.sha === sha) {
        return result(cached.paths, 'cache', false, !!cached.truncated);
      }
      return fetchTree(repo, sha).then(function (tree) {
        writeStore(cacheKey, {
          sha: sha,
          paths: tree.paths,
          truncated: tree.truncated,
          cachedAt: Date.now(),
        });
        return result(tree.paths, 'github', false, tree.truncated);
      });
    }).catch(function (err) {
      // Offline, rate limited, or a private repository: keep reading whatever
      // we already know about rather than showing an empty sidebar.
      if (hasCache) return result(cached.paths, 'cache', true, !!cached.truncated);
      return fetchManifest()
        .then(function (paths) { return result(paths, 'manifest', false, false); })
        .catch(function () { throw err; });
    });

    function result(paths, source, stale, truncated) {
      return {
        paths: paths.slice().sort(),
        source: source,
        stale: stale,
        truncated: truncated,
      };
    }
  }

  /* ------------------------------------------------------------------ titles */

  function titleFromPath(path) {
    var base = path.split('/').pop().replace(/\.md$/i, '');
    return titleFromSlug(base);
  }

  function titleFromSlug(slug) {
    var words = slug.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
    if (!words[0]) return slug;

    return words.map(function (word, index) {
      // Words that already carry capitals are assumed deliberate: acronyms
      // like "CSS", names like "iPhone".
      if (/[A-Z]/.test(word)) return word;
      if (index > 0 && MINOR_WORDS.indexOf(word) !== -1) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  }

  /* -------------------------------------------------------------------- tree */

  function folderRank(name) {
    var index = FOLDER_ORDER.indexOf(name);
    return index === -1 ? FOLDER_ORDER.length : index;
  }

  /** Turn flat paths into a nested folder structure for the sidebar. */
  function buildTree(paths) {
    var root = makeDir(NOTES_DIR, NOTES_DIR);

    paths.forEach(function (path) {
      var segments = path.split('/').slice(1); // drop the notes dir itself
      var node = root;

      segments.forEach(function (segment, index) {
        var isLeaf = index === segments.length - 1;
        var childPath = node.path + '/' + segment;

        if (isLeaf) {
          node.children.push({
            type: 'file',
            name: segment,
            path: path,
            title: titleFromPath(path),
          });
          return;
        }

        var existing = node.children.filter(function (child) {
          return child.type === 'dir' && child.name === segment;
        })[0];

        if (!existing) {
          existing = makeDir(segment, childPath);
          node.children.push(existing);
        }
        node = existing;
      });
    });

    sortDir(root, true);
    return root;

    function makeDir(name, path) {
      return { type: 'dir', name: name, path: path, title: titleFromSlug(name), children: [] };
    }

    function sortDir(dir, isRoot) {
      dir.children.sort(function (a, b) {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
        if (isRoot && a.type === 'dir') {
          var rank = folderRank(a.name) - folderRank(b.name);
          if (rank !== 0) return rank;
        }
        return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
      });
      dir.children.forEach(function (child) {
        if (child.type === 'dir') sortDir(child, false);
      });
    }
  }

  /* ------------------------------------------------------------ front matter */

  /**
   * Split optional YAML front matter off the top of a note. Deliberately
   * handles only the subset used for note metadata — scalars and string lists —
   * so no YAML parser needs shipping.
   */
  function parseFrontMatter(text) {
    var source = text.replace(/^\uFEFF/, '');
    var match = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(source);
    if (!match) return { data: {}, body: source };

    var data = {};
    var currentKey = null;

    match[1].split(/\r?\n/).forEach(function (line) {
      if (!line.trim() || /^\s*#/.test(line)) return;

      var item = /^\s*-\s+(.*)$/.exec(line);
      if (item && currentKey) {
        if (!Array.isArray(data[currentKey])) data[currentKey] = [];
        data[currentKey].push(unquote(item[1]));
        return;
      }

      var pair = /^([A-Za-z0-9_.-]+)\s*:\s*(.*)$/.exec(line);
      if (!pair) return;

      currentKey = pair[1];
      var value = pair[2].trim();

      if (!value) {
        data[currentKey] = [];
      } else if (value.charAt(0) === '[' && value.slice(-1) === ']') {
        data[currentKey] = value.slice(1, -1).split(',')
          .map(function (part) { return unquote(part.trim()); })
          .filter(Boolean);
      } else {
        data[currentKey] = unquote(value);
      }
    });

    return { data: data, body: source.slice(match[0].length) };
  }

  function unquote(value) {
    return value.replace(/^['"]|['"]$/g, '').trim();
  }

  function toTags(value) {
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    if (typeof value === 'string' && value.trim()) {
      return value.split(/[,\s]+/).filter(Boolean);
    }
    return [];
  }

  /* -------------------------------------------------------------- meta cache */

  /**
   * Front matter learned from notes that have already been opened. It enriches
   * search over time at no extra network cost, and is never required.
   */
  var metaCache = readStore(META_CACHE_KEY) || {};

  function getMeta(path) {
    return metaCache[path] || null;
  }

  function rememberMeta(path, data) {
    var tags = toTags(data.tags);
    var title = typeof data.title === 'string' ? data.title.trim() : '';
    if (!title && !tags.length) return;

    metaCache[path] = { title: title || undefined, tags: tags.length ? tags : undefined };
    writeStore(META_CACHE_KEY, metaCache);
  }

  return {
    detectRepo: detectRepo,
    discover: discover,
    buildTree: buildTree,
    titleFromPath: titleFromPath,
    titleFromSlug: titleFromSlug,
    parseFrontMatter: parseFrontMatter,
    resolveUrl: resolveUrl,
    isNote: isNote,
    toTags: toTags,
    getMeta: getMeta,
    rememberMeta: rememberMeta,
    notesDir: NOTES_DIR,
    branch: BRANCH,
  };
})();
