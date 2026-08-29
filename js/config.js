/**
 * Reader configuration. Everything here is optional — the defaults work for a
 * repository published at https://<user>.github.io/<repo>/.
 */
window.NOTE_APP_CONFIG = {
  /**
   * "owner/repo" of the repository holding the notes. Leave null to detect it
   * from the page URL. Set it explicitly when serving from a custom domain,
   * where the URL carries no hint about the repository.
   */
  repo: null,

  /** Branch the notes live on. */
  branch: 'main',

  /** Folder scanned for .md files. Everything below it is included. */
  notesDir: 'notes',

  /** Pinned above the folder tree, for the file that tells agents how to organise things. */
  agentsFile: 'AGENTS.md',

  /** Shown when the app opens without a note in the URL. */
  homeFile: 'notes/README.md',

  /**
   * Folder order in the sidebar. Folders listed here come first, in this order;
   * anything else follows alphabetically.
   */
  folderOrder: ['inbox', 'reading', 'archive'],
};
