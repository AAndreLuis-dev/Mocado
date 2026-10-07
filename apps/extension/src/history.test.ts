import { beforeEach, describe, expect, test } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import {
  domains,
  getPinned,
  history,
  newRecord,
  sanitize,
  setPinned,
  type HistoryRecord,
} from './history';

const rec = (over: Partial<HistoryRecord> = {}, at = 1000): HistoryRecord => ({
  ...newRecord(
    'pessoa',
    { nome: 'João Araújo Silva', cpf: '123.456.789-09', email: 'joao@example.com' },
    { domain: 'app.test', url: 'https://app.test/cadastro', at },
  ),
  ...over,
});

beforeEach(() => fakeBrowser.reset());

describe('LocalStorageAdapter', () => {
  test('put/get/list newest first by last use', async () => {
    const a = rec({ id: 'a' }, 1000);
    const b = rec({ id: 'b' }, 2000);
    await history.put(a);
    await history.put(b);
    expect((await history.list()).map((r) => r.id)).toEqual(['b', 'a']);
    await history.update('a', {
      uses: [...a.uses, { domain: 'outro.test', url: 'https://outro.test', at: 3000 }],
    });
    expect((await history.list()).map((r) => r.id)).toEqual(['a', 'b']);
    expect(await history.get('a')).toMatchObject({ id: 'a' });
  });

  test('search ignores masks and accents, matches label and domain', async () => {
    await history.put(rec({ id: 'a', label: 'Admin teste' }));
    await history.put(
      rec({
        id: 'b',
        values: { cnpj: '12.ABC.345/01DE-35' },
        uses: [{ domain: 'erp.test', url: 'u', at: 1 }],
      }),
    );
    const ids = async (query: string) => (await history.list({ query })).map((r) => r.id);
    expect(await ids('12345678909')).toEqual(['a']);
    expect(await ids('123.456.789-09')).toEqual(['a']);
    expect(await ids('12abc34501de35')).toEqual(['b']);
    expect(await ids('joao araujo')).toEqual(['a']);
    expect(await ids('ADMIN')).toEqual(['a']);
    expect(await ids('erp.test')).toEqual(['b']);
    expect(await ids('nada-disso')).toEqual([]);
  });

  test('filters: domain (any use) and favorites', async () => {
    await history.put(rec({ id: 'a', favorite: true }));
    await history.put(
      rec({
        id: 'b',
        uses: [
          { domain: 'x.test', url: 'u', at: 1 },
          { domain: 'y.test', url: 'u', at: 2 },
        ],
      }),
    );
    expect((await history.list({ domain: 'y.test' })).map((r) => r.id)).toEqual(['b']);
    expect((await history.list({ favoritesOnly: true })).map((r) => r.id)).toEqual(['a']);
    expect(domains(await history.list())).toEqual(['app.test', 'x.test', 'y.test']);
  });

  test('remove', async () => {
    await history.put(rec({ id: 'a' }));
    await history.remove('a');
    expect(await history.list()).toEqual([]);
  });

  test('export → clear → import restores everything', async () => {
    await history.put(rec({ id: 'a', label: 'um', favorite: true }));
    await history.put(rec({ id: 'b' }));
    const dump = JSON.parse(JSON.stringify(await history.exportAll()));
    expect(dump).toMatchObject({ app: 'massa', version: 1 });
    await fakeBrowser.storage.local.clear();
    expect(await history.importAll(dump)).toBe(2);
    expect((await history.list()).map((r) => r.id).sort()).toEqual(['a', 'b']);
    expect(await history.get('a')).toMatchObject({ label: 'um', favorite: true });
  });

  test('import validates and merges or replaces', async () => {
    await history.put(rec({ id: 'keep' }));
    const bad = [
      { id: 'x' },
      null,
      'str',
      { ...rec({ id: 'ok' }), values: { cpf: '1', hack: '<script>', nome: 5 } },
    ];
    expect(await history.importAll({ records: bad })).toBe(1);
    expect((await history.get('ok'))!.values).toEqual({ cpf: '1' });
    expect((await history.list()).length).toBe(2);
    expect(await history.importAll([rec({ id: 'only' })], 'replace')).toBe(1);
    expect((await history.list()).map((r) => r.id)).toEqual(['only']);
    await expect(history.importAll({ nope: true })).rejects.toThrow('invalid-file');
  });
});

test('sanitize drops unknown fields and keeps types', () => {
  expect(sanitize({ ...rec(), extra: 1, tipo: 'hacker' })).toBeNull();
  expect(sanitize(rec())).toMatchObject({ tipo: 'pessoa', favorite: false });
});

test('pin is stored and cleared', async () => {
  await setPinned('a');
  expect(await getPinned()).toBe('a');
  await setPinned(undefined);
  expect(await getPinned()).toBeUndefined();
});
