import { type Generator } from '../types';
import { defaultRng, digits, int } from '../rng';
import { allSame, maskIf, mod11, onlyDigits, toNums } from '../mask';
import { CPF_REGION, type UF } from '../uf';

const W1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
const W2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

function withDv(base9: string): string {
  const d1 = mod11(toNums(base9), W1);
  const d2 = mod11(toNums(base9 + d1), W2);
  return `${base9}${d1}${d2}`;
}

const format = (value: string, { masked }: { masked: boolean }) =>
  maskIf(onlyDigits(value), '###.###.###-##', masked);

export interface CpfOptions {
  uf?: UF;
}

export const cpf: Generator<CpfOptions> = {
  generate({ uf, rng = defaultRng, masked = true } = {}) {
    let value: string;
    do {
      const region = uf ? CPF_REGION[uf] : int(rng, 0, 9);
      value = withDv(digits(rng, 8) + region);
    } while (allSame(value));
    return format(value, { masked });
  },
  validate(value) {
    const v = onlyDigits(value);
    if (v.length !== 11 || allSame(v) || /[^\d.\s-]/.test(value)) return false;
    return withDv(v.slice(0, 9)) === v;
  },
  format,
};

export const cpfRegion = (value: string): number => Number(onlyDigits(value)[8]);
