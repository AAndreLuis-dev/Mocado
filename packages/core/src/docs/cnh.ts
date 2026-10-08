import { type Generator } from '../types';
import { defaultRng, digits } from '../rng';
import { allSame, onlyDigits, toNums, weighted } from '../mask';

function withDv(base9: string): string | null {
  const n = toNums(base9);
  let d1 = weighted(n, [9, 8, 7, 6, 5, 4, 3, 2, 1]) % 11;
  let discount = 0;
  if (d1 >= 10) {
    d1 = 0;
    discount = 2;
  }
  const x = weighted(n, [1, 2, 3, 4, 5, 6, 7, 8, 9]) % 11;
  const d2 = x >= 10 ? 0 : x - discount;
  return d2 < 0 ? null : `${base9}${d1}${d2}`;
}

const format = (value: string) => onlyDigits(value);

export const cnh: Generator = {
  generate({ rng = defaultRng } = {}) {
    for (;;) {
      const base = digits(rng, 9);
      const v = allSame(base) ? null : withDv(base);
      if (v) return v;
    }
  },
  validate(value) {
    const v = onlyDigits(value);
    return (
      v.length === 11 && !allSame(v) && !/[^\d\s.-]/.test(value) && withDv(v.slice(0, 9)) === v
    );
  },
  format,
};
