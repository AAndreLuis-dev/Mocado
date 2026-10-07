/** Messages sent from extension pages (popup/manage) to the background. */
export type BackgroundMessage = { type: 'fill-tab'; tabId: number };

export type FillResult = { ok: true; filled: number } | { ok: false; error: string };

export const sendToBackground = (msg: BackgroundMessage): Promise<FillResult> =>
  browser.runtime.sendMessage(msg);
