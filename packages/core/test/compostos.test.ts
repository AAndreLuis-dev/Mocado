import { describe, expect, test } from 'vitest';
import {
  CPF_REGION,
  cepUF,
  cnpj,
  cpf,
  cpfRegion,
  dddUF,
  empresa,
  FIELD_TYPES,
  ie,
  isCnpjAlfanumerico,
  mulberry32,
  pessoa,
  rg,
  telefone,
  titulo,
  tituloUF,
  UFS,
  valorAvulso,
} from '../src';

const NOW = new Date(2026, 9, 6);

describe('pessoa', () => {
  test.each(UFS)('%s: everything coherent with the UF', (uf) => {
    const rng = mulberry32(11);
    for (let i = 0; i < 100; i++) {
      const p = pessoa({ uf, rng, now: NOW });
      expect(cpf.validate(p.cpf!)).toBe(true);
      expect(cpfRegion(p.cpf!)).toBe(CPF_REGION[uf]);
      expect(titulo.validate(p.titulo!)).toBe(true);
      expect(tituloUF(p.titulo!)).toBe(uf);
      expect(dddUF(p.telefone!)).toBe(uf);
      expect(dddUF(p.celular!)).toBe(uf);
      expect(telefone.validate(p.celular!, { tipo: 'celular' })).toBe(true);
      expect(cepUF(p.cep!)).toBe(uf);
      expect(p.uf).toBe(uf);
      expect(rg.validate(p.rg!)).toBe(true);
      const first = p.primeiroNome!.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      expect(p.email!.startsWith(first) || p.email!.startsWith(first[0]!)).toBe(true);
    }
  });

  test('age range and sex', () => {
    const p = pessoa({ idadeMin: 30, idadeMax: 30, sexo: 'F', rng: mulberry32(1), now: NOW });
    expect(p.idade).toBe('30');
    expect(p.sexo).toBe('Feminino');
  });

  test('every pessoa field is filled', () => {
    const p = pessoa({ rng: mulberry32(1), now: NOW });
    const missing = FIELD_TYPES.filter(
      (f) => !['cnpj', 'razaoSocial', 'nomeFantasia', 'ie', 'dataAbertura'].includes(f),
    ).filter((f) => p[f] === undefined);
    expect(missing).toEqual([]);
  });

  test('unmasked option', () => {
    const p = pessoa({ masked: false, rng: mulberry32(1), now: NOW });
    expect(p.cpf).toMatch(/^\d{11}$/);
    expect(p.cep).toMatch(/^\d{8}$/);
  });
});

describe('empresa', () => {
  test.each(UFS)('%s: IE and address from the same UF', (uf) => {
    const rng = mulberry32(12);
    for (let i = 0; i < 50; i++) {
      const e = empresa({ uf, rng, now: NOW });
      expect(cnpj.validate(e.cnpj!)).toBe(true);
      expect(ie.validate(e.ie!, { uf })).toBe(true);
      expect(cepUF(e.cep!)).toBe(uf);
      expect(dddUF(e.telefone!)).toBe(uf);
      expect(e.razaoSocial!.startsWith(e.nomeFantasia!)).toBe(true);
      expect(e.email).toMatch(/@[a-z]+\.example\.com$/);
    }
  });

  test('cnpjTipo', () => {
    const e = empresa({ cnpjTipo: 'alfanumerico', rng: mulberry32(1), now: NOW });
    expect(isCnpjAlfanumerico(e.cnpj!)).toBe(true);
  });
});

test('valorAvulso returns a value for every field', () => {
  for (const f of FIELD_TYPES)
    expect(valorAvulso(f, { rng: mulberry32(1), now: NOW }), f).toBeTruthy();
});
