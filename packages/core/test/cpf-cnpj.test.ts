import { describe, expect, test } from 'vitest';
import { cnpj, cpf, cpfRegion, CPF_REGION, isAlphanumericCnpj, mulberry32, UFS } from '../src';
import { mutateLastDigit, roundTrip } from './helpers';

describe('cpf', () => {
  test('known values', () => {
    expect(cpf.validate('529.982.247-25')).toBe(true);
    expect(cpf.validate('52998224725')).toBe(true);
    expect(cpf.validate('529.982.247-26')).toBe(false);
    expect(cpf.validate('111.111.111-11')).toBe(false);
    expect(cpf.validate('5299822472')).toBe(false);
    expect(cpf.validate('529a982.247-25')).toBe(false);
  });

  test('10k generate → validate', () => {
    for (const v of roundTrip(cpf, {}, 10000)) expect(cpf.validate(mutateLastDigit(v))).toBe(false);
  });

  test('UF sets fiscal region (9th digit)', () => {
    const rng = mulberry32(1);
    for (const uf of UFS) {
      const v = cpf.generate({ uf, rng });
      expect(cpfRegion(v)).toBe(CPF_REGION[uf]);
    }
  });

  test('masked option', () => {
    expect(cpf.generate({ rng: mulberry32(3) })).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
    expect(cpf.generate({ rng: mulberry32(3), masked: false })).toMatch(/^\d{11}$/);
  });
});

describe('cnpj', () => {
  test('official alphanumeric example (IN RFB 2.229/2024)', () => {
    expect(cnpj.validate('12.ABC.345/01DE-35')).toBe(true);
    expect(cnpj.validate('12ABC34501DE35')).toBe(true);
    expect(cnpj.validate('12abc34501de35')).toBe(true);
    expect(cnpj.validate('12.ABC.345/01DE-36')).toBe(false);
    expect(cnpj.format('12ABC34501DE35', { masked: true })).toBe('12.ABC.345/01DE-35');
  });

  test('known numeric values', () => {
    expect(cnpj.validate('11.222.333/0001-81')).toBe(true);
    expect(cnpj.validate('11222333000181')).toBe(true);
    expect(cnpj.validate('11.222.333/0001-82')).toBe(false);
    expect(cnpj.validate('00.000.000/0000-00')).toBe(false);
    expect(cnpj.validate('12.ABC.345/01DE-3A')).toBe(false);
  });

  test.each(['numerico', 'alfanumerico', 'aleatorio'] as const)('10k %s', (kind) => {
    const values = roundTrip(cnpj, { kind }, 10000);
    for (const v of values) expect(cnpj.validate(mutateLastDigit(v))).toBe(false);
    const alphanumeric = values.filter(isAlphanumericCnpj).length;
    if (kind === 'numerico') expect(alphanumeric).toBe(0);
    if (kind === 'alfanumerico') expect(alphanumeric).toBe(values.length);
    if (kind === 'aleatorio') expect(alphanumeric).toBeGreaterThan(values.length * 0.4);
  });
});
