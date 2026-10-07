# Contributing

Keep changes focused on copying the current note. Small changes are easier to review and maintain.

## Setup

Node.js 22.22.2 or newer and npm.

```bash
git clone https://github.com/LoganJuhl/copy-all-note.git
cd copy-all-note
npm ci
npm run check
```

Use a throwaway vault. Don't commit a vault, `.obsidian`, `data.json`, credentials, note text, clipboard text, or private logs.

```bash
npm run dev
```

`main.js` and `dist/` are generated. Releases build them from source and the committed lockfile.

## Before a pull request

Run `npm ci` and `npm run check`. Explain what changes for the user and why.

For a behavior change, try the affected parts in Obsidian and record the app version, platform, and results:

- Empty unsaved note.
- Editing and Reading views.
- Frontmatter kept and stripped, with title off and on.
- A note that started with LF, CRLF, or a BOM. Unit tests see the string passed in; Obsidian may already have normalized the live buffer.
- Two panes with different notes.
- A pop-out window with its own clipboard context.
- Reload the plugin twice with a note open. One working button should remain.
- Phone header and toolbar command, when a device is available.
- Cupertino ordering on a phone, when available.

For a metadata or documentation release, compare the generated `main.js` and `styles.css` byte-for-byte with the release already tested. If they match, record that release and any remaining limitations, then smoke-test loading, header copy, command copy, and the exact clipboard text. Investigate unexpected differences before relying on earlier results.

Record an inconclusive interaction as inconclusive. Don't count an untested device as a pass. Set `minAppVersion` from a version actually tested in Obsidian.

## What to keep

- The open buffer is the only source of note text. Don't add a disk fallback.
- Discuss network access, telemetry, clipboard reads, note-file writes, Node.js, or Electron APIs before adding them.
- Add tests for behavior changes. Update docs and the changelog when a user would notice.
- For releases, keep `package.json`, `package-lock.json`, `manifest.json`, and `versions.json` aligned.
