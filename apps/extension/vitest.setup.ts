import { fakeBrowser } from 'wxt/testing/fake-browser';
import { generateChromeMessages, parseMessagesFile } from '@wxt-dev/i18n/build';
import { resolve } from 'node:path';

// fakeBrowser has no i18n: serve the real pt_BR messages (same format the build emits).
const messages = generateChromeMessages(
  await parseMessagesFile(resolve(import.meta.dirname, 'locales/pt_BR.yml')),
);

fakeBrowser.i18n.getMessage = ((name: string, subs?: string | string[]) => {
  let msg = messages[name]?.message ?? '';
  [subs ?? []].flat().forEach((s, i) => (msg = msg.replaceAll(`$${i + 1}`, s)));
  return msg;
}) as typeof fakeBrowser.i18n.getMessage;

// Testing Library only auto-cleans with vitest globals; do it explicitly.
const { afterEach } = await import('vitest');
const { cleanup } = await import('@testing-library/react');
afterEach(cleanup);
