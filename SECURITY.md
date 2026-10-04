# Security

Security fixes go out on the latest release.

Report a vulnerability through [GitHub private reporting](https://github.com/LoganJuhl/copy-all-note/security/advisories/new). Don't open a public issue with vulnerability details, note text, clipboard contents, or private vault information.

Use a synthetic note in the report. Remove vault names, local paths, account names, and device identifiers. Include the plugin version, Obsidian version, operating system, and reproduction steps.

If private reporting is unavailable, open an issue asking only for a private contact channel. Leave the details out.

## What the plugin does

No network requests or telemetry. Note text is read only after you click the button or run the command, then copied locally.

It tries `navigator.clipboard.writeText` first. If that API is missing or rejects the request, nonempty text goes through an off-screen textarea in the current window and `execCommand("copy")`. The textarea is removed, and focus and selection are restored where possible. Empty text does not use that fallback.

The plugin does not save note text, read the clipboard, or modify note files. It saves only its settings.

An unavailable malware scan in the Community scorecard means there is no scan result. It is neither a malware finding nor a clean verdict.
