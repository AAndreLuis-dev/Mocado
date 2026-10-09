import { describe, expect, test } from 'vitest';
import {
  DEFAULT_SETTINGS,
  isBlocked,
  normalizeSettings,
  parseDomains,
  withSetting,
} from './settings';

describe('normalizeSettings', () => {
  test('nothing stored → defaults; old storage gets defaults for new keys', () => {
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings({ masked: false })).toEqual({ ...DEFAULT_SETTINGS, masked: false });
  });

  test('invalid values fall back, ages are clamped and ordered', () => {
    const s = normalizeSettings({
      cnpjTipo: 'hex',
      uf: 'XX',
      theme: 'neon',
      language: 'fr',
      masked: 'yes',
      blockedDomains: ['a.test', 3, null],
      idadeMin: 200,
      idadeMax: -5,
    });
    expect(s).toMatchObject({
      cnpjTipo: 'numerico',
      uf: '',
      theme: 'system',
      language: 'auto',
      masked: true,
      blockedDomains: ['a.test'],
      idadeMin: 120,
      idadeMax: 120,
    });
    expect(normalizeSettings({ uf: 'SP', idadeMin: 30.4, language: 'en' })).toMatchObject({
      uf: 'SP',
      language: 'en',
      idadeMin: 30,
    });
  });
});

test('withSetting drags the other end of the age range along', () => {
  const s = { ...DEFAULT_SETTINGS, idadeMin: 18, idadeMax: 60 };
  expect(withSetting(s, 'idadeMin', 70)).toMatchObject({ idadeMin: 70, idadeMax: 70 });
  expect(withSetting(s, 'idadeMax', 10)).toMatchObject({ idadeMin: 10, idadeMax: 10 });
  expect(withSetting(s, 'theme', 'dark').theme).toBe('dark');
});

test('parseDomains: one per line or space, lowercased, blanks dropped', () => {
  expect(parseDomains(' Banco.com.br\n\n  erp.test  x.test ')).toEqual([
    'banco.com.br',
    'erp.test',
    'x.test',
  ]);
});

test('isBlocked matches domain and subdomains only', () => {
  const list = ['banco.com.br', '*.interno.test', ' '];
  expect(isBlocked('banco.com.br', list)).toBe(true);
  expect(isBlocked('app.banco.com.br', list)).toBe(true);
  expect(isBlocked('meubanco.com.br', list)).toBe(false);
  expect(isBlocked('x.interno.test', list)).toBe(true);
  expect(isBlocked('localhost', list)).toBe(false);
});
