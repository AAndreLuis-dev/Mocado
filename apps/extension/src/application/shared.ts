import type { Profile } from '@mocado/core';
import { newRecord, type ProfileKind } from '../domain/profile';
import type { Settings } from '../domain/settings';
import type { Deps, PageContext, ScanResult } from './ports';

export async function loadPageContext(
  deps: Pick<Deps, 'settings' | 'overrides'>,
): Promise<{ settings: Settings; ctx: PageContext }> {
  const [settings, overrides] = await Promise.all([deps.settings.get(), deps.overrides.get()]);
  const { masked, fillPasswords, observe } = settings;
  return { settings, ctx: { masked, fillPasswords, observe, overrides } };
}

export async function recordUse(
  deps: Pick<Deps, 'history' | 'now'>,
  scan: ScanResult,
  kind: ProfileKind,
  profile: Profile,
  reusedId?: string,
): Promise<string> {
  const use = { domain: scan.hostname, url: scan.url, at: deps.now() };
  const existing = reusedId ? await deps.history.get(reusedId) : undefined;
  if (existing) {
    await deps.history.update(existing.id, { uses: [...existing.uses, use] });
    return existing.id;
  }
  const record = newRecord(kind, profile, use);
  await deps.history.save(record);
  return record.id;
}
