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

Use a minimum Obsidian version supported by native testing. Retain historical entries in `versions.json`. Do not reuse a version that has already been distributed or move an existing tag. Released bytes are immutable.

## 2. Verify from locked dependencies

```bash
npm ci
npm audit
npm audit --omit=dev
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

Report development-tooling advisories separately from shipped runtime exposure. Install `dist/copy-all-note/` into a throwaway vault and follow [CONTRIBUTING.md](../CONTRIBUTING.md): run the relevant manual matrix for runtime changes, or a focused smoke test when both runtime files match previously tested assets byte-for-byte. Record the hashes, metadata differences, and any carried-forward test limitations.

## 3. Review repository state

Confirm that only intended source, documentation, configuration, and lockfile changes are included. Never include `node_modules`, `main.js`, `dist`, `data.json`, vault files, archives, logs, source maps, credentials, or local editor settings.

## 4. Review, merge, and tag deliberately

Review the exact staged files before committing and pushing a release branch. Open a pull request against current `main`, wait for CI, and obtain maintainer approval before merging.

Fetch the merged `main` and verify its commit SHA, package and manifest versions, compatibility mapping, and changelog. With maintainer approval, create an annotated tag matching the exact version, such as `0.1.1`, on that commit. Do not add a leading `v`. Pushing the tag runs `.github/workflows/release.yml`.

The workflow:

1. Rejects a tag that differs from `manifest.json`.
2. Reinstalls the committed lockfile on GitHub Actions.
3. Repeats every verification step.
4. Attests the runtime files, checksums, and convenience ZIP.
5. Creates an unpublished **draft** GitHub release.
6. Uses the reviewed, version-specific release notes from the repository.
7. Attaches the required raw `main.js`, `manifest.json`, and `styles.css` files, plus the ZIP and checksums. The checksum labels match the downloaded asset filenames.

## 5. Inspect before publishing

Require a successful release workflow. Check the draft's tag, release notes, asset list, attestations, and that it is not a prerelease. The workflow adds the convenience ZIP and publishes checksums using the downloaded asset filenames.

Download the exact draft assets and verify their checksums. Rebuild the exact tag from a clean dependency installation and compare `main.js`, `manifest.json`, and `styles.css` byte-for-byte with those downloads. Confirm that the clean-vault smoke test covered these exact runtime bytes. Investigate differences before publishing.

Present the release verification results and obtain explicit maintainer approval before publishing the existing draft. Then download the public assets without authentication, compare their hashes with the verified draft, and record the release URL and publication time.

## 6. Submit to the Community directory

Follow the current [official submission instructions](https://docs.obsidian.md/plugins/releasing/submit-plugin). Sign into [the Community directory](https://community.obsidian.md), connect the GitHub account, and check for an existing submission before adding the repository. The directory reads the default branch's manifest, and its version must have a corresponding public GitHub release.

Review policy and maintenance commitments, complete the automated review, and resolve blocking errors. If a correction changes published runtime assets or manifest metadata, use a new version instead of replacing released files.

After the listing is published, install it through **Settings → Community plugins** in a clean vault and verify search, installation, enabling, the version, and copying. Only after that succeeds should the README advertise Community installation as its primary path.
