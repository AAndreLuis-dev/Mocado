import { type Generator } from '../types';
import { defaultRng, digits, int, pick, type Rng } from '../rng';
import { mask, pad, range } from '../mask';
import { UFS, type UF } from '../uf';

function modR(s: string, weights: readonly number[], div = 11): number {
  let sum = 0;
  for (let i = s.length - 1, k = 0; i >= 0; i--, k++)
    sum += Number(s[i]) * weights[k % weights.length]!;
  return sum % div;
}

const W = range(2, 9);
const std = (r: number) => (r < 2 ? 0 : 11 - r);
const dvStd = (base: string, w: readonly number[] = W) => base + std(modR(base, w));
const dv10 = (base: string, w: readonly number[] = W) => {
  const d = 11 - modR(base, w);
  return base + (d >= 10 ? 0 : d);
};

interface Spec {
  mask: string;
  gen(rng: Rng): string;
  valid(v: string): boolean;
}

function appended(
  mask: string,
  body: (rng: Rng) => string,
  complete: (body: string) => string | null,
  alt?: (v: string) => boolean,
): Spec {
  const len = mask.replace(/[^#]/g, '').length;
  const bodyLen = body(() => 0).length;
  return {
    mask,
    gen(rng) {
      for (;;) {
        const v = complete(body(rng));
        if (v) return v;
      }
    },
    valid: (v) => (v.length === len && complete(v.slice(0, bodyLen)) === v) || !!alt?.(v),
  };
}

const prefixed = (prefix: string, n: number) => (rng: Rng) => prefix + digits(rng, n);
const startsWith = (prefix: string, fn: (b: string) => string | null) => (b: string) =>
  b.startsWith(prefix) ? fn(b) : null;
const trivial = (prefix: string, mask: string, strict = true) =>
  appended(
    mask,
    prefixed(prefix, 8 - prefix.length),
    strict ? startsWith(prefix, (b) => dvStd(b)) : (b) => dvStd(b),
  );

function ba(body: string): string {
  const n = body.length;
  const mod10 = '0123458'.includes(body[n === 7 ? 1 : 0]!);
  const calc = (s: string, w: number[]) => {
    const r = modR(s, w, mod10 ? 10 : 11);
    return mod10 ? (r === 0 ? 0 : 10 - r) : std(r);
  };
  const d2 = calc(body, range(2, n + 1));
  const d1 = calc(body + d2, range(2, n + 2));
  return `${body}${d1}${d2}`;
}

function mg(body: string): string {
  const s = body.slice(0, 3) + '0' + body.slice(3);
  const products = [...s].map((c, i) => Number(c) * (i % 2 === 0 ? 1 : 2)).join('');
  const sum = [...products].reduce((a, c) => a + Number(c), 0);
  const d1 = (10 - (sum % 10)) % 10;
  return dvStd(body + d1, range(2, 11));
}

function sp(v: string): boolean {
  const lastDigit = (r: number) => r % 10;
  const d1 = (b8: string) => lastDigit(modR(b8, [10, 8, 7, 6, 5, 4, 3, 1]));
  if (v.startsWith('P')) {
    return /^P\d{12}$/.test(v) && Number(v[9]) === d1(v.slice(1, 9));
  }
  if (!/^\d{12}$/.test(v) || Number(v[8]) !== d1(v.slice(0, 8))) return false;
  return Number(v[11]) === lastDigit(modR(v.slice(0, 11), range(2, 10)));
}

function spGen(rng: Rng): string {
  const b8 = digits(rng, 8);
  const d1 = modR(b8, [10, 8, 7, 6, 5, 4, 3, 1]) % 10;
  const b11 = `${b8}${d1}${digits(rng, 2)}`;
  return b11 + (modR(b11, range(2, 10)) % 10);
}

function ap(body: string): string | null {
  if (!body.startsWith('03')) return null;
  const n = Number(body);
  const [p, d] =
    n >= 3000001 && n <= 3017000 ? [5, 0] : n >= 3017001 && n <= 3019022 ? [9, 1] : [0, 0];
  const r = modR(`${p}${body}`, [2, 3, 4, 5, 6, 7, 8, 9, 1]);
  return body + (r === 1 ? 0 : r === 0 ? d : 11 - r);
}

function go(body: string): string | null {
  if (!['10', '11', '15'].includes(body.slice(0, 2))) return null;
  const r = modR(body, W);
  const n = Number(body);
  return body + (r === 0 ? 0 : r === 1 ? (n >= 10103105 && n <= 10119997 ? 1 : 0) : 11 - r);
}

const rn = (body: string) => {
  if (!body.startsWith('20')) return null;
  const r = (modR(body, range(2, body.length + 1)) * 10) % 11;
  return body + (r === 10 ? 0 : r);
};

const SPECS: Record<UF, Spec> = {
  AC: appended(
    '##.###.###/###-##',
    prefixed('01', 9),
    startsWith('01', (b) => dvStd(dvStd(b))),
  ),
  AL: appended(
    '#########',
    (rng) => '24' + pick(rng, ['0', '3', '5', '7', '8']) + digits(rng, 5),
    startsWith('24', (b) => {
      const r = (modR(b, W) * 10) % 11;
      return b + (r === 10 ? 0 : r);
    }),
  ),
  AP: appended('#########', prefixed('03', 6), ap),
  AM: trivial('04', '##.###.###-#', false),
  BA: appended(
    '#######-##',
    (rng) => digits(rng, 7),
    ba,
    (v) => v.length === 8 && ba(v.slice(0, 6)) === v,
  ),
  CE: trivial('06', '########-#'),
  DF: appended(
    '###########-##',
    (rng) => '07' + pick(rng, ['3', '4']) + digits(rng, 5) + '001',
    startsWith('07', (b) => dvStd(dvStd(b))),
  ),
  ES: trivial('08', '#########', false),
  GO: appended('##.###.###-#', (rng) => pick(rng, ['10', '11', '15']) + digits(rng, 6), go),
  MA: trivial('12', '#########'),
  MT: appended(
    '##########-#',
    prefixed('0013', 6),
    (b) => dvStd(b),
    (v) => v.length === 9 && dvStd(v.slice(0, 8)) === v,
  ),
  MS: trivial('28', '#########'),
  MG: appended('###.###.###/####', (rng) => digits(rng, 11), mg),
  PA: trivial('15', '##-######-#'),
  PB: trivial('16', '########-#', false),
  PR: appended(
    '########-##',
    (rng) => digits(rng, 8),
    (b) => dv10(dv10(b, range(2, 7)), range(2, 7)),
  ),
  PE: appended(
    '#######-##',
    (rng) => digits(rng, 7),
    (b) => dv10(dv10(b)),
  ),
  PI: trivial('19', '#########', false),
  RJ: appended(
    '##.###.##-#',
    (rng) => digits(rng, 7),
    (b) => dvStd(b, range(2, 7)),
  ),
  RN: appended(
    '##.###.###-#',
    prefixed('20', 6),
    rn,
    (v) => v.length === 10 && rn(v.slice(0, 9)) === v,
  ),
  RS: appended(
    '###/#######',
    (rng) => pad(int(rng, 1, 467), 3) + digits(rng, 6),
    (b) => dvStd(b),
  ),
  RO: appended(
    '#############-#',
    (rng) => digits(rng, 13),
    (b) => {
      const d = 11 - modR(b, W);
      return b + (d >= 10 ? d - 10 : d);
    },
  ),
  RR: appended(
    '########-#',
    prefixed('24', 6),
    startsWith('24', (b) => b + modR(b, range(1, 8).reverse(), 9)),
  ),
  SC: trivial('25', '###.###.###', false),
  SP: { mask: '###.###.###.###', gen: spGen, valid: sp },
  SE: trivial('27', '########-#', false),
  TO: appended(
    '##.###.###-#',
    prefixed('29', 6),
    (b) => dvStd(b),
    (v) => {
      if (v.length !== 11 || !['01', '02', '03', '99'].includes(v.slice(2, 4))) return false;
      return dvStd(v.slice(0, 2) + v.slice(4, 10)) === v.slice(0, 2) + v.slice(4);
    },
  ),
};

const clean = (value: string) => value.toUpperCase().replace(/[.\-/\s]/g, '');

export function ieUFs(value: string): UF[] {
  const v = clean(value);
  if (!/^P?\d+$/.test(v)) return [];
  return UFS.filter((uf) => (uf === 'SP' || /^\d+$/.test(v)) && SPECS[uf].valid(v));
}

export interface IeOptions {
  uf?: UF;
}

const format = (value: string, { masked, uf }: { masked: boolean; uf?: UF }) => {
  const v = clean(value);
  const target = uf ?? ieUFs(v)[0];
  if (!masked || !target || v.startsWith('P')) return v;
  return mask(v, SPECS[target].mask);
};

export const ie: Generator<IeOptions> = {
  generate({ uf, rng = defaultRng, masked = true } = {}) {
    const target = uf ?? pick(rng, UFS);
    return format(SPECS[target].gen(rng), { masked, uf: target });
  },
  validate(value, { uf } = {}) {
    const ufs = ieUFs(value);
    return uf ? ufs.includes(uf) : ufs.length > 0;
  },
  format,
};
