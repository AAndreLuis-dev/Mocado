/** Uppercased alphanumerics only: "12.abc/0-1" → "12ABC01". */
export const strip = (value: string): string => value.toUpperCase().replace(/[^0-9A-Z]/g, '');

export const onlyDigits = (value: string): string => value.replace(/\D/g, '');

/** Applies a pattern where `#` is one character: mask('12345678909', '###.###.###-##'). */
export function mask(raw: string, pattern: string): string {
  let i = 0;
  let out = '';
  for (const ch of pattern) {
    if (i >= raw.length) break;
    out += ch === '#' ? raw[i++] : ch;
  }
  return out + raw.slice(i);
}

/** Format helper for generators: masked → pattern, unmasked → stripped. */
export const maskIf = (raw: string, pattern: string, masked: boolean): string =>
  masked ? mask(raw, pattern) : raw;

/** Mod-11 check digit with the common "remainder < 2 → 0" rule. */
export function mod11(values: readonly number[], weights: readonly number[]): number {
  const sum = values.reduce((acc, v, i) => acc + v * (weights[i] ?? 0), 0);
  const r = sum % 11;
  return r < 2 ? 0 : 11 - r;
}

export const toNums = (s: string): number[] => [...s].map((c) => c.charCodeAt(0) - 48);

export const allSame = (s: string): boolean => /^(.)\1*$/.test(s);
