import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

interface Manifest {
  id: string;
  version: string;
  minAppVersion: string;
  authorUrl: string;
}

interface PackageMetadata {
  name: string;
  version: string;
  private: boolean;
  repository: {
    url: string;
  };
}

const projectRoot = new URL("../", import.meta.url);

async function readJson<T>(filename: string): Promise<T> {
  return JSON.parse(
    await readFile(new URL(filename, projectRoot), "utf8"),
  ) as T;
}

describe("release metadata", () => {
  it("keeps the package, manifest, and compatibility map aligned", async () => {
    const manifest = await readJson<Manifest>("manifest.json");
    const packageMetadata = await readJson<PackageMetadata>("package.json");
    const versions = await readJson<Record<string, string>>("versions.json");

    expect(packageMetadata.name).toBe(manifest.id);
    expect(packageMetadata.version).toBe(manifest.version);
    expect(packageMetadata.private).toBe(true);
    expect(packageMetadata.repository.url).toBe(
      "git+https://github.com/LoganJuhl/copy-all-note.git",
    );
    expect(manifest.authorUrl).toBe("https://github.com/LoganJuhl");
    expect(versions[manifest.version]).toBe(manifest.minAppVersion);
  });
});
