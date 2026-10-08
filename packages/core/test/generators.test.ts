import { describe, expect, test } from 'vitest';
import {
  BANKS,
  CARD_BRANDS,
  creditCard,
  creditCardDetails,
  cep,
  cepUF,
  bankAccount,
  brDateToISO,
  dddUF,
  email,
  address,
  age,
  lorem,
  stripAccents,
  isLuhnValid,
  mulberry32,
  birthDate,
  fullName,
  randomNumber,
  parents,
  licensePlate,
  password,
  phone,
  UFS,
  uuid,
  isValidBankAccount,
  vehicle,
  type Bank,
  type CardBrand,
} from '../src';
import { roundTrip } from './helpers';

const NOW = new Date(2026, 9, 6);

describe('licensePlate', () => {
  test('formats', () => {
    expect(licensePlate.validate('ABC-1234')).toBe(true);
    expect(licensePlate.validate('ABC1D23')).toBe(true);
    expect(licensePlate.validate('ABC1D23', { kind: 'antiga' })).toBe(false);
    expect(licensePlate.validate('AB-1234')).toBe(false);
  });
  test.each(['antiga', 'mercosul', 'aleatorio'] as const)('5k %s', (kind) => {
    roundTrip(licensePlate, { kind });
  });
  test('vehicle', () => {
    const v = vehicle({ rng: mulberry32(1), now: NOW });
    expect(v.make && v.model).toBeTruthy();
    expect(Number(v.year)).toBeGreaterThanOrEqual(2011);
  });
});

describe('creditCard', () => {
  test('luhn known', () => {
    expect(isLuhnValid('4111111111111111')).toBe(true);
    expect(isLuhnValid('4111111111111112')).toBe(false);
  });
  test.each(Object.keys(CARD_BRANDS) as CardBrand[])('5k %s', (brand) => {
    for (const v of roundTrip(creditCard, { brand })) {
      expect(v.replace(/\D/g, '')).toHaveLength(CARD_BRANDS[brand].length);
    }
  });
  test('completo: future expiry, cvv size', () => {
    const rng = mulberry32(5);
    for (let i = 0; i < 1000; i++) {
      const c = creditCardDetails({ rng, now: NOW, brand: i % 2 ? 'amex' : 'visa' });
      const [mm = 0, yy = 0] = c.expiry.split('/').map(Number);
      expect(new Date(2000 + yy, mm, 0) > NOW).toBe(true);
      expect(c.cvv).toHaveLength(i % 2 ? 4 : 3);
    }
  });
});

describe('bankAccount', () => {
  test('real data (darkroomdevs/CheckDigitValidator, MIT)', () => {
    expect(isValidBankAccount('bb', '1584-9', '1166615-3')).toBe(false);
    expect(isValidBankAccount('bb', '1584-9', '01166615-3')).toBe(true);
    expect(isValidBankAccount('bb', '2902-5', '01248654-X')).toBe(true);
    expect(isValidBankAccount('bradesco', '2113-0', '0301357-P')).toBe(true);
    expect(isValidBankAccount('bradesco', '7980-4', '0711255-6')).toBe(true);
    expect(isValidBankAccount('caixa', '2004', '00100000448-6')).toBe(true);
    expect(isValidBankAccount('caixa', '1383', '00100006997-8')).toBe(true);
    expect(isValidBankAccount('santander', '0189', '01017417-9')).toBe(true);
    expect(isValidBankAccount('santander', '4670', '01010414-6')).toBe(true);
    expect(isValidBankAccount('santander', '4670', '01010414-7')).toBe(false);
  });
  test.each(Object.keys(BANKS) as Bank[])('5k %s', (bank) => {
    const rng = mulberry32(9);
    for (let i = 0; i < 5000; i++) {
      const c = bankAccount({ bank, rng });
      expect(c.bankCode).toBe(BANKS[bank].code);
      expect(isValidBankAccount(bank, c.branch, c.account), JSON.stringify(c)).toBe(true);
    }
  });
});

describe('personal', () => {
  test('fullName and parents share surnames', () => {
    const rng = mulberry32(2);
    const nome = fullName({ sex: 'F', rng });
    expect(nome.split(' ')).toHaveLength(3);
    const { mother, father } = parents(nome, { rng });
    expect(mother.endsWith(nome.split(' ')[1]!)).toBe(true);
    expect(father.endsWith(nome.split(' ')[2]!)).toBe(true);
  });
  test('email derived from name, reserved domain, no accents', () => {
    const rng = mulberry32(3);
    for (let i = 0; i < 500; i++) {
      const e = email('João Araújo Conceição', { rng });
      expect(e).toMatch(/^[a-z0-9.]+@example\.(com|net|org)$/);
      expect(e).toMatch(/joao|j/);
    }
    expect(email('Ana Silva', { domain: 'empresa.test' })).toMatch(/@empresa\.test$/);
  });
  test.each(UFS)('phone %s: DDD matches UF', (uf) => {
    for (const kind of ['fixo', 'celular'] as const) {
      for (const v of roundTrip(phone, { uf, kind }, 300)) expect(dddUF(v)).toBe(uf);
    }
  });
  test('phone invalid', () => {
    expect(phone.validate('(10) 99999-9999')).toBe(false);
    expect(phone.validate('(11) 99999-9999')).toBe(true);
    expect(phone.validate('(11) 1999-9999')).toBe(false);
  });
  test('birthDate respects age range', () => {
    const rng = mulberry32(4);
    for (let i = 0; i < 5000; i++) {
      const date = birthDate({ minAge: 18, maxAge: 25, rng, now: NOW });
      const years = age(date, NOW);
      expect(years).toBeGreaterThanOrEqual(18);
      expect(years).toBeLessThanOrEqual(25);
    }
    expect(brDateToISO('06/10/2000')).toBe('2000-10-06');
  });
  test('senha honors classes and size', () => {
    const rng = mulberry32(6);
    for (let i = 0; i < 1000; i++) {
      const s = password({ length: 10, rng });
      expect(s).toHaveLength(10);
      expect(s).toMatch(/[A-Z]/);
      expect(s).toMatch(/[a-z]/);
      expect(s).toMatch(/\d/);
      expect(s).toMatch(/[^A-Za-z0-9]/);
    }
    expect(
      password({ length: 8, symbols: false, uppercase: false, lowercase: false, rng }),
    ).toMatch(/^\d{8}$/);
  });
});

describe('address', () => {
  test.each(UFS)('%s: real address, CEP within UF range', (uf) => {
    const rng = mulberry32(8);
    for (let i = 0; i < 50; i++) {
      const e = address({ uf, rng });
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
    expect(lorem({ words: 5, rng: mulberry32(1) }).split(' ')).toHaveLength(5);
    expect(lorem({ paragraphs: 3 }).split('\n\n')).toHaveLength(3);
    const rng = mulberry32(1);
    for (let i = 0; i < 1000; i++) {
      const n = randomNumber({ min: 5, max: 7, rng });
      expect(n >= 5 && n <= 7).toBe(true);
    }
  });
});

test('stripAccents', () => {
  expect(stripAccents('São João, Itaú, Pará, ç')).toBe('Sao Joao, Itau, Para, c');
});
