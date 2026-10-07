import type { Rng } from './rng';

export interface GenOptions {
  rng?: Rng;
  /** With punctuation (e.g. 123.456.789-09) or digits only. Default: true. */
  masked?: boolean;
}

/** Common contract for every type whose value has verifiable structure. */
export interface Generator<O extends object = object> {
  generate(opts?: O & GenOptions): string;
  validate(value: string, opts?: Partial<O>): boolean;
  format(value: string, opts: { masked: boolean } & Partial<O>): string;
}
