import { type Generator } from '../types';
import { defaultRng, digits, pick } from '../rng';
import { maskIf, onlyDigits, pad, toNums, weighted } from '../mask';
import { TITULO_UF, UFS, type UF } from '../uf';

function withDv(seq8: string, ufCode: string): string {
  const special = ufCode === '01' || ufCode === '02';
  const fix = (r: number) => (r === 10 ? 0 : r === 0 && special ? 1 : r);
  const d1 = fix(weighted(toNums(seq8), [2, 3, 4, 5, 6, 7, 8, 9]) % 11);
  const [u1 = 0, u2 = 0] = toNums(ufCode);
  const d2 = fix((u1 * 7 + u2 * 8 + d1 * 9) % 11);
  return `${seq8}${ufCode}${d1}${d2}`;
}

const format = (value: string, { masked }: { masked: boolean }) =>
  maskIf(onlyDigits(value), '#### #### ####', masked);

export interface TituloOptions {
  uf?: UF;
}

export const titulo: Generator<TituloOptions> = {
  generate({ uf, rng = defaultRng, masked = true } = {}) {
    const code = pad(TITULO_UF[uf ?? pick(rng, UFS)], 2);
    let seq: string;
    do seq = digits(rng, 8);
    while (seq === '00000000');
    return format(withDv(seq, code), { masked });
  },
  validate(value, { uf } = {}) {
    const v = onlyDigits(value);
    if (v.length !== 12 || /[^\d\s.-]/.test(value)) return false;
    const code = Number(v.slice(8, 10));
    if (code < 1 || code > 28 || (uf && TITULO_UF[uf] !== code)) return false;
    return withDv(v.slice(0, 8), v.slice(8, 10)) === v;
  },
  format,
};

export function tituloUF(value: string): UF | undefined {
  const code = Number(onlyDigits(value).slice(8, 10));
  return UFS.find((uf) => TITULO_UF[uf] === code);
}
