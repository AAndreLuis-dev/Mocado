export const strip = (value: string): string => value.toUpperCase().replace(/[^0-9A-Z]/g, '');

export const stripAccents = (value: string): string =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const onlyDigits = (value: string): string => value.replace(/\D/g, '');

export function mask(raw: string, pattern: string): string {
  let i = 0;
  let out = '';
  for (const ch of pattern) {
    if (i >= raw.length) break;
    out += ch === '#' ? raw[i++] : ch;
  }
  return out + raw.slice(i);
}

export const maskIf = (raw: string, pattern: string, masked: boolean): string =>
  masked ? mask(raw, pattern) : raw;

export function mod11(values: readonly number[], weights: readonly number[]): number {
  const r = weighted(values, weights) % 11;
  return r < 2 ? 0 : 11 - r;
}

export const toDigitValues = (s: string): number[] => [...s].map((c) => c.charCodeAt(0) - 48);

export const allSame = (s: string): boolean => /^(.)\1*$/.test(s);

export const weighted = (values: readonly number[], weights: readonly number[]): number =>
  values.reduce((acc, v, i) => acc + v * (weights[i] ?? 0), 0);

export const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

export const pad = (n: number, size: number): string => String(n).padStart(size, '0');
