import type { FillResult } from '@/src/application/fill-result';
import { createMenus, onCommand, onMenuClick } from '@/src/infra/browser/menus';
import type { BackgroundMessage } from '@/src/infra/browser/messages';
import { fillField, fillForm } from '@/src/infra/container';
import { normalizeSettings } from '@/src/domain/settings';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => void createMenus());
  browser.runtime.onStartup.addListener(() => void createMenus());
  browser.storage.onChanged.addListener(({ settings }) => {
    const language = (v: unknown) => normalizeSettings(v).language;
    if (settings && language(settings.oldValue) !== language(settings.newValue)) void createMenus();
  });
  browser.contextMenus.onClicked.addListener((info, tab) => void onMenuClick(info, tab));
  browser.commands.onCommand.addListener((command, tab) => void onCommand(command, tab));

  browser.runtime.onMessage.addListener(
    (msg: BackgroundMessage, _sender, sendResponse: (r: FillResult) => void) => {
      if (msg.type === 'fill-tab') {
        fillForm(msg.tabId, msg.reuseId).then((r) =>
          sendResponse(r.ok ? { ok: true, filled: r.filled } : { ok: false, error: r.error }),
        );
        return true;
      }
    },
  );

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
