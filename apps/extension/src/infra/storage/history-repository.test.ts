import { beforeEach, expect, test } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { DEFAULT_SETTINGS } from '../../domain/settings';
import { rec } from '../../domain/test-data';
import { LocalHistoryRepository } from './history-repository';
import { overridesStore, pinStore, settingsStore, watchStorage } from './stores';

beforeEach(() => fakeBrowser.reset());

test('history repository: save (upsert, newest first), get, update, remove, replaceAll', async () => {
  const repo = new LocalHistoryRepository();
  expect(await repo.all()).toEqual([]);
  await repo.save(rec({ id: 'a' }));
  await repo.save(rec({ id: 'b' }));
  await repo.save(rec({ id: 'a', label: 'de novo' }));
  expect((await repo.all()).map((r) => r.id)).toEqual(['a', 'b']);
  await repo.update('b', { favorite: true });
  expect(await repo.get('b')).toMatchObject({ favorite: true });
  await repo.remove('a');
  expect((await repo.all()).map((r) => r.id)).toEqual(['b']);
  await repo.replaceAll([]);
  expect(await repo.get('b')).toBeUndefined();
});

test('stores parse whatever is stored', async () => {
  expect(await settingsStore.get()).toEqual(DEFAULT_SETTINGS);
  await fakeBrowser.storage.local.set({ settings: { masked: false, uf: 'nope' } });
  expect(await settingsStore.get()).toEqual({ ...DEFAULT_SETTINGS, masked: false });

  expect(await overridesStore.get()).toEqual({});
  await overridesStore.set({ 'a.test': { '#x': 'cpf' } });
  expect(await overridesStore.get()).toEqual({ 'a.test': { '#x': 'cpf' } });

  await pinStore.set('a');
  expect(await pinStore.get()).toBe('a');
  await pinStore.set(undefined);
  expect(await pinStore.get()).toBeUndefined();
});

test('watchStorage only fires for the watched keys', async () => {
  const seen: string[] = [];
  const stop = watchStorage(['history'], () => seen.push('history'));
  await pinStore.set('x');
  await new LocalHistoryRepository().save(rec());
  stop();
  await new LocalHistoryRepository().save(rec());
  expect(seen).toEqual(['history']);
});
