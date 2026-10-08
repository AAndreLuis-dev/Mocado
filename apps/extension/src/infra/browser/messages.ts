import type { FillResult } from '../../application/fill-result';

/** Messages sent from extension pages (popup/manage) to the background. */
export type BackgroundMessage = { type: 'fill-tab'; tabId: number; reuseId?: string };

export const sendToBackground = (msg: BackgroundMessage): Promise<FillResult> =>
  browser.runtime.sendMessage(msg);
