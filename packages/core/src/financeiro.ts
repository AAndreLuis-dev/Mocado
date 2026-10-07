import { type Generator } from './types';
import { defaultRng, digits, int, pick, type Rng } from './rng';
import { mask, onlyDigits, pad, toNums, weighted } from './mask';

// ---------- Cartão de crédito ----------

export type Bandeira = 'visa' | 'mastercard' | 'amex' | 'elo' | 'hipercard' | 'diners';

interface BandeiraSpec {
  nome: string;
  prefixes: readonly string[];
  len: number;
  cvv: number;
  mask: string;
}

export const BANDEIRAS: Record<Bandeira, BandeiraSpec> = {
  visa: { nome: 'Visa', prefixes: ['4'], len: 16, cvv: 3, mask: '#### #### #### ####' },
  mastercard: {
    nome: 'Mastercard',
    prefixes: ['51', '52', '53', '54', '55', '2221', '2500', '2720'],
    len: 16,
    cvv: 3,
    mask: '#### #### #### ####',
  },
  amex: {
    nome: 'American Express',
    prefixes: ['34', '37'],
    len: 15,
    cvv: 4,
    mask: '#### ###### #####',
  },
  elo: {
    nome: 'Elo',
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
    len: 16,
    cvv: 3,
    mask: '#### #### #### ####',
  },
  hipercard: {
    nome: 'Hipercard',
    prefixes: ['606282'],
    len: 16,
    cvv: 3,
    mask: '#### #### #### ####',
  },
  diners: {
    nome: 'Diners Club',
    prefixes: ['300', '301', '305', '36', '38'],
    len: 14,
    cvv: 3,
    mask: '#### ###### ####',
  },
};

export function luhnValid(num: string): boolean {
  let sum = 0;
  for (let i = num.length - 1, dbl = false; i >= 0; i--, dbl = !dbl) {
    let d = Number(num[i]);
    if (dbl) d = d * 2 > 9 ? d * 2 - 9 : d * 2;
    sum += d;
  }
  return sum % 10 === 0;
}

function luhnComplete(body: string): string {
  for (let d = 0; d <= 9; d++) if (luhnValid(body + d)) return body + d;
  throw new Error('unreachable');
}

const cardMask = (v: string) =>
  v.length === 15
    ? '#### ###### #####'
    : v.length === 14
      ? '#### ###### ####'
      : '#### #### #### ####';

export interface CartaoOptions {
  bandeira?: Bandeira;
}

export const cartao: Generator<CartaoOptions> = {
  generate({ bandeira, rng = defaultRng, masked = true } = {}) {
    const spec = BANDEIRAS[bandeira ?? pick(rng, Object.keys(BANDEIRAS) as Bandeira[])];
    const prefix = pick(rng, spec.prefixes);
    const v = luhnComplete(prefix + digits(rng, spec.len - prefix.length - 1));
    return masked ? mask(v, spec.mask) : v;
  },
  validate(value, { bandeira } = {}) {
    const v = onlyDigits(value);
    if (/[^\d\s-]/.test(value) || v.length < 13 || v.length > 19 || !luhnValid(v)) return false;
    if (!bandeira) return true;
    const spec = BANDEIRAS[bandeira];
    return v.length === spec.len && spec.prefixes.some((p) => v.startsWith(p));
  },
  format: (value, { masked }) => {
    const v = onlyDigits(value);
    return masked ? mask(v, cardMask(v)) : v;
  },
};

export interface CartaoCompleto {
  numero: string;
  bandeira: string;
  validade: string; // MM/AA
  cvv: string;
}

export function cartaoCompleto({
  bandeira,
  rng = defaultRng,
  masked = true,
  now = new Date(),
}: CartaoOptions & { rng?: Rng; masked?: boolean; now?: Date } = {}): CartaoCompleto {
  const b = bandeira ?? pick(rng, Object.keys(BANDEIRAS) as Bandeira[]);
  const months = int(rng, 1, 96); // always in the future
  const exp = new Date(now.getFullYear(), now.getMonth() + months, 1);
  return {
    numero: cartao.generate({ bandeira: b, rng, masked }),
    bandeira: BANDEIRAS[b].nome,
    validade: `${pad(exp.getMonth() + 1, 2)}/${String(exp.getFullYear()).slice(2)}`,
    cvv: digits(rng, BANDEIRAS[b].cvv),
  };
}

// ---------- Conta bancária ----------

export type Banco = 'bb' | 'bradesco' | 'itau' | 'caixa' | 'santander';

export const BANCOS: Record<Banco, { codigo: string; nome: string }> = {
  bb: { codigo: '001', nome: 'Banco do Brasil' },
  bradesco: { codigo: '237', nome: 'Bradesco' },
  itau: { codigo: '341', nome: 'Itaú' },
  caixa: { codigo: '104', nome: 'Caixa Econômica Federal' },
  santander: { codigo: '033', nome: 'Santander' },
};

export interface ContaBancaria {
  banco: string; // código COMPE
  nomeBanco: string;
  agencia: string; // "1234" or "1234-5"
  conta: string; // "12345678-9"
}

/** 11 − (Σ mod 11); 10 → `ten`, 11 → "0". */
const dv11 = (body: string, weights: number[], ten: string) => {
  const d = 11 - (weighted(toNums(body), weights) % 11);
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
    ((weighted(toNums(ag + opConta), [8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) * 10) % 11) %
      10,
  );

const santanderDv = (ag: string, conta: string) =>
  String(
    (10 - (weighted(toNums(ag + '00' + conta), [9, 7, 3, 1, 0, 0, 9, 7, 1, 3, 1, 9, 7, 3]) % 10)) %
      10,
  );

// Bank rules, cross-checked with darkroomdevs/CheckDigitValidator (MIT) test data.
const BANK_RULES: Record<
  Banco,
  { ag: (a: string) => string | null; conta: number; dv: (ag: string, c: string) => string }
> = {
  bb: {
    ag: (a) => dv11(a, [5, 4, 3, 2], 'X'),
    conta: 8,
    dv: (_, c) => dv11(c, [9, 8, 7, 6, 5, 4, 3, 2], 'X'),
  },
  bradesco: {
    ag: (a) => dv11(a, [5, 4, 3, 2], '0'),
    conta: 7,
    dv: (_, c) => dv11(c, [2, 7, 6, 5, 4, 3, 2], 'P'),
  },
  itau: { ag: () => null, conta: 5, dv: itauDv },
  caixa: { ag: () => null, conta: 11, dv: caixaDv }, // operação (3) + conta (8)
  santander: { ag: () => null, conta: 8, dv: santanderDv },
};

export function contaBancaria({
  banco,
  rng = defaultRng,
}: { banco?: Banco; rng?: Rng } = {}): ContaBancaria {
  const b = banco ?? pick(rng, Object.keys(BANCOS) as Banco[]);
  const rule = BANK_RULES[b];
  const ag = pad(int(rng, 1, 9999), 4);
  const body =
    b === 'caixa'
      ? pick(rng, ['001', '013']) + digits(rng, 8)
      : String(int(rng, 1, 9)) + digits(rng, rule.conta - 1);
  const agDv = rule.ag(ag);
  return {
    banco: BANCOS[b].codigo,
    nomeBanco: BANCOS[b].nome,
    agencia: agDv ? `${ag}-${agDv}` : ag,
    conta: `${body}-${rule.dv(ag, body)}`,
  };
}

export function validarContaBancaria(banco: Banco, agencia: string, conta: string): boolean {
  const rule = BANK_RULES[banco];
  const [ag = '', agDv] = agencia.toUpperCase().split('-');
  const [body = '', dv] = conta.toUpperCase().replace(/\./g, '').split('-');
  if (!/^\d{4}$/.test(ag) || body.length !== rule.conta || !/^\d+$/.test(body)) return false;
  const expectedAg = rule.ag(ag);
  if ((expectedAg ?? undefined) !== agDv) return false;
  return rule.dv(ag, body) === dv;
}
