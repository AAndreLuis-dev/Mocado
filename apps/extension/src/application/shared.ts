import type { Perfil } from '@mocado/core';
import { newRecord, type PerfilTipo } from '../domain/profile';
import type { Settings } from '../domain/settings';
import type { Deps, PageContext, ScanResult } from './ports';

/** Current settings plus the slice of them the page needs. */
export async function loadPageContext(
  d: Pick<Deps, 'settings' | 'overrides'>,
): Promise<{ settings: Settings; ctx: PageContext }> {
  const [settings, overrides] = await Promise.all([d.settings.get(), d.overrides.get()]);
  const { masked, fillPasswords, observe } = settings;
  return { settings, ctx: { masked, fillPasswords, observe, overrides } };
}

/** Every successful fill lands in the history: a new record, or a new "use" of a reused one. */
export async function recordUse(
  d: Pick<Deps, 'history' | 'now'>,
  scan: ScanResult,
  tipo: PerfilTipo,
  perfil: Perfil,
  reusedId?: string,
): Promise<string> {
  const use = { domain: scan.hostname, url: scan.url, at: d.now() };
  const existing = reusedId ? await d.history.get(reusedId) : undefined;
  if (existing) {
    await d.history.update(existing.id, { uses: [...existing.uses, use] });
    return existing.id;
  }
  const rec = newRecord(tipo, perfil, use);
  await d.history.save(rec);
  return rec.id;
}
