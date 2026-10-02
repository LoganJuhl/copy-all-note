# Contributing

Thanks for helping improve Copy All Note. Keep changes focused, privacy-preserving, and compatible with Obsidian on desktop and mobile.

## Development setup

You need Node.js 22.22.2 or newer and npm.

```bash
git clone https://github.com/LoganJuhl/copy-all-note.git
cd copy-all-note
npm ci
npm run check
```

Use a throwaway Obsidian vault for manual development. Never commit a vault, `.obsidian` configuration, `data.json`, note content, clipboard content, credentials, or diagnostic logs containing private data.

Run the development watcher with:

```bash
npm run dev
```

The generated `main.js`, `dist/`, dependencies, local settings, logs, and archives are intentionally ignored. Releases build their runtime files from reviewed source and the committed lockfile.

## Before a pull request

Run:

```bash
npm ci
npm run check
```

Then manually verify the behavior your change touches. For runtime changes, use this matrix and record the Obsidian version, platform, and actual results:

- Empty unsaved note.
- Editing and Reading views.
- Frontmatter retained and stripped, with title off and on.
- LF, CRLF, and BOM-prefixed input. Distinguish payload-unit-test results from native behavior: Obsidian may normalize line endings and strip a BOM before supplying the live buffer.
- Split panes that contain different notes.
- A pop-out window with its own clipboard context.
- Two plugin reloads with a note already open; one working action must remain.
- Mobile header and toolbar command.
- Cupertino ordering on a phone when available.

For a metadata or documentation release, compare the generated `main.js` and `styles.css` byte-for-byte with the exact previously tested release assets. If both match, carry forward the recorded native results and limitations, then run a focused clean-vault smoke test: plugin loading, header copy, command copy, and exact Markdown clipboard output. Investigate any unexpected runtime difference before relying on earlier tests.

Record an inconclusive interaction as inconclusive, including whether built-in controls behave similarly. Do not count it as a pass or infer coverage for an untested device. Set `minAppVersion` from native compatibility evidence, not API types or mocks alone.

## Pull-request guidance

- Explain the user-visible outcome and why it is needed.
- Add or update tests for changed behavior.
- Keep the live buffer as the sole source of note text; do not restore disk fallback.
- Do not add telemetry, network access, clipboard reads, vault mutation, Node.js, or Electron APIs without prior discussion.
- Update documentation and `CHANGELOG.md` when behavior changes.
- Keep `package.json`, `package-lock.json`, `manifest.json`, and `versions.json` aligned for releases.
