import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";

import "./verify-release.mjs";

const projectRoot = new URL("../", import.meta.url);
const distributionRoot = new URL("../dist/", import.meta.url);
const pluginRoot = new URL("copy-all-note/", distributionRoot);
const runtimeFiles = ["main.js", "manifest.json", "styles.css"];

await rm(distributionRoot, { recursive: true, force: true });
await mkdir(pluginRoot, { recursive: true });

const checksumLines = [];

for (const filename of runtimeFiles) {
  const source = new URL(filename, projectRoot);
  const destination = new URL(filename, pluginRoot);
  const contents = await readFile(source);
  const checksum = createHash("sha256").update(contents).digest("hex");

  await copyFile(source, destination);
  checksumLines.push(`${checksum}  copy-all-note/${filename}`);
}

await writeFile(
  new URL("SHA256SUMS.txt", distributionRoot),
  `${checksumLines.join("\n")}\n`,
  "utf8",
);

console.log("Prepared dist/copy-all-note with the three Obsidian runtime files.");
