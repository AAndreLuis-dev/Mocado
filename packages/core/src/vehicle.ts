import { type Generator } from './types';
import { defaultRng, digits, int, letters, pick, type Rng } from './rng';
import VEHICLES from './data/veiculos.json' with { type: 'json' };

export type PlateKind = 'antiga' | 'mercosul' | 'aleatorio';

export interface PlateOptions {
  kind?: PlateKind;
}

const OLD_PLATE = /^[A-Z]{3}-?\d{4}$/;
const MERCOSUL_PLATE = /^[A-Z]{3}\d[A-Z]\d{2}$/;

const format = (value: string, { masked }: { masked: boolean }) => {
  const v = value.toUpperCase().replace(/[^0-9A-Z]/g, '');
  return masked && /^[A-Z]{3}\d{4}$/.test(v) ? `${v.slice(0, 3)}-${v.slice(3)}` : v;
};

export const licensePlate: Generator<PlateOptions> = {
  generate({ kind = 'mercosul', rng = defaultRng, masked = true } = {}) {
    const plateKind = kind === 'aleatorio' ? pick(rng, ['antiga', 'mercosul'] as const) : kind;
    const v =
      plateKind === 'antiga'
        ? letters(rng, 3) + digits(rng, 4)
        : letters(rng, 3) + digits(rng, 1) + letters(rng, 1) + digits(rng, 2);
    return format(v, { masked });
  },
  validate(value, { kind } = {}) {
    const v = value.toUpperCase().trim();
    const antiga = OLD_PLATE.test(v);
    const mercosul = MERCOSUL_PLATE.test(v);
    if (kind === 'antiga') return antiga;
    if (kind === 'mercosul') return mercosul;
    return antiga || mercosul;
  },
  format,
};

export interface Vehicle {
  make: string;
  model: string;
  year: string;
}

export function vehicle({
  rng = defaultRng,
  now = new Date(),
}: { rng?: Rng; now?: Date } = {}): Vehicle {
  const make = pick(rng, Object.keys(VEHICLES)) as keyof typeof VEHICLES;
  const year = int(rng, now.getFullYear() - 15, now.getFullYear());
  return { make, model: pick(rng, VEHICLES[make]), year: String(year) };
}
