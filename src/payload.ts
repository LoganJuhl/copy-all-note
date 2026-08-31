export interface CopyAllNoteSettings {
  includeFrontmatter: boolean;
  prependTitle: boolean;
  showNotice: boolean;
  showHeaderButton: boolean;
  icon: string;
}

function leadingFrontmatterEnd(markdown: string): number | null {
  const opening = markdown.match(/^\uFEFF?---[ \t]*(?:\r\n|\n)/);

  if (!opening) {
    return null;
  }

  const remainder = markdown.slice(opening[0].length);
  const closing = remainder.match(/^---[ \t]*(?:(?:\r\n|\n)|$)/m);

  if (!closing || closing.index === undefined) {
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
  const eol = markdown.includes("\r\n") ? "\r\n" : "\n";
  const frontmatterEnd = leadingFrontmatterEnd(markdown);
  const body =
    settings.includeFrontmatter || frontmatterEnd === null
      ? markdown
      : markdown.slice(frontmatterEnd);

  if (!settings.prependTitle) {
    return body;
  }

  const heading = `# ${basename}${eol}${eol}`;

  if (!settings.includeFrontmatter || frontmatterEnd === null) {
    const bom = body.startsWith("\uFEFF") ? "\uFEFF" : "";
    return `${bom}${heading}${body.slice(bom.length)}`;
  }

  const frontmatter = markdown.slice(0, frontmatterEnd);
  const separator = frontmatter.endsWith("\n") ? "" : eol;
  return `${frontmatter}${separator}${heading}${markdown.slice(frontmatterEnd)}`;
}

export function placeHeaderActionFirst(action: HTMLElement): void {
  const actions = action.parentElement;
  if (actions && actions.firstElementChild !== action) {
    actions.insertBefore(action, actions.firstElementChild);
  }
}
