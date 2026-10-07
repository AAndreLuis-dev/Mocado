import { fillTab } from '@/src/background/actions';
import type { BackgroundMessage, FillResult } from '@/src/messages';

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(
    (msg: BackgroundMessage, _sender, sendResponse: (r: FillResult) => void) => {
      if (msg.type === 'fill-tab') {
        fillTab(msg.tabId, msg.reuseId).then((r) =>
          sendResponse(r.ok ? { ok: true, filled: r.filled } : { ok: false, error: r.error }),
        );
        return true; // async response
      }
    },
  );

  // Hook for e2e tests (Playwright cannot press extension shortcuts); harmless otherwise.
  (globalThis as unknown as { massaFillTab: typeof fillTab }).massaFillTab = fillTab;
});
