import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";

const projectRoot = new URL("../", import.meta.url);
const errors = [];

async function readJson(filename) {
  return JSON.parse(await readFile(new URL(filename, projectRoot), "utf8"));
}

function check(condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

const [packageMetadata, packageLock, manifest, versions] = await Promise.all([
  readJson("package.json"),
  readJson("package-lock.json"),
  readJson("manifest.json"),
  readJson("versions.json"),
]);

check(packageMetadata.private === true, "package.json must remain private to npm.");
check(packageMetadata.name === manifest.id, "Package name and manifest ID differ.");
check(
  packageMetadata.version === manifest.version,
  "Package and manifest versions differ.",
);
check(
  packageLock.version === packageMetadata.version,
  "Package-lock top-level version differs from package.json.",
);
check(
  packageLock.packages?.[""]?.version === packageMetadata.version,
  "Package-lock root package version differs from package.json.",
);
check(
  /^\d+\.\d+\.\d+$/.test(manifest.version),
  "Manifest version must use Obsidian's x.y.z format without a leading v.",
);
check(
  versions[manifest.version] === manifest.minAppVersion,
  "versions.json must map the release version to minAppVersion.",
);
check(
  packageMetadata.repository?.url ===
    "git+https://github.com/LoganJuhl/copy-all-note.git",
  "Repository metadata points somewhere unexpected.",
);
check(
  manifest.authorUrl === "https://github.com/LoganJuhl",
  "Manifest author URL points somewhere unexpected.",
);

for (const filename of ["main.js", "manifest.json", "styles.css"]) {
  const details = await stat(new URL(filename, projectRoot));
  check(details.isFile() && details.size > 0, `${filename} is missing or empty.`);
}

const bundle = await readFile(new URL("main.js", projectRoot), "utf8");
const runtimeImports = new Set(
  [...bundle.matchAll(/\brequire\(\s*["']([^"']+)["']\s*\)/g)].map(
    (match) => match[1],
  ),
);

check(runtimeImports.has("obsidian"), "The bundle must import Obsidian.");
check(
  [...runtimeImports].every((specifier) => specifier === "obsidian"),
  `Unexpected runtime import(s): ${[...runtimeImports]
    .filter((specifier) => specifier !== "obsidian")
    .join(", ")}`,
);
check(
  !bundle.includes("sourceMappingURL="),
  "Production main.js must not contain a source map.",
);

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`Release check failed: ${error}`);
  }
  process.exit(1);
}

const bundleSha256 = createHash("sha256").update(bundle).digest("hex");
console.log(
  `Release checks passed for ${manifest.id} ${manifest.version} (${bundleSha256}).`,
);
