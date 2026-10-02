import {
  debounce,
  getIcon,
  MarkdownView,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
} from "obsidian";
import type {
  App,
  Command,
  Debouncer,
} from "obsidian";
import {
  buildPayload,
  placeHeaderActionFirst,
  stripLeadingFrontmatter,
} from "./payload";
import type { CopyAllNoteSettings } from "./payload";

export {
  buildPayload,
  placeHeaderActionFirst,
  stripLeadingFrontmatter,
};
export type { CopyAllNoteSettings };

const DEFAULT_SETTINGS: CopyAllNoteSettings = {
  includeFrontmatter: true,
  prependTitle: false,
  showNotice: true,
  showHeaderButton: true,
  icon: "copy",
};

const ACTION_CLASS = "copy-all-note-action";
const ACTION_SELECTOR = `.view-actions > .${ACTION_CLASS}`;
const ACTION_TOOLTIP = "Copy entire note";

function restoreFocusAndSelection(
  activeElement: HTMLElement | null,
  selection: Selection | null,
  range: Range | null,
): void {
  if (selection && range) {
    try {
      selection.removeAllRanges();
      selection.addRange(range);
    } catch {
      // The previous selection can disappear while a mobile view is changing.
    }
  }

  if (activeElement) {
    try {
      activeElement.focus({ preventScroll: true });
    } catch {
      try {
        activeElement.focus();
      } catch {
        // Restoring focus is best-effort after the clipboard operation.
      }
    }
  }
}

function copyWithTextarea(markdown: string, ownerDocument: Document): void {
  // An empty selection can make execCommand report success without copying.
  if (markdown.length === 0) {
    throw new Error("The browser clipboard fallback cannot copy empty text.");
  }

  const HTMLElementConstructor = ownerDocument.defaultView?.HTMLElement;
  const activeElement =
    HTMLElementConstructor &&
    ownerDocument.activeElement instanceof HTMLElementConstructor
      ? ownerDocument.activeElement
      : null;
  const selection = ownerDocument.getSelection();
  const range =
    selection && selection.rangeCount > 0
      ? selection.getRangeAt(0).cloneRange()
      : null;
  const textarea = ownerDocument.body.createEl("textarea", {
    cls: "copy-all-note-clipboard-buffer",
    attr: {
      readonly: "",
      "aria-hidden": "true",
    },
  });
  textarea.value = markdown;

  try {
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, markdown.length);

    const legacyDocument = ownerDocument as unknown as {
      execCommand?: (commandId: string) => boolean;
    };

    if (!legacyDocument.execCommand?.call(ownerDocument, "copy")) {
      throw new Error("The browser clipboard fallback was rejected.");
    }
  } finally {
    textarea.remove();
    restoreFocusAndSelection(activeElement, selection, range);
  }
}

async function writeClipboard(
  markdown: string,
  ownerDocument: Document,
): Promise<void> {
  let clipboardError: unknown;
  const viewNavigator = ownerDocument.defaultView?.navigator;

  try {
    if (viewNavigator?.clipboard?.writeText) {
      await viewNavigator.clipboard.writeText(markdown);
      return;
    }
  } catch (error) {
    clipboardError = error;
  }

  try {
    copyWithTextarea(markdown, ownerDocument);
  } catch (fallbackError) {
    if (clipboardError) {
      console.error(
        "Copy All Note: navigator.clipboard.writeText failed before the fallback.",
        clipboardError,
      );
    }

    throw fallbackError;
  }
}

export default class CopyAllNotePlugin extends Plugin {
  settings: CopyAllNoteSettings = { ...DEFAULT_SETTINGS };

  private readonly headerActions = new Map<MarkdownView, HTMLElement>();
  private copyCommand: Command | null = null;
  private headerRefreshQueued = false;
  private unloading = false;

  async onload(): Promise<void> {
    await this.loadSettings();

    // Deliberately use checkCallback, not editorCheckCallback: Reading view
    // has no editor, but the command must work there too.
    this.copyCommand = this.addCommand({
      id: "copy-entire-note",
      name: "Copy entire note",
      icon: this.resolveIcon(),
      checkCallback: (checking) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);

        if (!view?.file) {
          return false;
        }

        if (!checking) {
          void this.copyFromView(view);
        }

        return true;
      },
    });

    this.addSettingTab(new CopyAllNoteSettingTab(this.app, this));

    this.registerEvent(
      this.app.workspace.on("layout-change", () =>
        this.scheduleHeaderActionRefresh(),
      ),
    );
    this.registerEvent(
      this.app.workspace.on("file-open", () =>
        this.scheduleHeaderActionRefresh(),
      ),
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () =>
        this.scheduleHeaderActionRefresh(),
      ),
    );

    this.app.workspace.onLayoutReady(() => {
      this.scheduleHeaderActionRefresh();
    });
  }

  onunload(): void {
    this.unloading = true;
    this.copyCommand = null;
    this.removeTrackedHeaderActions();
  }

  async saveSettings(rebuildHeaderActions = false): Promise<void> {
    if (rebuildHeaderActions) {
      if (this.copyCommand) {
        this.copyCommand.icon = this.resolveIcon();
      }

      this.refreshHeaderActions(true);
    }

    await this.saveData(this.settings);
  }

  private scheduleHeaderActionRefresh(): void {
    if (this.unloading || this.headerRefreshQueued) {
      return;
    }

    this.headerRefreshQueued = true;
    queueMicrotask(() => {
      this.headerRefreshQueued = false;

      if (!this.unloading) {
        this.refreshHeaderActions();
      }
    });
  }

  refreshHeaderActions(rebuild = false): void {
    if (this.unloading) {
      return;
    }

    if (rebuild) {
      this.removeAllHeaderActions();
    }

    if (!this.settings.showHeaderButton) {
      this.removeAllHeaderActions();
      return;
    }

    const liveViews = new Set<MarkdownView>();

    this.app.workspace.iterateAllLeaves((leaf) => {
      if (!(leaf.view instanceof MarkdownView)) {
        return;
      }

      const view = leaf.view;
      liveViews.add(view);

      if (view.file) {
        this.attachHeaderAction(view);
      } else {
        this.removeHeaderAction(view);
      }
    });

    for (const [view, action] of this.headerActions) {
      if (!liveViews.has(view) || !view.file || !action.isConnected) {
        action.remove();
        this.headerActions.delete(view);
      }
    }
  }

  private async loadSettings(): Promise<void> {
    const loaded = (await this.loadData()) as Partial<CopyAllNoteSettings> | null;

    this.settings = {
      includeFrontmatter:
        typeof loaded?.includeFrontmatter === "boolean"
          ? loaded.includeFrontmatter
          : DEFAULT_SETTINGS.includeFrontmatter,
      prependTitle:
        typeof loaded?.prependTitle === "boolean"
          ? loaded.prependTitle
          : DEFAULT_SETTINGS.prependTitle,
      showNotice:
        typeof loaded?.showNotice === "boolean"
          ? loaded.showNotice
          : DEFAULT_SETTINGS.showNotice,
      showHeaderButton:
        typeof loaded?.showHeaderButton === "boolean"
          ? loaded.showHeaderButton
          : DEFAULT_SETTINGS.showHeaderButton,
      icon:
        typeof loaded?.icon === "string" && loaded.icon.trim()
          ? loaded.icon.trim()
          : DEFAULT_SETTINGS.icon,
    };
  }

  private attachHeaderAction(view: MarkdownView): void {
    const trackedAction = this.headerActions.get(view);

    if (
      trackedAction?.isConnected &&
      view.containerEl.contains(trackedAction)
    ) {
      view.containerEl
        .querySelectorAll<HTMLElement>(ACTION_SELECTOR)
        .forEach((action) => {
          if (action !== trackedAction) {
            action.remove();
          }
        });
      placeHeaderActionFirst(trackedAction);
      return;
    }

    if (trackedAction) {
      trackedAction.remove();
      this.headerActions.delete(view);
    }

    view.containerEl
      .querySelectorAll<HTMLElement>(ACTION_SELECTOR)
      .forEach((action) => action.remove());

    try {
      const action = view.addAction(
        this.resolveIcon(),
        ACTION_TOOLTIP,
        () => {
          void this.copyFromView(view);
        },
      );

      action.addClass(ACTION_CLASS);
      placeHeaderActionFirst(action);
      this.headerActions.set(view, action);
    } catch (error) {
      console.error(
        "Copy All Note: could not attach the Markdown view header action.",
        error,
      );
    }
  }

  private removeHeaderAction(view: MarkdownView): void {
    const action = this.headerActions.get(view);

    if (action) {
      action.remove();
      this.headerActions.delete(view);
    }

    view.containerEl
      .querySelectorAll<HTMLElement>(ACTION_SELECTOR)
      .forEach((orphan) => orphan.remove());
  }

  private removeAllHeaderActions(): void {
    this.removeTrackedHeaderActions();

    this.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view instanceof MarkdownView) {
        leaf.view.containerEl
          .querySelectorAll<HTMLElement>(ACTION_SELECTOR)
          .forEach((action) => action.remove());
      }
    });
  }

  private removeTrackedHeaderActions(): void {
    for (const action of this.headerActions.values()) {
      action.remove();
    }

    this.headerActions.clear();
  }

  private resolveIcon(): string {
    const candidates = [
      this.settings.icon.trim(),
      "copy",
      "clipboard-copy",
      "clipboard",
    ];

    for (const icon of new Set(candidates)) {
      if (icon && getIcon(icon)) {
        return icon;
      }
    }

    return DEFAULT_SETTINGS.icon;
  }

  private async copyFromView(view: MarkdownView): Promise<void> {
    try {
      const file = view.file;

      if (!file) {
        new Notice("No Markdown note is open.", 3000);
        return;
      }

      let markdown: unknown;
      try {
        markdown = view.getViewData();
      } catch (error) {
        console.error(
          "Copy All Note: current view data was unavailable.",
          error,
        );
        throw new Error("Current note content is unavailable.");
      }

      if (typeof markdown !== "string") {
        new Notice(
          "Could not copy note because its live content is unavailable.",
          5000,
        );
        return;
      }

      const payload = buildPayload(markdown, file.basename, this.settings);
      await writeClipboard(payload, view.containerEl.ownerDocument);

      if (this.settings.showNotice) {
        new Notice("Copied note", 2000);
      }
    } catch (error) {
      console.error("Copy All Note: failed to copy the note.", error);
      new Notice(
        "Could not copy note. Try again or check clipboard access.",
        5000,
      );
    }
  }
}

// Imperative settings keep the declared Obsidian 1.5 compatibility without
// shipping a second, declarative implementation for Obsidian 1.13 and later.
class CopyAllNoteSettingTab extends PluginSettingTab {
  private readonly persistIconSettings: Debouncer<[], Promise<void>>;

  constructor(
    app: App,
    private readonly plugin: CopyAllNotePlugin,
  ) {
    super(app, plugin);
    this.persistIconSettings = debounce(
      async () => this.plugin.saveSettings(true),
      400,
      true,
    );
    this.plugin.register(() => {
      void this.persistIconSettings.run();
    });
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Include frontmatter")
      .setDesc("Keep a leading YAML frontmatter block in the copied Markdown.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.includeFrontmatter)
          .onChange(async (value) => {
            this.plugin.settings.includeFrontmatter = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Prepend title")
      .setDesc(
        "Add the note basename as a level-1 heading before the copied Markdown.",
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.prependTitle)
          .onChange(async (value) => {
            this.plugin.settings.prependTitle = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Show success notice")
      .setDesc("Show a short notice after the note is copied.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showNotice)
          .onChange(async (value) => {
            this.plugin.settings.showNotice = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Show header button")
      .setDesc("Show the native action in each Markdown view header.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showHeaderButton)
          .onChange(async (value) => {
            this.plugin.settings.showHeaderButton = value;
            await this.plugin.saveSettings(true);
          }),
      );

    new Setting(containerEl)
      .setName("Icon")
      .setDesc(
        "Advanced: enter a non-empty icon name. Unknown names fall back to copy, clipboard-copy, or clipboard.",
      )
      .addText((text) => {
        text
          .setPlaceholder(DEFAULT_SETTINGS.icon)
          .setValue(this.plugin.settings.icon)
          .onChange((value) => {
            const icon = value.trim();
            text.inputEl.setAttribute(
              "aria-invalid",
              icon ? "false" : "true",
            );

            if (!icon) {
              return;
            }

            this.plugin.settings.icon = icon;
            this.persistIconSettings();
          });

        this.plugin.registerDomEvent(text.inputEl, "blur", () => {
          if (!text.getValue().trim()) {
            text.setValue(this.plugin.settings.icon);
            text.inputEl.setAttribute("aria-invalid", "false");
            new Notice("Icon name cannot be empty.", 3000);
          }
        });
      });
  }
}
