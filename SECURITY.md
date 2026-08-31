# Security policy

## Supported versions

Security fixes are provided for the latest released version of Copy All Note.

## Report a vulnerability privately

Please use [GitHub private vulnerability reporting](https://github.com/LoganJuhl/copy-all-note/security/advisories/new). Do not open a public issue for a vulnerability that could expose note text, clipboard data, or another user's vault.

Before submitting diagnostics:

- Replace note and clipboard contents with synthetic examples.
- Remove vault names, local paths, account names, and device identifiers.
- Include the Copy All Note version, Obsidian version, operating system, and minimal reproduction steps.

If private reporting is not yet enabled, open a public issue containing only a request for a private contact channel—do not include vulnerability details.

## Security model

Copy All Note performs no network requests or telemetry. It accesses a note's live Markdown only after an explicit copy action and processes the text locally to copy it to the clipboard. It first uses the modern Clipboard API; if that API is unavailable or rejected, the plugin temporarily places the text in an off-screen textarea in the current Obsidian window, invokes the browser's copy operation, then immediately removes the textarea and restores focus and selection. It does not persist note text, read clipboard contents, mutate vault files, or fall back to saved disk content.
