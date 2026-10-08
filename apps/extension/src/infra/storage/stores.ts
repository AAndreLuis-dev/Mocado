import type { Store } from '../../application/ports';
import type { Overrides } from '../../domain/overrides';
import { normalizeSettings, type Settings } from '../../domain/settings';

function storageValue<T>(key: string, parse: (raw: unknown) => T): Store<T> {
  return {
    async get() {
      const { [key]: raw } = await browser.storage.local.get(key);
      return parse(raw);
    },
    async set(value) {
      if (value === undefined) await browser.storage.local.remove(key);
      else await browser.storage.local.set({ [key]: value });
    },
  };
}

export const settingsStore: Store<Settings> = storageValue('settings', normalizeSettings);

export const overridesStore: Store<Overrides> = storageValue('overrides', (raw) =>
  raw && typeof raw === 'object' ? (raw as Overrides) : {},
);

export const pinStore: Store<string | undefined> = storageValue('pinned', (raw) =>
  typeof raw === 'string' ? raw : undefined,
);

export type StoredKey = 'history' | 'settings' | 'overrides' | 'pinned';

export function watchStorage(keys: readonly StoredKey[], onChange: () => void): () => void {
  const listener = (changes: Record<string, unknown>) => {
    if (keys.some((k) => k in changes)) onChange();
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}
