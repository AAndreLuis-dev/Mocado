import type { Perfil } from '@mocado/core';
import { generateFor } from '../domain/generate';
import type { PerfilTipo } from '../domain/profile';
import { isBlocked } from '../domain/settings';
import type { FillResult } from './fill-result';
import type { Deps, FillReport, ScanResult } from './ports';
import { loadPageContext, recordUse } from './shared';

export type FillOutcome = FillResult & {
  scan?: ScanResult;
  report?: FillReport;
  tipo?: PerfilTipo;
  perfil?: Perfil;
  recordId?: string;
};

export const makeFillForm =
  (d: Deps) =>
  async (tabId: number, reuseId?: string): Promise<FillOutcome> => {
    try {
      const { settings, ctx } = await loadPageContext(d);
      const scan = await d.page.scan(tabId, ctx);
      if (isBlocked(scan.hostname, settings.blockedDomains))
        return { ok: false, error: 'blocked', scan };
      const pinned = reuseId ? undefined : await d.pin.get();
      const storedId = reuseId ?? pinned;
      const stored = storedId ? await d.history.get(storedId) : undefined;
      const { tipo, perfil } = stored
        ? { tipo: stored.tipo, perfil: stored.values }
        : generateFor(scan.types, settings);
      const report = await d.page.fill(tabId, perfil, ctx);
      if (report.filled === 0) return { ok: true, filled: 0, scan, report, tipo, perfil };
      if (pinned) await d.pin.set(undefined);
      const recordId = await recordUse(d, scan, tipo, perfil, stored?.id);
      return { ok: true, filled: report.filled, scan, report, tipo, perfil, recordId };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  };
