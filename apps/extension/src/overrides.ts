import type { FieldType } from '@massa/core';

/** hostname → (stable selector → field type), set by the user via the context menu. */
export type Overrides = Record<string, Record<string, FieldType>>;

export async function getOverrides(): Promise<Overrides> {
  const { overrides } = await browser.storage.local.get('overrides');
  return (overrides as Overrides | undefined) ?? {};
}

const saveOverrides = (overrides: Overrides) => browser.storage.local.set({ overrides });

export async function setOverride(hostname: string, selector: string, type: FieldType) {
  const all = await getOverrides();
  await saveOverrides({ ...all, [hostname]: { ...all[hostname], [selector]: type } });
}

export async function removeOverride(hostname: string, selector?: string) {
  const all = { ...(await getOverrides()) };
  if (selector === undefined) delete all[hostname];
  else {
    const { [selector]: _, ...rest } = all[hostname] ?? {};
    if (Object.keys(rest).length) all[hostname] = rest;
    else delete all[hostname];
  }
  await saveOverrides(all);
}
