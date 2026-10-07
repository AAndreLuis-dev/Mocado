import { expect, test } from 'vitest';
import { parseMessagesFile } from '@wxt-dev/i18n/build';
import { resolve } from 'node:path';

const keys = async (lang: string) =>
  (await parseMessagesFile(resolve(import.meta.dirname, `../locales/${lang}.yml`)))
    .map((m) => m.key.join('.'))
    .sort();

test('en has exactly the same keys as pt_BR', async () => {
  expect(await keys('en')).toEqual(await keys('pt_BR'));
});
