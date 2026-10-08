import { expect } from 'vitest';
import { mulberry32, type Generator, type GenOptions } from '../src';

export function roundTrip<O extends object>(
  gen: Generator<O>,
  opts: O = {} as O,
  n = 5000,
): string[] {
  const rng = mulberry32(42);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const masked = i % 2 === 0;
    const v = gen.generate({ ...opts, rng, masked } as O & GenOptions);
    if (!gen.validate(v, opts)) throw new Error(`invalid generated value: ${v}`);
    const other = gen.format(v, { ...opts, masked: !masked });
    if (!gen.validate(other, opts)) throw new Error(`invalid after format: ${other}`);
    expect(gen.format(other, { ...opts, masked })).toBe(v);
    out.push(v);
  }
  const a = gen.generate({ ...opts, rng: mulberry32(7) } as O & GenOptions);
  const b = gen.generate({ ...opts, rng: mulberry32(7) } as O & GenOptions);
  expect(a).toBe(b);
  return out;
}

export function mutateLastDigit(value: string): string {
  const i = value.search(/\d(?=\D*$)/);
  const d = Number(value[i]);
  return value.slice(0, i) + ((d + 1) % 10) + value.slice(i + 1);
}
