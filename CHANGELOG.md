# Changelog

All notable changes to Copy All Note will be documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 0.1.1

First public release candidate, following the unpublished 0.1.0 draft.

### Changed

- Raised the minimum supported Obsidian version to 1.13.7 to match native testing on macOS and a physical iPhone. Compatibility with the earlier declared minimum, 1.5.0, was not verified.
- Clarified that copied text comes from Obsidian's live buffer, which may already have normalized CRLF line endings and removed a leading BOM.
- Updated the mobile toolbar instructions for Obsidian 1.13.7.
- Documented how runtime equivalence can carry forward native test evidence for metadata and documentation releases.

### Fixed

- Report a copy failure for an empty payload when modern clipboard access is unavailable or rejected, instead of trusting a legacy copy operation that may leave previous clipboard content unchanged.

## [0.1.0] - 2026-08-30

Pre-publication candidate; the GitHub release remained an unpublished draft.

### Added

- A native header action and **Copy entire note** command.
- Live-buffer copying in Editing and Reading views without disk fallback.
- Optional YAML frontmatter retention and title prepending, with LF, CRLF, and BOM handling for text supplied to the payload code. Original on-disk byte preservation is not guaranteed.
- Split-pane, pop-out-window, and mobile support, using native styling and action ordering intended to work with themes such as Minimal and Cupertino.
- Configurable icon, success notice, and header-button visibility.
- Debounced settings persistence and stale-action replacement after plugin reloads.
- Linting, strict typechecking, Vitest coverage, release verification, and draft-release automation.

[0.1.0]: https://github.com/LoganJuhl/copy-all-note/tree/0.1.0
