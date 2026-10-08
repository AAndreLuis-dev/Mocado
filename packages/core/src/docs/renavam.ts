import { type Generator } from '../types';
import { defaultRng, digits } from '../rng';
import { allSame, onlyDigits, toNums, weighted } from '../mask';

function withDv(base10: string): string {
  const d = ((weighted(toNums(base10), [3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) * 10) % 11) % 10;
  return base10 + d;
}

export const renavam: Generator = {
  generate({ rng = defaultRng } = {}) {
    let v: string;
    do v = withDv(digits(rng, 10));
    while (allSame(v));
    return v;
  },
  validate(value) {
    const v = onlyDigits(value);
    return (
      v.length === 11 && !allSame(v) && !/[^\d\s.-]/.test(value) && withDv(v.slice(0, 10)) === v
    );
  },
  format: (value) => onlyDigits(value),
};
