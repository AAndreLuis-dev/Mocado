/** Uniform number in [0, 1). Inject a seeded one for deterministic tests. */
export type Rng = () => number;

export const defaultRng: Rng = Math.random;

/** Small, fast seeded PRNG (mulberry32). Not cryptographic — test data only. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [min, max] (inclusive). */
export const int = (rng: Rng, min: number, max: number): number =>
  min + Math.floor(rng() * (max - min + 1));

export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pick: empty list');
  return items[Math.floor(rng() * items.length)] as T;
}

export const digits = (rng: Rng, n: number): string =>
  Array.from({ length: n }, () => int(rng, 0, 9)).join('');

const ALNUM = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const alnum = (rng: Rng, n: number): string =>
  Array.from({ length: n }, () => pick(rng, [...ALNUM])).join('');

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const letters = (rng: Rng, n: number): string =>
  Array.from({ length: n }, () => pick(rng, [...LETTERS])).join('');
