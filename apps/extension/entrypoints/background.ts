import type { FillResult } from '@/src/application/fill-result';
import { createMenus, onCommand, onMenuClick } from '@/src/infra/browser/menus';
import type { BackgroundMessage } from '@/src/infra/browser/messages';
import { fillField, fillForm } from '@/src/infra/container';

export default defineBackground(() => {
  // Chrome keeps menus across restarts; Firefox event pages may not, so register on startup too.
  browser.runtime.onInstalled.addListener(createMenus);
  browser.runtime.onStartup.addListener(createMenus);
  browser.contextMenus.onClicked.addListener((info, tab) => void onMenuClick(info, tab));
  browser.commands.onCommand.addListener((command, tab) => void onCommand(command, tab));

  browser.runtime.onMessage.addListener(
    (msg: BackgroundMessage, _sender, sendResponse: (r: FillResult) => void) => {
      if (msg.type === 'fill-tab') {
        fillForm(msg.tabId, msg.reuseId).then((r) =>
          sendResponse(r.ok ? { ok: true, filled: r.filled } : { ok: false, error: r.error }),
        );
        return true; // async response
      }
    },
  );

  // Hooks for e2e tests (Playwright cannot press extension shortcuts or open context menus).
  Object.assign(globalThis, {
    mocado: {
      fillTab: fillForm,
      fillFocusedTab: fillField.focused,
      fillTypeHere: fillField.ofType,
      onMenuClick,
      onCommand,
    },
  });
});
