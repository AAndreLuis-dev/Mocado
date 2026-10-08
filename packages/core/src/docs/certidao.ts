import { type Generator } from '../types';
import { defaultRng, digits, int, pick } from '../rng';
import { maskIf, onlyDigits, pad, toNums } from '../mask';

export type CertidaoTipo = 'nascimento' | 'casamento' | 'obito';

const LIVRO: Record<CertidaoTipo, number> = { nascimento: 1, casamento: 2, obito: 4 };

function dv(nums: number[], offset: number): number {
  const r = nums.reduce((acc, n, i) => acc + n * ((i + offset) % 11), 0) % 11;
  return r === 10 ? 1 : r;
}

function withDv(base30: string): string {
  const d1 = dv(toNums(base30), 2);
  const d2 = dv(toNums(base30 + d1), 1);
  return `${base30}${d1}${d2}`;
}

const format = (value: string, { masked }: { masked: boolean }) =>
  maskIf(onlyDigits(value), '###### ## ## #### # ##### ### ####### ##', masked);

export interface CertidaoOptions {
  tipo?: CertidaoTipo;
  now?: Date;
}

export const certidao: Generator<CertidaoOptions> = {
  generate({ tipo, rng = defaultRng, masked = true, now = new Date() } = {}) {
    const t = tipo ?? pick(rng, ['nascimento', 'casamento', 'obito'] as const);
    const base =
      String(int(rng, 1, 9)) +
      digits(rng, 5) +
      '01' +
      '55' +
      int(rng, now.getFullYear() - 40, now.getFullYear()) +
      LIVRO[t] +
      pad(int(rng, 1, 999), 5) +
      pad(int(rng, 1, 300), 3) +
      pad(int(rng, 1, 99999), 7);
    return format(withDv(base), { masked });
  },
  validate(value, { tipo } = {}) {
    const v = onlyDigits(value);
    if (v.length !== 32 || /[^\d\s.-]/.test(value)) return false;
    if (tipo && Number(v[14]) !== LIVRO[tipo]) return false;
    return withDv(v.slice(0, 30)) === v;
  },
  format,
};

export function certidaoTipo(value: string): CertidaoTipo | undefined {
  const d = Number(onlyDigits(value)[14]);
  return (Object.keys(LIVRO) as CertidaoTipo[]).find((t) => LIVRO[t] === d);
}
