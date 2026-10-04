# Changelog

## 0.1.1 — 2026-10-02

First public release. 0.1.0 stayed an unpublished draft.

- Minimum Obsidian version is 1.13.7, tested on macOS and a physical iPhone. The 0.1.0 manifest declared 1.5.0; that older version was not tested.
- Empty output reports a failure when the Clipboard API is missing or rejects the request. The textarea fallback cannot copy an empty string, so the clipboard is left unchanged.
- Mobile toolbar instructions match Obsidian 1.13.7.
- Docs explain that Obsidian may normalize line endings and remove a leading BOM before supplying the live buffer.

## [0.1.0] — 2026-08-30

Unpublished draft. The tag remains available.

- Header action and **Copy entire note** command.
- Copies the open buffer in Editing and Reading views without reading the file from disk.
- Optional frontmatter and title. The title goes after retained YAML.
- Split panes, pop-out windows, and mobile. The header button goes first so Cupertino's mode switcher stays in place.
- Configurable icon, success notice, and header-button visibility.
- Debounced settings saves and replacement of stale buttons after reload.
- Linting, typechecking, tests, release checks, and draft-release automation.

[0.1.0]: https://github.com/LoganJuhl/copy-all-note/tree/0.1.0
