import { describe, expect, test } from 'vitest';
import {
  certidao,
  certidaoTipo,
  cnh,
  ie,
  ieUFs,
  mulberry32,
  pis,
  renavam,
  rg,
  titulo,
  tituloUF,
  UFS,
} from '../src';
import { mutateLastDigit, roundTrip } from './helpers';
import IE_FIXTURES from './ie-fixtures.json' with { type: 'json' };

describe('rg (SSP-SP)', () => {
  test('known DV rules', () => {
    expect(rg.validate('24.678.131-2')).toBe(true);
    expect(rg.validate('24.678.131-3')).toBe(false);
    expect(rg.validate('11.111.111-1')).toBe(false);
  });
  test('5k round-trip, X digit appears', () => {
    const values = roundTrip(rg);
    expect(values.some((v) => v.endsWith('X'))).toBe(true);
  });
});

describe('cnh', () => {
  test('known value', () => {
    expect(cnh.validate('02650306461')).toBe(true);
    expect(cnh.validate('02650306462')).toBe(false);
  });
  test('5k round-trip', () => {
    for (const v of roundTrip(cnh)) expect(cnh.validate(mutateLastDigit(v))).toBe(false);
  });
});

describe('pis', () => {
  test('5k round-trip', () => {
    for (const v of roundTrip(pis)) expect(pis.validate(mutateLastDigit(v))).toBe(false);
  });
});

describe('titulo', () => {
  test('known value', () => {
    expect(titulo.validate('0043 5687 0906')).toBe(true);
    expect(titulo.validate('004356870906', { uf: 'PR' })).toBe(false);
    expect(tituloUF('004356870906')).toBe('SC');
  });
  test('5k round-trip per UF keeps UF', () => {
    for (const uf of UFS) {
      for (const v of roundTrip(titulo, { uf }, 200)) expect(tituloUF(v)).toBe(uf);
    }
    roundTrip(titulo);
  });
});

describe('renavam', () => {
  test('5k round-trip', () => {
    for (const v of roundTrip(renavam)) expect(renavam.validate(mutateLastDigit(v))).toBe(false);
  });
});

describe('certidao', () => {
  test.each(['nascimento', 'casamento', 'obito'] as const)('5k %s', (tipo) => {
    for (const v of roundTrip(certidao, { tipo }, 2000)) {
      expect(certidaoTipo(v)).toBe(tipo);
      expect(certidao.validate(mutateLastDigit(v))).toBe(false);
    }
  });
});

describe('inscricao estadual', () => {
  const supported = (uf: string, v: string) => !(uf === 'RO' && v.replace(/\D/g, '').length === 9);

  test.each(Object.entries(IE_FIXTURES))('%s: real IEs validate', (uf, values) => {
    for (const v of values.filter((x) => supported(uf, x))) {
      expect(ie.validate(v, { uf: uf as (typeof UFS)[number] }), `${uf} ${v}`).toBe(true);
    }
  });

  test.each(UFS)('%s: 5k round-trip, wrong DV rejected', (uf) => {
    for (const v of roundTrip(ie, { uf })) {
      expect(ieUFs(v)).toContain(uf);
      expect(ie.validate(mutateLastDigit(v), { uf })).toBe(false);
    }
  });

  test('rural producer SP', () => {
    expect(ie.validate('P-01100424.3/002', { uf: 'SP' })).toBe(true);
  });

  test('garbage', () => {
    expect(ie.validate('abc')).toBe(false);
    expect(ie.validate('')).toBe(false);
    expect(ie.generate({ rng: mulberry32(1) })).toBeTruthy();
  });
});
