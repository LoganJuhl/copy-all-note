export const notices: Array<{ message: string; timeout?: number }> = [];

export function resetNotices(): void {
  notices.length = 0;
}

export interface Debouncer<T extends unknown[], V> {
  (...args: T): Debouncer<T, V>;
  cancel(): Debouncer<T, V>;
  run(): V | void;
}

export function debounce<T extends unknown[], V>(
  callback: (...args: T) => V,
  timeout = 0,
  resetTimer = false,
): Debouncer<T, V> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let latestArguments: T | null = null;

  const debounced = ((...args: T) => {
    latestArguments = args;

    if (timer !== null) {
      if (!resetTimer) {
        return debounced;
      }
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      timer = null;
      const argumentsToUse = latestArguments;
      latestArguments = null;

      if (argumentsToUse) {
        callback(...argumentsToUse);
      }
    }, timeout);

    return debounced;
  }) as Debouncer<T, V>;

  debounced.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    latestArguments = null;
    return debounced;
  };
  debounced.run = () => {
    if (timer === null || !latestArguments) {
      return;
    }

    clearTimeout(timer);
    timer = null;
    const argumentsToUse = latestArguments;
    latestArguments = null;
    return callback(...argumentsToUse);
  };

  return debounced;
}

export class Plugin {
  app: unknown;
  readonly settingTabs: unknown[] = [];
  private data: unknown = null;
  private readonly cleanups: Array<() => unknown> = [];

  constructor(app: unknown, _manifest?: unknown) {
    this.app = app;
  }

  async loadData(): Promise<unknown> {
    return this.data;
  }

  async saveData(data: unknown): Promise<void> {
    this.data = data;
  }

  addCommand<T>(command: T): T {
    return command;
  }

  addSettingTab(tab: unknown): void {
    this.settingTabs.push(tab);
  }

  registerEvent<T>(event: T): T {
    return event;
  }

  register(cleanup: () => unknown): void {
    this.cleanups.push(cleanup);
  }

  runRegisteredCleanups(): void {
    for (const cleanup of this.cleanups.splice(0).reverse()) {
      cleanup();
    }
  }

  registerDomEvent(
    element: HTMLElement,
    type: string,
    callback: EventListener,
    options?: boolean | AddEventListenerOptions,
  ): void {
    element.addEventListener(type, callback, options);
    this.register(() => element.removeEventListener(type, callback, options));
  }
}

export class MarkdownView {}

export class Notice {
  constructor(message: string, timeout?: number) {
    notices.push({ message, timeout });
  }
}

export class PluginSettingTab {
  containerEl!: HTMLElement;

  constructor(
    protected app: unknown,
    protected plugin: unknown,
  ) {}
}

class ToggleComponent {
  setValue(_value: boolean): this {
    return this;
  }

  onChange(_handler: (value: boolean) => void | Promise<void>): this {
    return this;
  }
}

export class TextComponent {
  readonly inputEl: HTMLInputElement;
  private value = "";
  private changeHandler: ((value: string) => void | Promise<void>) | null = null;

  constructor(ownerDocument: Document) {
    this.inputEl = ownerDocument.createElement("input");
  }

  setPlaceholder(value: string): this {
    this.inputEl.placeholder = value;
    return this;
  }

  setValue(value: string): this {
    this.value = value;
    this.inputEl.value = value;
    return this;
  }

  getValue(): string {
    return this.value;
  }

  onChange(handler: (value: string) => void | Promise<void>): this {
    this.changeHandler = handler;
    return this;
  }

  async triggerChange(value: string): Promise<void> {
    this.value = value;
    this.inputEl.value = value;
    await this.changeHandler?.(value);
  }
}

export const textComponents: TextComponent[] = [];

export function resetTextComponents(): void {
  textComponents.length = 0;
}

export class Setting {
  constructor(private readonly containerEl: HTMLElement) {}

  setName(_name: string): this {
    return this;
  }

  setDesc(_description: string): this {
    return this;
  }

  addToggle(builder: (toggle: ToggleComponent) => void): this {
    builder(new ToggleComponent());
    return this;
  }

  addText(builder: (text: TextComponent) => void): this {
    const text = new TextComponent(this.containerEl.ownerDocument);
    textComponents.push(text);
    builder(text);
    return this;
  }
}

const knownIcons = new Set(["copy", "clipboard-copy", "clipboard"]);

export function getIcon(name: string): SVGSVGElement | null {
  return knownIcons.has(name) ? ({} as SVGSVGElement) : null;
}
