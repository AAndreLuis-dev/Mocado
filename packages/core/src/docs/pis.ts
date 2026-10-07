import { type Generator } from '../types';
import { defaultRng, digits } from '../rng';
import { allSame, maskIf, onlyDigits, toNums, weighted } from '../mask';

function withDv(base10: string): string {
  const r = weighted(toNums(base10), [3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) % 11;
  const d = 11 - r;
  return base10 + (d >= 10 ? 0 : d);
}

const format = (value: string, { masked }: { masked: boolean }) =>
  maskIf(onlyDigits(value), '###.#####.##-#', masked);

/** PIS/PASEP/NIT. */
export const pis: Generator = {
  generate({ rng = defaultRng, masked = true } = {}) {
    let v: string;
    do v = withDv('1' + digits(rng, 9));
    while (allSame(v));
    return format(v, { masked });
  },
  validate(value) {
    const v = onlyDigits(value);
    return (
      v.length === 11 && !allSame(v) && !/[^\d\s.-]/.test(value) && withDv(v.slice(0, 10)) === v
    );
  },
  format,
};
