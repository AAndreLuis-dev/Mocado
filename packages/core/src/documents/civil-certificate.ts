import { type Generator } from '../types';
import { defaultRng, digits, int, pick } from '../rng';
import { maskIf, onlyDigits, pad, toDigitValues } from '../mask';

export type CertificateKind = 'nascimento' | 'casamento' | 'obito';

const BOOK_BY_KIND: Record<CertificateKind, number> = { nascimento: 1, casamento: 2, obito: 4 };

function dv(nums: number[], offset: number): number {
  const r = nums.reduce((acc, n, i) => acc + n * ((i + offset) % 11), 0) % 11;
  return r === 10 ? 1 : r;
}

function withDv(base30: string): string {
  const d1 = dv(toDigitValues(base30), 2);
  const d2 = dv(toDigitValues(base30 + d1), 1);
  return `${base30}${d1}${d2}`;
}

const format = (value: string, { masked }: { masked: boolean }) =>
  maskIf(onlyDigits(value), '###### ## ## #### # ##### ### ####### ##', masked);

export interface CivilCertificateOptions {
  kind?: CertificateKind;
  now?: Date;
}

export const civilCertificate: Generator<CivilCertificateOptions> = {
  generate({ kind, rng = defaultRng, masked = true, now = new Date() } = {}) {
    const chosenKind = kind ?? pick(rng, ['nascimento', 'casamento', 'obito'] as const);
    const base =
      String(int(rng, 1, 9)) +
      digits(rng, 5) +
      '01' +
      '55' +
      int(rng, now.getFullYear() - 40, now.getFullYear()) +
      BOOK_BY_KIND[chosenKind] +
      pad(int(rng, 1, 999), 5) +
      pad(int(rng, 1, 300), 3) +
      pad(int(rng, 1, 99999), 7);
    return format(withDv(base), { masked });
  },
  validate(value, { kind } = {}) {
    const v = onlyDigits(value);
    if (v.length !== 32 || /[^\d\s.-]/.test(value)) return false;
    if (kind && Number(v[14]) !== BOOK_BY_KIND[kind]) return false;
    return withDv(v.slice(0, 30)) === v;
  },
  format,
};

export function certificateKind(value: string): CertificateKind | undefined {
  const d = Number(onlyDigits(value)[14]);
  return (Object.keys(BOOK_BY_KIND) as CertificateKind[]).find((t) => BOOK_BY_KIND[t] === d);
}
