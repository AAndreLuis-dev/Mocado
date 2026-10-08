import type { FieldType } from '@mocado/core';
import { withOverride, withoutOverride } from '../domain/overrides';
import { withSetting, type Settings } from '../domain/settings';
import type { Deps } from './ports';

export function makePreferences(deps: Pick<Deps, 'settings' | 'overrides'>) {
  return {
    settings: () => deps.settings.get(),
    async setSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<Settings> {
      const next = withSetting(await deps.settings.get(), key, value);
      await deps.settings.set(next);
      return next;
    },

    overrides: () => deps.overrides.get(),
    async setOverride(hostname: string, selector: string, type: FieldType) {
      await deps.overrides.set(withOverride(await deps.overrides.get(), hostname, selector, type));
    },
    async removeOverride(hostname: string, selector?: string) {
      await deps.overrides.set(withoutOverride(await deps.overrides.get(), hostname, selector));
    },
  };
}

export type Preferences = ReturnType<typeof makePreferences>;
