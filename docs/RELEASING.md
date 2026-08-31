# Releasing

This repository is configured to build and create a **draft** GitHub release from a version tag. The workflow never publishes the release automatically.

## 1. Update release metadata

Update the same `x.y.z` version, without a leading `v`, in:

- `package.json`
- `package-lock.json` at the top level and in `packages[""]`
- `manifest.json`
- `versions.json`, mapped to the release's minimum Obsidian version
- `CHANGELOG.md`
- `.github/release-notes/<version>.md`

Do not reuse a version that has already been distributed. Released bytes are immutable.

## 2. Verify from locked dependencies

```bash
npm ci
npm run release:prepare
```

This performs linting, strict typechecking, all tests, a production build, metadata and runtime-import checks, and assembles:

```text
dist/
├── SHA256SUMS.txt
└── copy-all-note/
    ├── main.js
    ├── manifest.json
    └── styles.css
```

Install `dist/copy-all-note/` into a throwaway vault and complete the manual matrix in [CONTRIBUTING.md](../CONTRIBUTING.md).

## 3. Review repository state

Confirm that only intended source, documentation, configuration, and lockfile changes are included. Never include `node_modules`, `main.js`, `dist`, `data.json`, vault files, archives, logs, source maps, credentials, or local editor settings.

## 4. Commit and tag deliberately

After review, create the release commit and an exact version tag such as `0.1.0`. Pushing that tag runs `.github/workflows/release.yml`.

The workflow:

1. Rejects a tag that differs from `manifest.json`.
2. Reinstalls the committed lockfile on GitHub Actions.
3. Repeats every verification step.
4. Attests the runtime files, checksums, and convenience ZIP.
5. Creates an unpublished **draft** GitHub release.
6. Uses the reviewed, version-specific release notes from the repository.
7. Attaches the required raw `main.js`, `manifest.json`, and `styles.css` files, plus the ZIP and checksums. The checksum labels match the downloaded asset filenames.

## 5. Inspect before publishing

Download the draft assets, confirm their checksums, install them into a clean vault, and repeat the smoke tests. Only then publish the draft release in GitHub.

Submitting the plugin to Obsidian's Community Plugins directory is a separate, later action.
