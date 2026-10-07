import { beforeEach, expect, test } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { DEFAULT_SETTINGS, getSettings, isBlocked, saveSettings } from './settings';

beforeEach(() => fakeBrowser.reset());

test('defaults, and new keys fall back to defaults for old stored settings', async () => {
  expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
  await fakeBrowser.storage.local.set({ settings: { masked: false } });
  expect(await getSettings()).toEqual({ ...DEFAULT_SETTINGS, masked: false });
  await saveSettings({ ...DEFAULT_SETTINGS, uf: 'SP' });
  expect((await getSettings()).uf).toBe('SP');
});

test('isBlocked matches domain and subdomains only', () => {
  const list = ['banco.com.br', '*.interno.test', ' '];
  expect(isBlocked('banco.com.br', list)).toBe(true);
  expect(isBlocked('app.banco.com.br', list)).toBe(true);
  expect(isBlocked('meubanco.com.br', list)).toBe(false);
  expect(isBlocked('x.interno.test', list)).toBe(true);
  expect(isBlocked('localhost', list)).toBe(false);
});
