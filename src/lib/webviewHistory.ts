export const MAX_WEBVIEW_HISTORY = 10;

export type HistoryEntry = {
  key: string;
  spa: boolean;
};

/** Per-tab navigation stack for hardware back (SPA paths + external pages like Jitsi). */
export class TabHistoryStack {
  private items: HistoryEntry[] = [];

  constructor(rootKey: string) {
    this.items = [{ key: rootKey, spa: true }];
  }

  reset(rootKey: string) {
    this.items = [{ key: rootKey, spa: true }];
  }

  peek(): HistoryEntry {
    return this.items[this.items.length - 1];
  }

  canPop(): boolean {
    return this.items.length > 1;
  }

  push(key: string, spa: boolean, replace = false) {
    const top = this.items[this.items.length - 1];
    if (top?.key === key) return;

    if (replace && this.items.length > 0) {
      this.items[this.items.length - 1] = { key, spa };
      return;
    }

    this.items.push({ key, spa });
    while (this.items.length > MAX_WEBVIEW_HISTORY) {
      this.items.splice(1, 1);
    }
  }

  pop(): HistoryEntry | undefined {
    if (this.items.length <= 1) return undefined;
    this.items.pop();
    return this.peek();
  }

  /** After WebView.goBack(), align stack with the URL we landed on. */
  syncToKey(key: string) {
    const top = this.peek();
    if (top?.key === key) return;

    while (this.items.length > 1 && this.peek().key !== key) {
      this.items.pop();
    }

    if (this.peek().key !== key) {
      this.push(key, !key.startsWith('http'), false);
    }
  }
}

export function historyKeyFromUrl(url: string): HistoryEntry {
  try {
    const u = new URL(url);
    const spa = u.hostname.includes('tukua.ai');
    return { key: spa ? u.pathname : u.href, spa };
  } catch {
    return { key: url, spa: false };
  }
}
