// prettier-ignore
export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

export type UF = (typeof UFS)[number];

export const isUF = (v: string): v is UF => (UFS as readonly string[]).includes(v);

/** CPF 9th digit = fiscal region of issue (Receita Federal). */
// prettier-ignore
export const CPF_REGION: Record<UF, number> = {
  RS: 0,
  DF: 1, GO: 1, MS: 1, MT: 1, TO: 1,
  AC: 2, AM: 2, AP: 2, PA: 2, RO: 2, RR: 2,
  CE: 3, MA: 3, PI: 3,
  AL: 4, PB: 4, PE: 4, RN: 4,
  BA: 5, SE: 5,
  MG: 6,
  ES: 7, RJ: 7,
  SP: 8,
  PR: 9, SC: 9,
};

/** Título de eleitor: UF code in digits 9–10 (TSE). 28 = ZZ (exterior). */
// prettier-ignore
export const TITULO_UF: Record<UF, number> = {
  SP: 1, MG: 2, RJ: 3, RS: 4, BA: 5, PR: 6, CE: 7, PE: 8, SC: 9, GO: 10,
  MA: 11, PB: 12, PA: 13, ES: 14, PI: 15, RN: 16, AL: 17, MT: 18, MS: 19,
  DF: 20, SE: 21, AM: 22, RO: 23, AC: 24, AP: 25, RR: 26, TO: 27,
};

/** Anatel area codes per UF. */
// prettier-ignore
export const DDD: Record<UF, readonly number[]> = {
  AC: [68], AL: [82], AP: [96], AM: [92, 97], BA: [71, 73, 74, 75, 77], CE: [85, 88],
  DF: [61], ES: [27, 28], GO: [62, 64], MA: [98, 99], MT: [65, 66], MS: [67],
  MG: [31, 32, 33, 34, 35, 37, 38], PA: [91, 93, 94], PB: [83], PR: [41, 42, 43, 44, 45, 46],
  PE: [81, 87], PI: [86, 89], RJ: [21, 22, 24], RN: [84], RS: [51, 53, 54, 55], RO: [69],
  RR: [95], SC: [47, 48, 49], SP: [11, 12, 13, 14, 15, 16, 17, 18, 19], SE: [79], TO: [63],
};
