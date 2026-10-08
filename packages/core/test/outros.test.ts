import { describe, expect, test } from 'vitest';
import {
  BANCOS,
  BANDEIRAS,
  cartao,
  cartaoCompleto,
  cep,
  cepUF,
  contaBancaria,
  dataISO,
  dddUF,
  email,
  endereco,
  idade,
  lorem,
  semAcento,
  luhnValid,
  mulberry32,
  nascimento,
  nomeCompleto,
  numero,
  pais,
  placa,
  senha,
  telefone,
  UFS,
  uuid,
  validarContaBancaria,
  veiculo,
  type Banco,
  type Bandeira,
} from '../src';
import { roundTrip } from './helpers';

const NOW = new Date(2026, 9, 6);

describe('placa', () => {
  test('formats', () => {
    expect(placa.validate('ABC-1234')).toBe(true);
    expect(placa.validate('ABC1D23')).toBe(true);
    expect(placa.validate('ABC1D23', { tipo: 'antiga' })).toBe(false);
    expect(placa.validate('AB-1234')).toBe(false);
  });
  test.each(['antiga', 'mercosul', 'aleatorio'] as const)('5k %s', (tipo) => {
    roundTrip(placa, { tipo });
  });
  test('veiculo', () => {
    const v = veiculo({ rng: mulberry32(1), now: NOW });
    expect(v.marca && v.modelo).toBeTruthy();
    expect(Number(v.ano)).toBeGreaterThanOrEqual(2011);
  });
});

describe('cartao', () => {
  test('luhn known', () => {
    expect(luhnValid('4111111111111111')).toBe(true);
    expect(luhnValid('4111111111111112')).toBe(false);
  });
  test.each(Object.keys(BANDEIRAS) as Bandeira[])('5k %s', (bandeira) => {
    for (const v of roundTrip(cartao, { bandeira })) {
      expect(v.replace(/\D/g, '')).toHaveLength(BANDEIRAS[bandeira].len);
    }
  });
  test('completo: future expiry, cvv size', () => {
    const rng = mulberry32(5);
    for (let i = 0; i < 1000; i++) {
      const c = cartaoCompleto({ rng, now: NOW, bandeira: i % 2 ? 'amex' : 'visa' });
      const [mm = 0, yy = 0] = c.validade.split('/').map(Number);
      expect(new Date(2000 + yy, mm, 0) > NOW).toBe(true);
      expect(c.cvv).toHaveLength(i % 2 ? 4 : 3);
    }
  });
});

describe('conta bancaria', () => {
  test('real data (darkroomdevs/CheckDigitValidator, MIT)', () => {
    expect(validarContaBancaria('bb', '1584-9', '1166615-3')).toBe(false);
    expect(validarContaBancaria('bb', '1584-9', '01166615-3')).toBe(true);
    expect(validarContaBancaria('bb', '2902-5', '01248654-X')).toBe(true);
    expect(validarContaBancaria('bradesco', '2113-0', '0301357-P')).toBe(true);
    expect(validarContaBancaria('bradesco', '7980-4', '0711255-6')).toBe(true);
    expect(validarContaBancaria('caixa', '2004', '00100000448-6')).toBe(true);
    expect(validarContaBancaria('caixa', '1383', '00100006997-8')).toBe(true);
    expect(validarContaBancaria('santander', '0189', '01017417-9')).toBe(true);
    expect(validarContaBancaria('santander', '4670', '01010414-6')).toBe(true);
    expect(validarContaBancaria('santander', '4670', '01010414-7')).toBe(false);
  });
  test.each(Object.keys(BANCOS) as Banco[])('5k %s', (banco) => {
    const rng = mulberry32(9);
    for (let i = 0; i < 5000; i++) {
      const c = contaBancaria({ banco, rng });
      expect(c.banco).toBe(BANCOS[banco].codigo);
      expect(validarContaBancaria(banco, c.agencia, c.conta), JSON.stringify(c)).toBe(true);
    }
  });
});

describe('pessoal', () => {
  test('nome and parents share surnames', () => {
    const rng = mulberry32(2);
    const nome = nomeCompleto({ sexo: 'F', rng });
    expect(nome.split(' ')).toHaveLength(3);
    const { mae, pai } = pais(nome, { rng });
    expect(mae.endsWith(nome.split(' ')[1]!)).toBe(true);
    expect(pai.endsWith(nome.split(' ')[2]!)).toBe(true);
  });
  test('email derived from name, reserved domain, no accents', () => {
    const rng = mulberry32(3);
    for (let i = 0; i < 500; i++) {
      const e = email('João Araújo Conceição', { rng });
      expect(e).toMatch(/^[a-z0-9.]+@example\.(com|net|org)$/);
      expect(e).toMatch(/joao|j/);
    }
    expect(email('Ana Silva', { dominio: 'empresa.test' })).toMatch(/@empresa\.test$/);
  });
  test.each(UFS)('telefone %s: DDD matches UF', (uf) => {
    for (const tipo of ['fixo', 'celular'] as const) {
      for (const v of roundTrip(telefone, { uf, tipo }, 300)) expect(dddUF(v)).toBe(uf);
    }
  });
  test('telefone invalid', () => {
    expect(telefone.validate('(10) 99999-9999')).toBe(false);
    expect(telefone.validate('(11) 99999-9999')).toBe(true);
    expect(telefone.validate('(11) 1999-9999')).toBe(false);
  });
  test('nascimento respects age range', () => {
    const rng = mulberry32(4);
    for (let i = 0; i < 5000; i++) {
      const d = nascimento({ idadeMin: 18, idadeMax: 25, rng, now: NOW });
      const age = idade(d, NOW);
      expect(age).toBeGreaterThanOrEqual(18);
      expect(age).toBeLessThanOrEqual(25);
    }
    expect(dataISO('06/10/2000')).toBe('2000-10-06');
  });
  test('senha honors classes and size', () => {
    const rng = mulberry32(6);
    for (let i = 0; i < 1000; i++) {
      const s = senha({ tamanho: 10, rng });
      expect(s).toHaveLength(10);
      expect(s).toMatch(/[A-Z]/);
      expect(s).toMatch(/[a-z]/);
      expect(s).toMatch(/\d/);
      expect(s).toMatch(/[^A-Za-z0-9]/);
    }
    expect(
      senha({ tamanho: 8, simbolos: false, maiusculas: false, minusculas: false, rng }),
    ).toMatch(/^\d{8}$/);
  });
});

describe('endereco', () => {
  test.each(UFS)('%s: real address, CEP within UF range', (uf) => {
    const rng = mulberry32(8);
    for (let i = 0; i < 50; i++) {
      const e = endereco({ uf, rng });
      expect(e.uf).toBe(uf);
      expect(cepUF(e.cep)).toBe(uf);
      expect(cep.validate(e.cep, { uf })).toBe(true);
      expect(e.logradouro && e.bairro && e.cidade).toBeTruthy();
    }
    roundTrip(cep, { uf }, 500);
  });
});

describe('extras', () => {
  test('uuid v4, deterministic with seed', () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 1000; i++) {
      expect(uuid({ rng })).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    }
    expect(uuid({ rng: mulberry32(2) })).toBe(uuid({ rng: mulberry32(2) }));
  });
  test('lorem and numero', () => {
    expect(lorem({ palavras: 5, rng: mulberry32(1) }).split(' ')).toHaveLength(5);
    expect(lorem({ paragrafos: 3 }).split('\n\n')).toHaveLength(3);
    const rng = mulberry32(1);
    for (let i = 0; i < 1000; i++) {
      const n = numero({ min: 5, max: 7, rng });
      expect(n >= 5 && n <= 7).toBe(true);
    }
  });
});

test('semAcento', () => {
  expect(semAcento('São João, Itaú, Pará, ç')).toBe('Sao Joao, Itau, Para, c');
});
