import { type Generator } from '../types';
import { alnum, defaultRng, digits, pick } from '../rng';
import { allSame, maskIf, mod11, strip, toNums } from '../mask';

const W1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const W2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function withDv(base12: string): string {
  const d1 = mod11(toNums(base12), W1);
  const d2 = mod11(toNums(base12 + d1), W2);
  return `${base12}${d1}${d2}`;
}

const format = (value: string, { masked }: { masked: boolean }) =>
  maskIf(strip(value), '##.###.###/####-##', masked);

export type CnpjTipo = 'numerico' | 'alfanumerico' | 'aleatorio';

export interface CnpjOptions {
  tipo?: CnpjTipo;
}

function base(rng: () => number, tipo: CnpjTipo): string {
  const kind = tipo === 'aleatorio' ? pick(rng, ['numerico', 'alfanumerico'] as const) : tipo;
  if (kind === 'numerico') return digits(rng, 8) + '0001';
  let root: string;
  do root = alnum(rng, 8);
  while (!/[A-Z]/.test(root));
  return root + '0001';
}

export const cnpj: Generator<CnpjOptions> = {
  generate({ tipo = 'numerico', rng = defaultRng, masked = true } = {}) {
    let value: string;
    do value = withDv(base(rng, tipo));
    while (allSame(value));
    return format(value, { masked });
  },
  validate(value) {
    if (/[^0-9A-Za-z./\s-]/.test(value)) return false;
    const v = strip(value);
    if (!/^[0-9A-Z]{12}\d{2}$/.test(v) || allSame(v)) return false;
    return withDv(v.slice(0, 12)) === v;
  },
  format,
};

export const isCnpjAlfanumerico = (value: string): boolean => /[A-Z]/.test(strip(value));
