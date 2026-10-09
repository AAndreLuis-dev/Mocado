import { expect, test, vi } from 'vitest';
import { parseMessagesFile } from '@wxt-dev/i18n/build';
import { resolve } from 'node:path';

const keys = async (lang: string) =>
  (await parseMessagesFile(resolve(import.meta.dirname, `../../../locales/${lang}.yml`)))
    .map((m) => m.key.join('.'))
    .sort();

test('en has exactly the same keys as pt_BR', async () => {
  expect(await keys('en')).toEqual(await keys('pt_BR'));
});

test('a chosen language overrides the browser one, with substitutions and plurals', async () => {
  const { generateChromeMessages } = await import('@wxt-dev/i18n/build');
  const { loadLanguage, plural, t } = await import('./i18n');
  const en = generateChromeMessages(
    await parseMessagesFile(resolve(import.meta.dirname, '../../../locales/en.yml')),
  );
  vi.stubGlobal('fetch', async () => new Response(JSON.stringify(en)));
  await loadLanguage('en');
  expect(t('popup.pinned', ['Ana'])).toBe('Next fill will use: Ana');
  expect(plural('history.count', 1)).toBe('1 profile');
  expect(plural('history.count', 3)).toBe('3 profiles');
  await loadLanguage('auto');
  expect(t('popup.reuse')).toBe('Reusar');
  vi.unstubAllGlobals();
});
