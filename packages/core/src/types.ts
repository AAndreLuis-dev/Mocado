import type { Rng } from './rng';

export interface GenOptions {
  rng?: Rng;
  masked?: boolean;
}

export interface Generator<O extends object = object> {
  generate(opts?: O & GenOptions): string;
  validate(value: string, opts?: Partial<O>): boolean;
  format(value: string, opts: { masked: boolean } & Partial<O>): string;
}
