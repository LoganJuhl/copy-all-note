# Releasing

A version tag builds a **draft** GitHub release. The workflow does not publish it.

## Version

Use the same `x.y.z` version, without a leading `v`, in:

- `package.json`
- `package-lock.json` at the top level and in `packages[""]`
- `manifest.json`
- `versions.json`, mapped to the minimum Obsidian version actually tested
- `CHANGELOG.md`
- `.github/release-notes/<version>.md`

Keep old `versions.json` entries. Don't move a tag or replace files from a release already distributed.

## Check

```bash
npm ci
npm audit
npm audit --omit=dev
npm run release:prepare
```

`release:prepare` lints, typechecks, tests, builds, checks metadata and runtime imports, then writes:

```text
dist/
├── SHA256SUMS.txt
└── copy-all-note/
    ├── main.js
    ├── manifest.json
    └── styles.css
```

Report development-tool advisories separately from shipped runtime exposure. The bundle imports only Obsidian at runtime.

Install `dist/copy-all-note/` in a throwaway vault. For behavior changes, run the relevant matrix in [CONTRIBUTING.md](../CONTRIBUTING.md). If `main.js` and `styles.css` match a release already tested, record that comparison and its limitations, then smoke-test loading, header copy, command copy, and the exact clipboard text.

Don't commit dependencies, generated files, vaults, local settings, logs, source maps, archives, or credentials.

## Review and tag

Review the diff, open a pull request against current `main`, and wait for CI and review. After merge, fetch `main` and confirm the commit SHA, version fields, compatibility mapping, and changelog.

Create an annotated tag matching that version and push it. `.github/workflows/release.yml` then:

1. Rejects a tag that doesn't match `manifest.json`.
2. Installs the committed lockfile and runs `release:prepare`.
3. Creates the ZIP and checksums, then attests the runtime files, ZIP, and checksum file.
4. Opens a draft release using `.github/release-notes/<version>.md`.
5. Attaches those files. Checksums use the download names rather than `dist/` paths.

## Publish

Require a successful release workflow. Check the draft's tag, notes, assets, attestations, and that it is not marked prerelease.

Download the draft assets and verify `SHA256SUMS.txt`. Rebuild the exact tag from a clean dependency installation and compare `main.js`, `manifest.json`, and `styles.css` byte-for-byte with the downloads. Confirm the vault smoke test covered those runtime files. Resolve unexpected differences before publishing.

Publish the draft after that review. Download the public assets without authentication and compare their hashes with the verified draft.

## Community directory

Copy All Note is [listed in Community](https://community.obsidian.md/plugins/copy-all-note). The directory reads `manifest.json` on the default branch; its version needs a matching public GitHub release. Users can download updates in Obsidian after publication. A new release does not need a new directory submission.

For a new plugin, use the current [submission instructions](https://docs.obsidian.md/plugins/releasing/submit-plugin). If a review fix changes the runtime files or manifest, ship a new version rather than replacing published assets.

After publication, verify the version, installation, enabling, and copying through **Settings → Community plugins** in a clean vault.
