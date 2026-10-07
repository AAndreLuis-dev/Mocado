import { fillFocusedTab, fillTab, fillTypeHere } from '@/src/background/actions';
import { createMenus, onCommand, onMenuClick } from '@/src/background/menus';
import type { BackgroundMessage, FillResult } from '@/src/messages';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(createMenus);
  browser.contextMenus.onClicked.addListener((info, tab) => void onMenuClick(info, tab));
  browser.commands.onCommand.addListener((command, tab) => void onCommand(command, tab));

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

  // Hooks for e2e tests (Playwright cannot press extension shortcuts or open context menus).
  Object.assign(globalThis, {
    massa: { fillTab, fillFocusedTab, fillTypeHere, onMenuClick, onCommand },
  });
});
