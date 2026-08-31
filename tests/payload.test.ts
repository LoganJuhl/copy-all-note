import { describe, expect, it } from "vitest";
import {
  buildPayload,
  stripLeadingFrontmatter,
  type CopyAllNoteSettings,
} from "../src/payload";

function settings(
  overrides: Partial<CopyAllNoteSettings> = {},
): CopyAllNoteSettings {
  return {
    includeFrontmatter: true,
    prependTitle: false,
    showNotice: true,
    showHeaderButton: true,
    icon: "copy",
    ...overrides,
  };
}

describe("stripLeadingFrontmatter", () => {
  it("strips BOM and whitespace-tolerant CRLF frontmatter", () => {
    const markdown = "\uFEFF---  \r\ntags: [one]\r\n--- \r\nBody\r\n";

    expect(stripLeadingFrontmatter(markdown)).toBe("Body\r\n");
  });

  it("leaves an unclosed frontmatter block untouched", () => {
    const markdown = "---\nkey: value\nBody";

    expect(stripLeadingFrontmatter(markdown)).toBe(markdown);
  });
});

describe("buildPayload", () => {
  it("places an LF title below retained frontmatter", () => {
    const markdown = "---\ntags: [one]\n---\nBody\n";

    expect(buildPayload(markdown, "Example", settings({ prependTitle: true })))
      .toBe("---\ntags: [one]\n---\n# Example\n\nBody\n");
  });

  it("places a CRLF title below retained frontmatter using CRLF", () => {
    const markdown = "---\r\ntags: [one]\r\n---\r\nBody\r\n";

    expect(buildPayload(markdown, "Example", settings({ prependTitle: true })))
      .toBe("---\r\ntags: [one]\r\n---\r\n# Example\r\n\r\nBody\r\n");
  });

  it("keeps a BOM first and places the title below frontmatter", () => {
    const markdown = "\uFEFF---\nkey: value\n---\nBody";

    const payload = buildPayload(
      markdown,
      "Example",
      settings({ prependTitle: true }),
    );

    expect(payload).toBe("\uFEFF---\nkey: value\n---\n# Example\n\nBody");
    expect(payload.startsWith("\uFEFF")).toBe(true);
  });

  it("prepends the title when there is no frontmatter", () => {
    expect(buildPayload("Body", "Example", settings({ prependTitle: true })))
      .toBe("# Example\n\nBody");
  });

  it("keeps a BOM at byte zero when there is no frontmatter", () => {
    expect(
      buildPayload("\uFEFFBody", "Example", settings({ prependTitle: true })),
    ).toBe("\uFEFF# Example\n\nBody");
  });

  it("strips frontmatter before prepending the title", () => {
    const markdown = "---\nkey: value\n---\nBody";

    expect(
      buildPayload(
        markdown,
        "Example",
        settings({ includeFrontmatter: false, prependTitle: true }),
      ),
    ).toBe("# Example\n\nBody");
    expect(
      buildPayload(
        markdown,
        "Example",
        settings({ includeFrontmatter: false, prependTitle: false }),
      ),
    ).toBe("Body");
  });

  it.each([
    { includeFrontmatter: true, prependTitle: true, expected: "# Empty\n\n" },
    { includeFrontmatter: false, prependTitle: true, expected: "# Empty\n\n" },
    { includeFrontmatter: true, prependTitle: false, expected: "" },
    { includeFrontmatter: false, prependTitle: false, expected: "" },
  ])(
    "handles an empty note with includeFrontmatter=$includeFrontmatter and prependTitle=$prependTitle",
    ({ includeFrontmatter, prependTitle, expected }) => {
      expect(
        buildPayload(
          "",
          "Empty",
          settings({ includeFrontmatter, prependTitle }),
        ),
      ).toBe(expected);
    },
  );

  it("returns retained frontmatter byte-for-byte when title is disabled", () => {
    const markdown = "\uFEFF---\r\nkey: value\r\n---\r\nBody\r\n";

    expect(buildPayload(markdown, "Example", settings())).toBe(markdown);
  });

  it("separates a frontmatter closing delimiter at EOF from the title", () => {
    const markdown = "---\nkey: value\n---";

    expect(buildPayload(markdown, "Example", settings({ prependTitle: true })))
      .toBe("---\nkey: value\n---\n# Example\n\n");
  });
});
