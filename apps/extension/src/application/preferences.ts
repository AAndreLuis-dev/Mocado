import type { FieldType } from '@mocado/core';
import { withOverride, withoutOverride } from '../domain/overrides';
import { withSetting, type Settings } from '../domain/settings';
import type { Deps } from './ports';

/** Options page: settings (auto-saved) and per-domain field corrections. */
export function makePreferences(d: Pick<Deps, 'settings' | 'overrides'>) {
  return {
    settings: () => d.settings.get(),
    /** Saves one setting on top of what is stored now (never a stale copy) and returns the result. */
    async setSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<Settings> {
      const next = withSetting(await d.settings.get(), key, value);
      await d.settings.set(next);
      return next;
    },

    overrides: () => d.overrides.get(),
    async setOverride(hostname: string, selector: string, type: FieldType) {
      await d.overrides.set(withOverride(await d.overrides.get(), hostname, selector, type));
    },
    /** One selector, or the whole domain when `selector` is omitted. */
    async removeOverride(hostname: string, selector?: string) {
      await d.overrides.set(withoutOverride(await d.overrides.get(), hostname, selector));
    },
  };
}

export type Preferences = ReturnType<typeof makePreferences>;
