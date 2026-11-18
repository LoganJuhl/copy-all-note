export interface CopyAllNoteSettings {
  includeFrontmatter: boolean;
  prependTitle: boolean;
  showNotice: boolean;
  showHeaderButton: boolean;
  icon: string;
}

function leadingFrontmatterEnd(markdown: string): number | null {
  const opening = /^\uFEFF?---[ \t]*(?:\r\n?|\n)/.exec(markdown);

  if (!opening) {
    return null;
  }

  const remainder = markdown.slice(opening[0].length);
  // YAML permits U+2028 and U+2029 inside values. Delimiters use physical lines.
  const closing = /(?:^|\r\n?|\n)---[ \t]*(?:\r\n?|\n|$)/.exec(remainder);

  if (!closing) {
    return null;
  }

  return opening[0].length + closing.index + closing[0].length;
}

export function stripLeadingFrontmatter(markdown: string): string {
  const frontmatterEnd = leadingFrontmatterEnd(markdown);

  return frontmatterEnd === null ? markdown : markdown.slice(frontmatterEnd);
}

export function buildPayload(
  markdown: string,
  basename: string,
  settings: CopyAllNoteSettings,
): string {
  if (!settings.prependTitle) {
    return settings.includeFrontmatter ? markdown : stripLeadingFrontmatter(markdown);
  }

  const frontmatterEnd = leadingFrontmatterEnd(markdown);
  const body =
    settings.includeFrontmatter || frontmatterEnd === null
      ? markdown
      : markdown.slice(frontmatterEnd);

  let eol = "\n";
  if (markdown.includes("\r\n")) {
    eol = "\r\n";
  } else if (markdown.includes("\r") && !markdown.includes("\n")) {
    eol = "\r";
  }

  const heading = `# ${basename}${eol}${eol}`;

  if (!settings.includeFrontmatter || frontmatterEnd === null) {
    const bom = body.startsWith("\uFEFF") ? "\uFEFF" : "";
    return `${bom}${heading}${body.slice(bom.length)}`;
  }

  const frontmatter = markdown.slice(0, frontmatterEnd);
  const separator = /[\r\n]$/.test(frontmatter) ? "" : eol;
  return `${frontmatter}${separator}${heading}${markdown.slice(frontmatterEnd)}`;
}

export function placeHeaderActionFirst(action: HTMLElement): void {
  const actions = action.parentElement;
  if (actions && actions.firstElementChild !== action) {
    actions.insertBefore(action, actions.firstElementChild);
  }
}
