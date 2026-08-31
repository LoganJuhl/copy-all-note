# Copy All Note

[![CI](https://github.com/LoganJuhl/copy-all-note/actions/workflows/ci.yml/badge.svg)](https://github.com/LoganJuhl/copy-all-note/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Copy All Note adds one native, icon-only action to every Obsidian Markdown view header. It copies the current note's raw Markdown—including a valid empty unsaved buffer—for quick pasting into agents, terminals, prompts, and other apps. It also registers **Copy entire note** as a command.

## Features

- Copies the current live Markdown buffer, including unsaved edits and deletions.
- Works from Editing view, Reading view, the Command Palette, split panes, and pop-out windows.
- Preserves LF or CRLF line endings when adding a title.
- Keeps retained YAML frontmatter at the beginning of the copied document.
- Uses Obsidian's native header-action styling on desktop and mobile.
- Fails closed if Obsidian cannot provide the live buffer; it never substitutes stale disk content.

## Requirements

- Obsidian 1.5.0 or newer.
- Desktop or mobile. The plugin does not use Node.js or Electron APIs at runtime.

## Install

### From a GitHub release

Download `main.js`, `manifest.json`, and `styles.css` from the GitHub release you want to install and place them in:

```text
<Vault>/.obsidian/plugins/copy-all-note/
```

Alternatively, extract the release ZIP so those three files end up in the same `copy-all-note` folder. Then reload Obsidian, open **Settings → Community plugins**, and enable **Copy All Note**.

### Build the current source

Node.js 22.22.2 or newer is required for the development toolchain.

```bash
npm ci
npm run release:prepare
```

Copy the generated `dist/copy-all-note/` folder to `<Vault>/.obsidian/plugins/`, reload Obsidian, and enable the plugin.

## Usage

- Click the copy icon in a Markdown note's native view header.
- Run **Copy entire note** from the Command Palette.
- Assign **Copy entire note** under **Settings → Hotkeys**.
- On mobile, add the command under **Settings → Toolbar → Add global command**.

The plugin copies Markdown, not rendered HTML or preview text. It uses the current view buffer whenever it is a string—even when that string is empty—so unsaved deletions are never replaced with stale disk content.

## Settings

- **Include frontmatter** (default: on): keep leading YAML frontmatter.
- **Prepend title** (default: off): add the note basename as an H1.
- **Show success notice** (default: on): show `Copied note` after success.
- **Show header button** (default: on): show or hide header actions; the command remains available.
- **Icon** (default: `copy`): use a non-empty Lucide icon name. Invalid names fall back to a clipboard icon.

When **Prepend title** and **Include frontmatter** are both enabled, the YAML block remains at the start of the copied Markdown and the H1 is inserted after its closing delimiter. The copied frontmatter therefore remains valid when pasted as a new note.

## Theme compatibility

The action uses Obsidian's native `.clickable-icon.view-action` header slot and inherits the active theme's size, spacing, hover treatment, and mobile touch target. It does not add a document toolbar or modify the editor, inline title, Properties, or note body.

Native visibility rules still apply. If a theme hides the whole view header, use the command, a hotkey, or the mobile toolbar. For Cupertino, the plugin places its own action at the beginning of the native action row so the theme's positional mode-switcher rules remain stable.

## Privacy

Copy All Note is local-only:

- It performs no network requests and includes no telemetry or analytics.
- It reads note text only after you explicitly invoke the button or command.
- It writes that text only to the operating system clipboard.
- It does not read arbitrary clipboard contents or write to notes in your vault.
- Its saved settings contain only booleans and an icon name.

Clipboard contents and note text can be sensitive. Redact both before attaching diagnostics to a public issue. See [SECURITY.md](SECURITY.md) for private vulnerability reporting.

## Development

```bash
npm ci
npm run dev
```

Before opening a pull request or preparing a release, run:

```bash
npm run check
```

`check` runs the Obsidian-oriented ESLint rules, TypeScript, 35 automated tests, a minified production build, and release-metadata validation. The tests cover empty unsaved buffers, CRLF/frontmatter formatting, Reading view commands, split panes, pop-outs, clipboard fallback cleanup, action ownership after reload, debounced settings persistence, and Cupertino ordering.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the manual test matrix and [docs/RELEASING.md](docs/RELEASING.md) for the draft-release process.

## Support

Use [GitHub Issues](https://github.com/LoganJuhl/copy-all-note/issues) for reproducible bugs and focused feature requests. Do not include private note or clipboard contents.

## License

[MIT](LICENSE) © 2026 Logan McKinley Juhl
