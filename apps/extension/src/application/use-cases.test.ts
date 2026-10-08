import { describe, expect, test } from 'vitest';
import { cnpj, cpf } from '@mocado/core';
import { DEFAULT_SETTINGS } from '../domain/settings';
import { makeRecord } from '../../test/records';
import { fakeDeps, fakePage, memoryHistory, memoryStore } from '../../test/fakes';
import { makeFillField } from './fill-field';
import { makeFillForm } from './fill-form';
import { makeHistoryService } from './history';
import { makePreferences } from './preferences';

describe('fillForm', () => {
  test('generates a pessoa, fills and records one use', async () => {
    const deps = fakeDeps();
    const res = await makeFillForm(deps)(1);
    expect(res).toMatchObject({ ok: true, filled: 2, kind: 'pessoa' });
    expect(cpf.validate(res.profile!.cpf!)).toBe(true);
    const [saved] = await deps.history.all();
    expect(saved).toMatchObject({ id: res.recordId, tipo: 'pessoa' });
    expect(saved!.uses).toEqual([{ domain: 'app.test', url: 'https://app.test/form', at: 1000 }]);
  });

  test('company fields on the page → empresa', async () => {
    const deps = fakeDeps({ page: fakePage(['cnpj', 'razaoSocial']) });
    const res = await makeFillForm(deps)(1);
    expect(res.kind).toBe('empresa');
    expect(cnpj.validate(res.profile!.cnpj!)).toBe(true);
  });

  test('blocked domain: nothing filled, nothing recorded', async () => {
    const deps = fakeDeps({
      settings: memoryStore({ ...DEFAULT_SETTINGS, blockedDomains: ['app.test'] }),
    });
    expect(await makeFillForm(deps)(1)).toMatchObject({ ok: false, error: 'blocked' });
    expect(deps.page.fill).not.toHaveBeenCalled();
    expect(await deps.history.all()).toEqual([]);
  });

  test('no fields: ok with 0 and no record', async () => {
    const deps = fakeDeps({ page: fakePage([]) });
    expect(await makeFillForm(deps)(1)).toMatchObject({ ok: true, filled: 0 });
    expect(await deps.history.all()).toEqual([]);
  });

  test('reuse adds a use to the same record', async () => {
    const stored = makeRecord({ id: 'r1', values: { cpf: '111.444.777-35', nome: 'Ana' } });
    const deps = fakeDeps({ history: memoryHistory([stored]) });
    const res = await makeFillForm(deps)(1, 'r1');
    expect(res).toMatchObject({ recordId: 'r1', profile: stored.values });
    expect((await deps.history.get('r1'))!.uses).toHaveLength(2);
  });

  test('a pinned profile is used once, then unpinned', async () => {
    const deps = fakeDeps({
      history: memoryHistory([makeRecord({ id: 'p' })]),
      pin: memoryStore<string | undefined>('p'),
    });
    const fill = makeFillForm(deps);
    expect((await fill(1)).recordId).toBe('p');
    expect(await deps.pin.get()).toBeUndefined();
    expect((await fill(1)).recordId).not.toBe('p');
  });

  test('the page gets the user context (mask default, passwords, overrides)', async () => {
    const overrides = { 'app.test': { '#x': 'cpf' as const } };
    const deps = fakeDeps({ overrides: memoryStore(overrides) });
    await makeFillForm(deps)(9);
    expect(deps.page.scan).toHaveBeenCalledWith(9, {
      masked: true,
      fillPasswords: false,
      observe: true,
      overrides,
    });
  });

  test('unexpected errors become ok:false', async () => {
    const deps = fakeDeps();
    deps.page.scan = async () => {
      throw new Error('tab closed');
    };
    expect(await makeFillForm(deps)(1)).toEqual({ ok: false, error: 'Error: tab closed' });
  });
});

describe('fillField', () => {
  test('focused field gets a value of its detected type, recorded as avulso', async () => {
    const deps = fakeDeps({ page: fakePage(['cpf'], { focused: 'cpf' }) });
    const res = await makeFillField(deps).focused(1);
    expect(res).toMatchObject({ ok: true, filled: 1, kind: 'avulso' });
    expect(cpf.validate(res.profile!.cpf!)).toBe(true);
    expect((await deps.history.all())[0]).toMatchObject({ tipo: 'avulso' });
  });

  test('no focused field → no-field', async () => {
    const deps = fakeDeps({ page: fakePage(['cpf']) });
    expect(await makeFillField(deps).focused(1)).toMatchObject({ ok: false, error: 'no-field' });
  });

  test('ofType ignores detection; markAs remembers the correction for the domain', async () => {
    const deps = fakeDeps({ page: fakePage(['nome'], { selector: 'input[name="doc"]' }) });
    const ff = makeFillField(deps);
    expect((await ff.ofType(1, 'cnpj')).profile).toHaveProperty('cnpj');
    await ff.markAs(1, 'cpf');
    expect(await deps.overrides.get()).toEqual({ 'app.test': { 'input[name="doc"]': 'cpf' } });
  });

  test('markAs without a focused field changes nothing', async () => {
    const deps = fakeDeps({ page: fakePage(['nome'], { selector: '' }) });
    expect(await makeFillField(deps).markAs(1, 'cpf')).toMatchObject({ error: 'no-field' });
    expect(await deps.overrides.get()).toEqual({});
  });
});

describe('history service', () => {
  test('search returns matches and everything; recent is by last use', async () => {
    const h = makeHistoryService(
      fakeDeps({
        history: memoryHistory([
          makeRecord({ id: 'a' }, 1),
          makeRecord({ id: 'b', label: 'admin' }, 2),
        ]),
      }),
    );
    const { records, all } = await h.search({ query: 'admin' });
    expect(records.map((r) => r.id)).toEqual(['b']);
    expect(all).toHaveLength(2);
    expect((await h.recent(1)).map((r) => r.id)).toEqual(['b']);
  });

  test('favorite, rename (trimmed), pin, remove also unpins', async () => {
    const deps = fakeDeps({ history: memoryHistory([makeRecord({ id: 'a' })]) });
    const h = makeHistoryService(deps);
    await h.setFavorite('a', true);
    await h.rename('a', '  admin  ');
    expect(await deps.history.get('a')).toMatchObject({ favorite: true, label: 'admin' });
    await h.pin('a');
    expect((await h.pinned())?.id).toBe('a');
    await h.remove('a');
    expect(await h.pinnedId()).toBeUndefined();
    expect(await deps.history.all()).toEqual([]);
  });

  test('export → import into an empty history restores it', async () => {
    const source = makeHistoryService(
      fakeDeps({ history: memoryHistory([makeRecord({ id: 'a' }), makeRecord({ id: 'b' })]) }),
    );
    const target = makeHistoryService(fakeDeps());
    expect(await target.importFile(JSON.parse(JSON.stringify(await source.exportFile())))).toBe(2);
    expect((await target.search()).all.map((r) => r.id).sort()).toEqual(['a', 'b']);
    await expect(target.importFile('lixo')).rejects.toThrow('invalid-file');
  });
});

test('preferences: settings are normalized; overrides add and remove', async () => {
  const p = makePreferences(fakeDeps());
  expect(await p.setSetting('idadeMin', 80)).toMatchObject({ idadeMin: 80, idadeMax: 80 });
  expect((await p.settings()).idadeMax).toBe(80);
  await p.setOverride('a.test', '#x', 'cpf');
  await p.setOverride('a.test', '#y', 'cep');
  await p.removeOverride('a.test', '#x');
  expect(await p.overrides()).toEqual({ 'a.test': { '#y': 'cep' } });
  await p.removeOverride('a.test');
  expect(await p.overrides()).toEqual({});
});
