import { JSDOM } from "jsdom";
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";
import {
  MarkdownView,
  type App,
  type Command,
  type PluginManifest,
  type TFile,
} from "obsidian";
import CopyAllNotePlugin from "../src/main";
import {
  notices,
  resetNotices,
  resetTextComponents,
  textComponents,
} from "./obsidian.mock";

interface TestView extends MarkdownView {
  containerEl: HTMLElement;
  file: TFile | null;
  getViewData: () => string;
  addAction: (
    icon: string,
    title: string,
    callback: (event: MouseEvent) => unknown,
  ) => HTMLElement;
}

interface AppHarness {
  app: App;
  leaves: MarkdownView[];
  cachedRead: Mock;
  read: Mock;
}

function createDom(): JSDOM {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "https://obsidian.local/",
  });

  Object.defineProperty(dom.window.HTMLElement.prototype, "addClass", {
    configurable: true,
    value(this: HTMLElement, ...classes: string[]) {
      this.classList.add(...classes);
    },
  });

  Object.defineProperty(dom.window.HTMLElement.prototype, "createEl", {
    configurable: true,
    value(
      this: HTMLElement,
      tag: string,
      options?: { cls?: string; attr?: Record<string, string> },
    ) {
      const element = this.ownerDocument.createElement(tag);
      if (options?.cls) {
        element.className = options.cls;
      }
      for (const [name, value] of Object.entries(options?.attr ?? {})) {
        element.setAttribute(name, value);
      }
      this.appendChild(element);
      return element;
    },
  });

  Object.defineProperty(dom.window.HTMLElement.prototype, "empty", {
    configurable: true,
    value(this: HTMLElement) {
      this.replaceChildren();
    },
  });

  return dom;
}

function setClipboard(dom: JSDOM, writeText: Mock): void {
  Object.defineProperty(dom.window.navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
}

function createView(
  dom: JSDOM,
  markdown: string,
  basename = "Note",
): { view: TestView; actions: HTMLElement } {
  const { document } = dom.window;
  const containerEl = document.createElement("section");
  const actions = document.createElement("div");
  actions.className = "view-actions";
  containerEl.appendChild(actions);
  document.body.appendChild(containerEl);

  const view = Object.create(MarkdownView.prototype) as TestView;
  view.containerEl = containerEl;
  view.file = { basename, path: `${basename}.md` } as TFile;
  view.getViewData = () => markdown;
  view.addAction = (icon, title, callback) => {
    const action = document.createElement("button");
    action.dataset.icon = icon;
    action.setAttribute("aria-label", title);
    action.addEventListener("click", (event) => callback(event));
    actions.appendChild(action);
    return action;
  };

  return { view, actions };
}

function createApp(saved = "SAVED"): AppHarness {
  const leaves: MarkdownView[] = [];
  const cachedRead = vi.fn(async () => saved);
  const read = vi.fn(async () => saved);
  const app = {
    vault: { cachedRead, read },
    workspace: {
      getActiveViewOfType() {
        return null;
      },
      iterateAllLeaves(callback: (leaf: { view: MarkdownView }) => void) {
        for (const view of leaves) {
          callback({ view });
        }
      },
      on() {
        return {};
      },
      onLayoutReady() {},
    },
  } as unknown as App;

  return { app, leaves, cachedRead, read };
}

function createPlugin(app: App): CopyAllNotePlugin {
  return new CopyAllNotePlugin(app, {} as PluginManifest);
}

async function copyFromView(
  plugin: CopyAllNotePlugin,
  view: MarkdownView,
): Promise<void> {
  await (
    plugin as unknown as {
      copyFromView(markdownView: MarkdownView): Promise<void>;
    }
  ).copyFromView(view);
}

afterEach(() => {
  vi.useRealTimers();
  resetNotices();
  resetTextComponents();
});

describe("copy behavior", () => {
  it("copies a valid empty unsaved buffer without reading stale disk content", async () => {
    const dom = createDom();
    const writeText = vi.fn(async () => undefined);
    setClipboard(dom, writeText);
    const harness = createApp("SAVED SECRET");
    const plugin = createPlugin(harness.app);
    const { view } = createView(dom, "");

    await copyFromView(plugin, view);

    expect(writeText).toHaveBeenCalledWith("");
    expect(harness.cachedRead).not.toHaveBeenCalled();
    expect(harness.read).not.toHaveBeenCalled();
    expect(notices).toContainEqual({ message: "Copied note", timeout: 2000 });
  });

  it("uses the clicked pop-out view's clipboard instead of the main window", async () => {
    const mainDom = createDom();
    const popoutDom = createDom();
    const mainWrite = vi.fn(async () => undefined);
    const popoutWrite = vi.fn(async () => undefined);
    setClipboard(mainDom, mainWrite);
    setClipboard(popoutDom, popoutWrite);
    const harness = createApp();
    const plugin = createPlugin(harness.app);
    const { view } = createView(popoutDom, "Pop-out text");

    await copyFromView(plugin, view);

    expect(popoutWrite).toHaveBeenCalledWith("Pop-out text");
    expect(mainWrite).not.toHaveBeenCalled();
  });

  it("runs the registered command without requiring an editor", async () => {
    const dom = createDom();
    const writeText = vi.fn(async () => undefined);
    setClipboard(dom, writeText);
    const harness = createApp();
    const plugin = createPlugin(harness.app);
    const { view } = createView(dom, "Reading view text");
    (
      harness.app.workspace as unknown as {
        getActiveViewOfType: () => MarkdownView | null;
      }
    ).getActiveViewOfType = () => view;

    await plugin.onload();

    const command = (
      plugin as unknown as { copyCommand: Command | null }
    ).copyCommand;
    expect(command?.checkCallback).toBeDefined();
    if (!command?.checkCallback) {
      throw new Error("The copy command did not register a check callback.");
    }

    expect(command.checkCallback(true)).toBe(true);
    expect(command.checkCallback(false)).toBe(true);

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("Reading view text");
    });
  });

  it("fails closed when the live view buffer is unavailable", async () => {
    const dom = createDom();
    const writeText = vi.fn(async () => undefined);
    setClipboard(dom, writeText);
    const harness = createApp("STALE DISK CONTENT");
    const plugin = createPlugin(harness.app);
    const { view } = createView(dom, "unused");
    view.getViewData = () => {
      throw new Error("view unavailable");
    };

    await copyFromView(plugin, view);

    expect(writeText).not.toHaveBeenCalled();
    expect(harness.cachedRead).not.toHaveBeenCalled();
    expect(harness.read).not.toHaveBeenCalled();
    expect(notices).toEqual([
      {
        message: "Could not copy note. Try again or check clipboard access.",
        timeout: 5000,
      },
    ]);
  });

  it.each([
    { label: "undefined", value: undefined },
    { label: "null", value: null },
    { label: "a number", value: 0 },
    { label: "an object", value: {} },
    { label: "an array", value: [] },
  ])("rejects $label returned as live view data", async ({ value }) => {
    const dom = createDom();
    const writeText = vi.fn(async () => undefined);
    setClipboard(dom, writeText);
    const harness = createApp("STALE DISK CONTENT");
    const plugin = createPlugin(harness.app);
    const { view } = createView(dom, "unused");
    (
      view as unknown as {
        getViewData: () => unknown;
      }
    ).getViewData = () => value;

    await copyFromView(plugin, view);

    expect(writeText).not.toHaveBeenCalled();
    expect(harness.cachedRead).not.toHaveBeenCalled();
    expect(harness.read).not.toHaveBeenCalled();
    expect(notices).toEqual([
      {
        message: "Could not copy note because its live content is unavailable.",
        timeout: 5000,
      },
    ]);
  });

  it("clears the clipboard through the legacy fallback for an empty buffer", async () => {
    const dom = createDom();
    let fallbackValue: string | null = null;
    const execCommand = vi.fn(() => {
      fallbackValue = (
        dom.window.document.querySelector("textarea") as HTMLTextAreaElement
      ).value;
      return true;
    });
    Object.defineProperty(dom.window.document, "execCommand", {
      configurable: true,
      value: execCommand,
    });
    const harness = createApp("STALE DISK CONTENT");
    const plugin = createPlugin(harness.app);
    const { view } = createView(dom, "");

    await copyFromView(plugin, view);

    expect(fallbackValue).toBe("");
    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(dom.window.document.querySelector("textarea")).toBeNull();
    expect(harness.cachedRead).not.toHaveBeenCalled();
  });

  it("keeps the legacy clipboard fallback inside the pop-out document", async () => {
    const mainDom = createDom();
    const popoutDom = createDom();
    const mainExec = vi.fn(() => {
      throw new Error("main document must not be used");
    });
    const popoutExec = vi.fn(() => true);
    Object.defineProperty(mainDom.window.document, "execCommand", {
      configurable: true,
      value: mainExec,
    });
    Object.defineProperty(popoutDom.window.document, "execCommand", {
      configurable: true,
      value: popoutExec,
    });
    const harness = createApp();
    const plugin = createPlugin(harness.app);
    const { view } = createView(popoutDom, "Pop-out fallback");

    await copyFromView(plugin, view);

    expect(popoutExec).toHaveBeenCalledWith("copy");
    expect(mainExec).not.toHaveBeenCalled();
    expect(mainDom.window.document.querySelector("textarea")).toBeNull();
    expect(popoutDom.window.document.querySelector("textarea")).toBeNull();
  });

  it("falls back to execCommand and restores focus", async () => {
    const dom = createDom();
    const writeText = vi.fn(async () => {
      throw new Error("denied");
    });
    setClipboard(dom, writeText);
    const execCommand = vi.fn(() => true);
    Object.defineProperty(dom.window.document, "execCommand", {
      configurable: true,
      value: execCommand,
    });
    const focusTarget = dom.window.document.createElement("input");
    dom.window.document.body.appendChild(focusTarget);
    focusTarget.focus();
    const harness = createApp();
    const plugin = createPlugin(harness.app);
    const { view } = createView(dom, "Fallback text");

    await copyFromView(plugin, view);

    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(dom.window.document.querySelector("textarea")).toBeNull();
    expect(dom.window.document.activeElement).toBe(focusTarget);
  });
});

describe("settings persistence", () => {
  it("debounces a 15-character icon edit into one save and one rebuild", async () => {
    vi.useFakeTimers();
    const dom = createDom();
    const harness = createApp();
    const plugin = createPlugin(harness.app);
    const saveSettings = vi.spyOn(plugin, "saveSettings");
    const saveData = vi.spyOn(plugin, "saveData");
    const refreshHeaderActions = vi.spyOn(plugin, "refreshHeaderActions");

    await plugin.onload();

    const [settingTab] = (
      plugin as unknown as {
        settingTabs: Array<{
          containerEl: HTMLElement;
          display(): void;
        }>;
      }
    ).settingTabs;

    expect(settingTab).toBeDefined();
    if (!settingTab) {
      throw new Error("The plugin did not register its settings tab.");
    }

    settingTab.containerEl = dom.window.document.createElement("section");
    settingTab.display();

    const iconInput = textComponents[textComponents.length - 1];
    expect(iconInput).toBeDefined();
    if (!iconInput) {
      throw new Error("The icon text control was not rendered.");
    }

    const icon = "clipboard-check";
    expect(icon).toHaveLength(15);

    for (let index = 1; index <= icon.length; index += 1) {
      await iconInput.triggerChange(icon.slice(0, index));
      if (index < icon.length) {
        await vi.advanceTimersByTimeAsync(100);
      }
    }

    expect(plugin.settings.icon).toBe(icon);
    expect(iconInput.inputEl.getAttribute("aria-invalid")).toBe("false");
    expect(saveSettings).not.toHaveBeenCalled();
    expect(saveData).not.toHaveBeenCalled();
    expect(refreshHeaderActions).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(399);
    expect(saveSettings).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(saveSettings).toHaveBeenCalledTimes(1);
    expect(saveSettings).toHaveBeenCalledWith(true);
    expect(saveData).toHaveBeenCalledTimes(1);
    expect(refreshHeaderActions).toHaveBeenCalledTimes(1);
    expect(refreshHeaderActions).toHaveBeenCalledWith(true);
  });

  it("flushes a pending icon edit when the plugin unloads", async () => {
    vi.useFakeTimers();
    const dom = createDom();
    const harness = createApp();
    const plugin = createPlugin(harness.app);
    const saveSettings = vi.spyOn(plugin, "saveSettings");
    const saveData = vi.spyOn(plugin, "saveData");

    await plugin.onload();

    const [settingTab] = (
      plugin as unknown as {
        settingTabs: Array<{
          containerEl: HTMLElement;
          display(): void;
        }>;
      }
    ).settingTabs;

    expect(settingTab).toBeDefined();
    if (!settingTab) {
      throw new Error("The plugin did not register its settings tab.");
    }

    settingTab.containerEl = dom.window.document.createElement("section");
    settingTab.display();

    const iconInput = textComponents[textComponents.length - 1];
    expect(iconInput).toBeDefined();
    if (!iconInput) {
      throw new Error("The icon text control was not rendered.");
    }

    await iconInput.triggerChange("clipboard-check");
    expect(saveSettings).not.toHaveBeenCalled();

    plugin.onunload();
    (
      plugin as unknown as { runRegisteredCleanups(): void }
    ).runRegisteredCleanups();
    await Promise.resolve();

    expect(saveSettings).toHaveBeenCalledTimes(1);
    expect(saveSettings).toHaveBeenCalledWith(true);
    expect(saveData).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(saveSettings).toHaveBeenCalledTimes(1);
  });
});

describe("header action lifecycle", () => {
  it("prepends the action so Cupertino's native tail remains stable", () => {
    const dom = createDom();
    const harness = createApp();
    const plugin = createPlugin(harness.app);
    const { view, actions } = createView(dom, "Text");
    const modeSwitcher = dom.window.document.createElement("button");
    modeSwitcher.id = "mode-switcher";
    const more = dom.window.document.createElement("button");
    more.id = "more";
    actions.append(modeSwitcher, more);
    harness.leaves.push(view);

    plugin.refreshHeaderActions();

    expect(Array.from(actions.children).map((element) => element.id)).toEqual([
      "",
      "mode-switcher",
      "more",
    ]);
    expect(actions.firstElementChild?.classList.contains("copy-all-note-action")).toBe(
      true,
    );
    expect(actions.children.item(actions.children.length - 2)).toBe(modeSwitcher);
    expect(modeSwitcher.matches("button:nth-last-child(2)")).toBe(true);

    actions.appendChild(actions.firstElementChild as HTMLElement);
    plugin.refreshHeaderActions();

    expect(actions.firstElementChild?.classList.contains("copy-all-note-action")).toBe(
      true,
    );
    expect(actions.querySelectorAll(".copy-all-note-action")).toHaveLength(1);
    expect(actions.children.item(actions.children.length - 2)).toBe(modeSwitcher);
    expect(modeSwitcher.matches("button:nth-last-child(2)")).toBe(true);
  });

  it("replaces orphan actions with callbacks from the current plugin instance", async () => {
    const mainDom = createDom();
    const popoutDom = createDom();
    const mainWrite = vi.fn(async () => undefined);
    const popoutWrite = vi.fn(async () => undefined);
    setClipboard(mainDom, mainWrite);
    setClipboard(popoutDom, popoutWrite);
    const harness = createApp();
    const main = createView(mainDom, "Main body", "Main");
    const popout = createView(popoutDom, "Pop-out body", "Pop-out");
    main.actions.appendChild(mainDom.window.document.createElement("button"));
    popout.actions.appendChild(popoutDom.window.document.createElement("button"));
    harness.leaves.push(main.view, popout.view);

    const stalePlugin = createPlugin(harness.app);
    stalePlugin.settings.prependTitle = false;
    stalePlugin.refreshHeaderActions();
    const staleMainAction = main.actions.firstElementChild as HTMLElement;
    const stalePopoutAction = popout.actions.firstElementChild as HTMLElement;

    const currentPlugin = createPlugin(harness.app);
    currentPlugin.settings.prependTitle = true;
    currentPlugin.refreshHeaderActions();
    const currentMainAction = main.actions.firstElementChild as HTMLElement;
    const currentPopoutAction = popout.actions.firstElementChild as HTMLElement;

    expect(main.actions.querySelectorAll(".copy-all-note-action")).toHaveLength(1);
    expect(popout.actions.querySelectorAll(".copy-all-note-action")).toHaveLength(1);
    expect(currentMainAction).not.toBe(staleMainAction);
    expect(currentPopoutAction).not.toBe(stalePopoutAction);
    expect(staleMainAction.isConnected).toBe(false);
    expect(stalePopoutAction.isConnected).toBe(false);
    expect(currentMainAction.classList.contains("copy-all-note-action")).toBe(true);
    expect(currentPopoutAction.classList.contains("copy-all-note-action")).toBe(
      true,
    );

    stalePlugin.onunload();
    expect(main.actions.firstElementChild).toBe(currentMainAction);
    expect(popout.actions.firstElementChild).toBe(currentPopoutAction);
    expect(currentMainAction.isConnected).toBe(true);
    expect(currentPopoutAction.isConnected).toBe(true);

    currentMainAction.click();
    currentPopoutAction.click();

    await vi.waitFor(() => {
      expect(mainWrite).toHaveBeenCalledWith("# Main\n\nMain body");
      expect(popoutWrite).toHaveBeenCalledWith("# Pop-out\n\nPop-out body");
    });
    expect(mainWrite).not.toHaveBeenCalledWith("Main body");
    expect(popoutWrite).not.toHaveBeenCalledWith("Pop-out body");
  });

  it("removes actions from both main and pop-out documents", () => {
    const mainDom = createDom();
    const popoutDom = createDom();
    const harness = createApp();
    const plugin = createPlugin(harness.app);
    const main = createView(mainDom, "Main");
    const popout = createView(popoutDom, "Pop-out");
    harness.leaves.push(main.view, popout.view);

    plugin.refreshHeaderActions();
    expect(main.actions.querySelector(".copy-all-note-action")).not.toBeNull();
    expect(popout.actions.querySelector(".copy-all-note-action")).not.toBeNull();

    plugin.settings.showHeaderButton = false;
    plugin.refreshHeaderActions();

    expect(main.actions.querySelector(".copy-all-note-action")).toBeNull();
    expect(popout.actions.querySelector(".copy-all-note-action")).toBeNull();
  });

  it("removes an orphan action from a fileless Markdown view", () => {
    const dom = createDom();
    const harness = createApp();
    const plugin = createPlugin(harness.app);
    const { view, actions } = createView(dom, "");
    const orphan = dom.window.document.createElement("button");
    orphan.classList.add("copy-all-note-action");
    actions.appendChild(orphan);
    view.file = null;
    harness.leaves.push(view);

    plugin.refreshHeaderActions();

    expect(actions.querySelector(".copy-all-note-action")).toBeNull();
  });

  it("removes actions from every document on unload", () => {
    const mainDom = createDom();
    const popoutDom = createDom();
    const harness = createApp();
    const plugin = createPlugin(harness.app);
    const main = createView(mainDom, "Main");
    const popout = createView(popoutDom, "Pop-out");
    harness.leaves.push(main.view, popout.view);
    plugin.refreshHeaderActions();

    plugin.onunload();

    expect(main.actions.querySelector(".copy-all-note-action")).toBeNull();
    expect(popout.actions.querySelector(".copy-all-note-action")).toBeNull();
  });

  it("keeps split-pane callbacks bound to their own notes", async () => {
    const firstDom = createDom();
    const secondDom = createDom();
    const firstWrite = vi.fn(async () => undefined);
    const secondWrite = vi.fn(async () => undefined);
    setClipboard(firstDom, firstWrite);
    setClipboard(secondDom, secondWrite);
    const harness = createApp();
    const plugin = createPlugin(harness.app);
    const first = createView(firstDom, "First pane");
    const second = createView(secondDom, "Second pane");
    harness.leaves.push(first.view, second.view);
    plugin.refreshHeaderActions();

    (first.actions.firstElementChild as HTMLElement).click();
    (second.actions.firstElementChild as HTMLElement).click();

    await vi.waitFor(() => {
      expect(firstWrite).toHaveBeenCalledWith("First pane");
      expect(secondWrite).toHaveBeenCalledWith("Second pane");
    });
  });
});
