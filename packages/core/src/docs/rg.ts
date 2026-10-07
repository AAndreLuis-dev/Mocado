import { type Generator } from '../types';
import { defaultRng, digits } from '../rng';
import { allSame, maskIf, strip, toNums, weighted } from '../mask';

// RG SSP-SP: 8 digits + DV = Σ(d × 9..2) mod 11, 10 → "X".
function dv(base8: string): string {
  const r = weighted(toNums(base8), [9, 8, 7, 6, 5, 4, 3, 2]) % 11;
  return r === 10 ? 'X' : String(r);
}

const format = (value: string, { masked }: { masked: boolean }) =>
  maskIf(strip(value), '##.###.###-#', masked);

export const rg: Generator = {
  generate({ rng = defaultRng, masked = true } = {}) {
    let base: string;
    do base = digits(rng, 8);
    while (allSame(base) || base.startsWith('0'));
    return format(base + dv(base), { masked });
  },
  validate(value) {
    const v = strip(value);
    return /^\d{8}[\dX]$/.test(v) && !allSame(v.slice(0, 8)) && dv(v.slice(0, 8)) === v[8];
  },
  format,
};
