import { type Generator } from './types';
import { defaultRng, digits, int, pick, type Rng } from './rng';
import { mask, onlyDigits, pad, toDigitValues, weighted } from './mask';

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'elo' | 'hipercard' | 'diners';

interface CardBrandSpec {
  name: string;
  prefixes: readonly string[];
  length: number;
  cvv: number;
  mask: string;
}

export const CARD_BRANDS: Record<CardBrand, CardBrandSpec> = {
  visa: { name: 'Visa', prefixes: ['4'], length: 16, cvv: 3, mask: '#### #### #### ####' },
  mastercard: {
    name: 'Mastercard',
    prefixes: ['51', '52', '53', '54', '55', '2221', '2500', '2720'],
    length: 16,
    cvv: 3,
    mask: '#### #### #### ####',
  },
  amex: {
    name: 'American Express',
    prefixes: ['34', '37'],
    length: 15,
    cvv: 4,
    mask: '#### ###### #####',
  },
  elo: {
    name: 'Elo',
    prefixes: [
      '401178',
      '438935',
      '451416',
      '457631',
      '504175',
      '506699',
      '509048',
      '636297',
      '636368',
      '650031',
    ],
    length: 16,
    cvv: 3,
    mask: '#### #### #### ####',
  },
  hipercard: {
    name: 'Hipercard',
    prefixes: ['606282'],
    length: 16,
    cvv: 3,
    mask: '#### #### #### ####',
  },
  diners: {
    name: 'Diners Club',
    prefixes: ['300', '301', '305', '36', '38'],
    length: 14,
    cvv: 3,
    mask: '#### ###### ####',
  },
};

export function isLuhnValid(num: string): boolean {
  let sum = 0;
  for (let i = num.length - 1, dbl = false; i >= 0; i--, dbl = !dbl) {
    let d = Number(num[i]);
    if (dbl) d = d * 2 > 9 ? d * 2 - 9 : d * 2;
    sum += d;
  }
  return sum % 10 === 0;
}

function appendLuhnDigit(body: string): string {
  for (let d = 0; d <= 9; d++) if (isLuhnValid(body + d)) return body + d;
  throw new Error('unreachable');
}

const cardMask = (v: string) =>
  v.length === 15
    ? '#### ###### #####'
    : v.length === 14
      ? '#### ###### ####'
      : '#### #### #### ####';

export interface CreditCardOptions {
  brand?: CardBrand;
}

export const creditCard: Generator<CreditCardOptions> = {
  generate({ brand, rng = defaultRng, masked = true } = {}) {
    const spec = CARD_BRANDS[brand ?? pick(rng, Object.keys(CARD_BRANDS) as CardBrand[])];
    const prefix = pick(rng, spec.prefixes);
    const v = appendLuhnDigit(prefix + digits(rng, spec.length - prefix.length - 1));
    return masked ? mask(v, spec.mask) : v;
  },
  validate(value, { brand } = {}) {
    const v = onlyDigits(value);
    if (/[^\d\s-]/.test(value) || v.length < 13 || v.length > 19 || !isLuhnValid(v)) return false;
    if (!brand) return true;
    const spec = CARD_BRANDS[brand];
    return v.length === spec.length && spec.prefixes.some((p) => v.startsWith(p));
  },
  format: (value, { masked }) => {
    const v = onlyDigits(value);
    return masked ? mask(v, cardMask(v)) : v;
  },
};

export interface CreditCardDetails {
  number: string;
  brand: string;
  expiry: string;
  cvv: string;
}

export function creditCardDetails({
  brand,
  rng = defaultRng,
  masked = true,
  now = new Date(),
}: CreditCardOptions & { rng?: Rng; masked?: boolean; now?: Date } = {}): CreditCardDetails {
  const b = brand ?? pick(rng, Object.keys(CARD_BRANDS) as CardBrand[]);
  const months = int(rng, 1, 96);
  const exp = new Date(now.getFullYear(), now.getMonth() + months, 1);
  return {
    number: creditCard.generate({ brand: b, rng, masked }),
    brand: CARD_BRANDS[b].name,
    expiry: `${pad(exp.getMonth() + 1, 2)}/${String(exp.getFullYear()).slice(2)}`,
    cvv: digits(rng, CARD_BRANDS[b].cvv),
  };
}

export type Bank = 'bb' | 'bradesco' | 'itau' | 'caixa' | 'santander';

export const BANKS: Record<Bank, { code: string; name: string }> = {
  bb: { code: '001', name: 'Banco do Brasil' },
  bradesco: { code: '237', name: 'Bradesco' },
  itau: { code: '341', name: 'Itaú' },
  caixa: { code: '104', name: 'Caixa Econômica Federal' },
  santander: { code: '033', name: 'Santander' },
};

export interface BankAccount {
  bankCode: string;
  bankName: string;
  branch: string;
  account: string;
}

const dv11 = (body: string, weights: number[], ten: string) => {
  const d = 11 - (weighted(toDigitValues(body), weights) % 11);
  return d === 11 ? '0' : d === 10 ? ten : String(d);
};

const itauDv = (ag: string, conta: string) => {
  const sum = [...(ag + conta)]
    .map((c, i) => Number(c) * (i % 2 === 0 ? 2 : 1))
    .reduce((a, n) => a + Math.floor(n / 10) + (n % 10), 0);
  return String((10 - (sum % 10)) % 10);
};

const caixaDv = (ag: string, opConta: string) =>
  String(
    ((weighted(toDigitValues(ag + opConta), [8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) * 10) %
      11) %
      10,
  );

const santanderDv = (ag: string, conta: string) =>
  String(
    (10 -
      (weighted(toDigitValues(ag + '00' + conta), [9, 7, 3, 1, 0, 0, 9, 7, 1, 3, 1, 9, 7, 3]) %
        10)) %
      10,
  );

const BANK_RULES: Record<
  Bank,
  {
    branchDigit: (a: string) => string | null;
    accountLength: number;
    accountDigit: (ag: string, c: string) => string;
  }
> = {
  bb: {
    branchDigit: (a) => dv11(a, [5, 4, 3, 2], 'X'),
    accountLength: 8,
    accountDigit: (_, c) => dv11(c, [9, 8, 7, 6, 5, 4, 3, 2], 'X'),
  },
  bradesco: {
    branchDigit: (a) => dv11(a, [5, 4, 3, 2], '0'),
    accountLength: 7,
    accountDigit: (_, c) => dv11(c, [2, 7, 6, 5, 4, 3, 2], 'P'),
  },
  itau: { branchDigit: () => null, accountLength: 5, accountDigit: itauDv },
  caixa: { branchDigit: () => null, accountLength: 11, accountDigit: caixaDv },
  santander: { branchDigit: () => null, accountLength: 8, accountDigit: santanderDv },
};

export function bankAccount({
  bank,
  rng = defaultRng,
}: { bank?: Bank; rng?: Rng } = {}): BankAccount {
  const b = bank ?? pick(rng, Object.keys(BANKS) as Bank[]);
  const rule = BANK_RULES[b];
  const ag = pad(int(rng, 1, 9999), 4);
  const body =
    b === 'caixa'
      ? pick(rng, ['001', '013']) + digits(rng, 8)
      : String(int(rng, 1, 9)) + digits(rng, rule.accountLength - 1);
  const agDv = rule.branchDigit(ag);
  return {
    bankCode: BANKS[b].code,
    bankName: BANKS[b].name,
    branch: agDv ? `${ag}-${agDv}` : ag,
    account: `${body}-${rule.accountDigit(ag, body)}`,
  };
}

export function isValidBankAccount(bank: Bank, branch: string, account: string): boolean {
  const rule = BANK_RULES[bank];
  const [ag = '', agDv] = branch.toUpperCase().split('-');
  const [body = '', dv] = account.toUpperCase().replace(/\./g, '').split('-');
  if (!/^\d{4}$/.test(ag) || body.length !== rule.accountLength || !/^\d+$/.test(body))
    return false;
  const expectedAg = rule.branchDigit(ag);
  if ((expectedAg ?? undefined) !== agDv) return false;
  return rule.accountDigit(ag, body) === dv;
}
