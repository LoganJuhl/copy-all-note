# Copy All Note

[![CI](https://github.com/LoganJuhl/copy-all-note/actions/workflows/ci.yml/badge.svg)](https://github.com/LoganJuhl/copy-all-note/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A header button that copies the open note as Markdown, ready to paste into a chat, prompt, terminal, or another app. It uses Obsidian's live buffer, including unsaved edits, and also adds the command **Copy entire note**.

## Install

Requires Obsidian **1.13.7** or newer on desktop or mobile. Tested on macOS and a physical iPhone. Installing the plugin does not require Node.js.

In Obsidian, open **Settings → Community plugins** and turn on community plugins if needed. Select **Browse**, search **Copy All Note**, then **Install** and **Enable**. You can also select **Add to Obsidian** from the [Community listing](https://community.obsidian.md/plugins/copy-all-note).

For manual installation, download `main.js`, `manifest.json`, and `styles.css` from [release 0.1.1](https://github.com/LoganJuhl/copy-all-note/releases/tag/0.1.1) into:

```text
<Vault>/.obsidian/plugins/copy-all-note/
```

The release ZIP contains a `copy-all-note/` folder with those three files. Place that folder under `<Vault>/.obsidian/plugins/`, reload Obsidian, then enable **Copy All Note** under **Settings → Community plugins**.

## Use

- Click the copy icon in the note header, in Editing or Reading view.
- Run **Copy entire note** from the Command Palette.
- Assign the command under **Settings → Hotkeys**.
- On Obsidian 1.13.7 mobile, open **Settings → Interface → Configure mobile toolbar → Add a command…**, then choose **Copy All Note: Copy entire note**.

In split panes and pop-out windows, the header button copies the note in that view; the command copies the active note.

The output is Markdown. Obsidian may already have converted CRLF line endings to LF or removed a leading byte-order mark (BOM) before supplying the buffer. The plugin does not read the file from disk.

An empty output copies only if the Clipboard API accepts it. If that API is missing or rejects the request, the plugin reports a failure and leaves the clipboard unchanged. If Obsidian asks for clipboard access when you copy, that prompt is expected.

## Settings

Open **Settings → Copy All Note**. In 0.1.1, these controls are not indexed by Obsidian's settings search.

- **Include frontmatter** (on): keep a leading YAML block.
- **Prepend title** (off): add the note's filename without its extension as an H1. If frontmatter is kept, the H1 goes after the closing `---` so the YAML stays valid.
- **Show success notice** (on): show `Copied note` after a successful copy.
- **Show header button** (on): turn off to hide the icon; the command remains available.
- **Icon** (`copy`): use a nonempty Lucide icon name. Unknown names fall back to `copy`, then `clipboard-copy`, then `clipboard`.

## Themes

The button uses Obsidian's `.clickable-icon.view-action` styling and inherits the theme's size and hover treatment. It does not change the editor, inline title, or Properties.

If a theme hides the view header, use the command, a hotkey, or the mobile toolbar. On Cupertino, the button goes at the start of the action row to preserve the theme's mode-switcher position.

## Privacy

No network requests, telemetry, or clipboard reads. Note text is read only when you copy and is not saved by the plugin. Saved settings contain only booleans and an icon name; the plugin does not modify note files.

If the Clipboard API is missing or rejects the request, nonempty text is copied through a temporary off-screen textarea in that window, then removed. Focus and selection are restored where possible.

Use synthetic note text in [GitHub Issues](https://github.com/LoganJuhl/copy-all-note/issues). For vulnerability reports, see [SECURITY.md](SECURITY.md).

## Development

Node.js 22.22.2 or newer is required for development.

```bash
npm ci
npm run dev
```

`npm run check` lints, typechecks, tests, builds, and checks release metadata. To build an installable folder, run `npm run release:prepare` and copy `dist/copy-all-note/` into `<Vault>/.obsidian/plugins/`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the manual test matrix and [docs/RELEASING.md](docs/RELEASING.md) for release steps.

## License

[MIT](LICENSE) © 2026 Logan McKinley Juhl
