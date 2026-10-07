import { type Generator } from './types';
import { defaultRng, digits, int, letters, pick, type Rng } from './rng';
import VEICULOS from './data/veiculos.json';

export type PlacaTipo = 'antiga' | 'mercosul' | 'aleatorio';

export interface PlacaOptions {
  tipo?: PlacaTipo;
}

const ANTIGA = /^[A-Z]{3}-?\d{4}$/;
const MERCOSUL = /^[A-Z]{3}\d[A-Z]\d{2}$/;

const format = (value: string, { masked }: { masked: boolean }) => {
  const v = value.toUpperCase().replace(/[^0-9A-Z]/g, '');
  return masked && /^[A-Z]{3}\d{4}$/.test(v) ? `${v.slice(0, 3)}-${v.slice(3)}` : v;
};

/** Old (AAA-9999) or Mercosul (AAA9A99) plate. Mercosul plates have no hyphen. */
export const placa: Generator<PlacaOptions> = {
  generate({ tipo = 'mercosul', rng = defaultRng, masked = true } = {}) {
    const t = tipo === 'aleatorio' ? pick(rng, ['antiga', 'mercosul'] as const) : tipo;
    const v =
      t === 'antiga'
        ? letters(rng, 3) + digits(rng, 4)
        : letters(rng, 3) + digits(rng, 1) + letters(rng, 1) + digits(rng, 2);
    return format(v, { masked });
  },
  validate(value, { tipo } = {}) {
    const v = value.toUpperCase().trim();
    const antiga = ANTIGA.test(v);
    const mercosul = MERCOSUL.test(v);
    if (tipo === 'antiga') return antiga;
    if (tipo === 'mercosul') return mercosul;
    return antiga || mercosul;
  },
  format,
};

export interface Veiculo {
  marca: string;
  modelo: string;
  ano: string;
}

export function veiculo({
  rng = defaultRng,
  now = new Date(),
}: { rng?: Rng; now?: Date } = {}): Veiculo {
  const marca = pick(rng, Object.keys(VEICULOS)) as keyof typeof VEICULOS;
  const ano = int(rng, now.getFullYear() - 15, now.getFullYear());
  return { marca, modelo: pick(rng, VEICULOS[marca]), ano: String(ano) };
}
