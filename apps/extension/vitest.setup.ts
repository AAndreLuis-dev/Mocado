import { fakeBrowser } from 'wxt/testing/fake-browser';
import { generateChromeMessages, parseMessagesFile } from '@wxt-dev/i18n/build';
import { resolve } from 'node:path';

const messages = generateChromeMessages(
  await parseMessagesFile(resolve(import.meta.dirname, 'locales/pt_BR.yml')),
);

fakeBrowser.i18n.getMessage = ((name: string, subs?: string | string[]) => {
  let msg = messages[name]?.message ?? '';
  [subs ?? []].flat().forEach((s, i) => (msg = msg.replaceAll(`$${i + 1}`, s)));
  return msg;
}) as typeof fakeBrowser.i18n.getMessage;

fakeBrowser.commands.getAll = (async () => [
  { name: 'fill-form', shortcut: 'Ctrl+Shift+F', description: 'Preencher o formulário inteiro' },
  { name: 'fill-field', shortcut: 'Alt+Shift+F', description: 'Preencher só o campo focado' },
]) as typeof fakeBrowser.commands.getAll;

const { afterEach } = await import('vitest');
const { cleanup } = await import('@testing-library/react');
afterEach(cleanup);
