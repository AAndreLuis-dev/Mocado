import { describe, expect, test } from 'vitest';
import { mergeRecords, parseImport, sanitize, toExport } from './history-import';
import { search } from './history-query';
import { displayName, domains, generatedName, keyValues, orderedValues } from './profile';
import { makeRecord } from '../../test/records';

describe('search', () => {
  test('newest first by last use', () => {
    const a = makeRecord({ id: 'a' }, 1000);
    const b = makeRecord({ id: 'b' }, 2000);
    expect(search([a, b]).map((r) => r.id)).toEqual(['b', 'a']);
    const reused = { ...a, uses: [...a.uses, { domain: 'o.test', url: 'u', at: 3000 }] };
    expect(search([reused, b]).map((r) => r.id)).toEqual(['a', 'b']);
  });

  test('ignores masks and accents, matches label and domain', () => {
    const list = [
      makeRecord({ id: 'a', label: 'Admin teste' }),
      makeRecord({
        id: 'b',
        values: { cnpj: '12.ABC.345/01DE-35' },
        uses: [{ domain: 'erp.test', url: 'u', at: 1 }],
      }),
    ];
    const ids = (query: string) => search(list, { query }).map((r) => r.id);
    expect(ids('12345678909')).toEqual(['a']);
    expect(ids('123.456.789-09')).toEqual(['a']);
    expect(ids('12abc34501de35')).toEqual(['b']);
    expect(ids('joao araujo')).toEqual(['a']);
    expect(ids('ADMIN')).toEqual(['a']);
    expect(ids('erp.test')).toEqual(['b']);
    expect(ids('nada-disso')).toEqual([]);
  });

  test('filters: domain (any use) and favorites', () => {
    const list = [
      makeRecord({ id: 'a', favorite: true }),
      makeRecord({
        id: 'b',
        uses: [
          { domain: 'x.test', url: 'u', at: 1 },
          { domain: 'y.test', url: 'u', at: 2 },
        ],
      }),
    ];
    expect(search(list, { domain: 'y.test' }).map((r) => r.id)).toEqual(['b']);
    expect(search(list, { favoritesOnly: true }).map((r) => r.id)).toEqual(['a']);
    expect(domains(list)).toEqual(['app.test', 'x.test', 'y.test']);
  });
});

test('names: label wins for display, company before person', () => {
  expect(displayName(makeRecord({ label: 'cliente PJ' }))).toBe('cliente PJ');
  expect(generatedName(makeRecord({ label: 'x' }))).toBe('João Araújo Silva');
  expect(generatedName(makeRecord({ values: { nome: 'A', razaoSocial: 'Empresa' } }))).toBe(
    'Empresa',
  );
});

describe('import/export', () => {
  test('export round-trips through parseImport', () => {
    const records = [makeRecord({ id: 'a', label: 'um', favorite: true }), makeRecord({ id: 'b' })];
    const dump = JSON.parse(JSON.stringify(toExport(records, 0)));
    expect(dump).toMatchObject({
      app: 'mocado',
      version: 1,
      exportedAt: '1970-01-01T00:00:00.000Z',
    });
    expect(parseImport(dump)).toEqual(records);
  });

  test('invalid entries are dropped, unknown keys stripped, bad files rejected', () => {
    const bad = [
      { id: 'x' },
      null,
      'str',
      { ...makeRecord({ id: 'ok' }), values: { cpf: '1', hack: '<script>', nome: 5 } },
    ];
    const parsed = parseImport({ records: bad });
    expect(parsed.map((r) => [r.id, r.values])).toEqual([['ok', { cpf: '1' }]]);
    expect(() => parseImport({ nope: true })).toThrow('invalid-file');
    expect(parseImport([makeRecord({ id: 'arr' })])[0]?.id).toBe('arr');
  });

  test('sanitize keeps known types only', () => {
    expect(sanitize({ ...makeRecord(), extra: 1, tipo: 'hacker' })).toBeNull();
    expect(sanitize(makeRecord())).toMatchObject({ tipo: 'pessoa', favorite: false });
  });

  test('merge keeps existing records, replace drops them; incoming wins on id', () => {
    const keep = makeRecord({ id: 'keep' });
    const incoming = [makeRecord({ id: 'keep', label: 'novo' }), makeRecord({ id: 'new' })];
    expect(mergeRecords([keep], incoming, 'merge').map((r) => [r.id, r.label])).toEqual([
      ['keep', 'novo'],
      ['new', ''],
    ]);
    expect(mergeRecords([makeRecord({ id: 'old' })], incoming, 'replace').map((r) => r.id)).toEqual(
      ['keep', 'new'],
    );
  });
});

test('values in form order; key values pick document, e-mail and city/UF', () => {
  const values = { uf: 'PR', cidade: 'Curitiba', email: 'a@b.c', nome: 'Ana', cpf: '1' };
  expect(orderedValues(values).map(([k]) => k)).toEqual(['nome', 'cpf', 'email', 'cidade', 'uf']);
  expect(keyValues(values)).toEqual([
    ['cpf', '1'],
    ['email', 'a@b.c'],
    ['cidade', 'Curitiba/PR'],
  ]);
  expect(keyValues({ placa: 'ABC1D23' })).toEqual([['placa', 'ABC1D23']]);
});
