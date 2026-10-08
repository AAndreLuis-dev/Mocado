import type { FieldType } from '@mocado/core';

export type Overrides = Record<string, Record<string, FieldType>>;

export const withOverride = (
  all: Overrides,
  hostname: string,
  selector: string,
  type: FieldType,
): Overrides => ({ ...all, [hostname]: { ...all[hostname], [selector]: type } });

export function withoutOverride(all: Overrides, hostname: string, selector?: string): Overrides {
  const next = { ...all };
  if (selector === undefined) delete next[hostname];
  else {
    const { [selector]: _, ...rest } = next[hostname] ?? {};
    if (Object.keys(rest).length) next[hostname] = rest;
    else delete next[hostname];
  }
  return next;
}
