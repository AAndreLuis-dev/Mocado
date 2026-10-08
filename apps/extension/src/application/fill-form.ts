import type { Profile } from '@mocado/core';
import { generateFor } from '../domain/generate';
import type { ProfileKind } from '../domain/profile';
import { isBlocked } from '../domain/settings';
import type { FillResult } from './fill-result';
import type { Deps, FillReport, ScanResult } from './ports';
import { loadPageContext, recordUse } from './shared';

export type FillOutcome = FillResult & {
  scan?: ScanResult;
  report?: FillReport;
  kind?: ProfileKind;
  profile?: Profile;
  recordId?: string;
};

export const makeFillForm =
  (deps: Deps) =>
  async (tabId: number, reuseId?: string): Promise<FillOutcome> => {
    try {
      const { settings, ctx } = await loadPageContext(deps);
      const scan = await deps.page.scan(tabId, ctx);
      if (isBlocked(scan.hostname, settings.blockedDomains))
        return { ok: false, error: 'blocked', scan };
      const pinned = reuseId ? undefined : await deps.pin.get();
      const storedId = reuseId ?? pinned;
      const stored = storedId ? await deps.history.get(storedId) : undefined;
      const { kind, profile } = stored
        ? { kind: stored.tipo, profile: stored.values }
        : generateFor(scan.types, settings);
      const report = await deps.page.fill(tabId, profile, ctx);
      if (report.filled === 0) return { ok: true, filled: 0, scan, report, kind, profile };
      if (pinned) await deps.pin.set(undefined);
      const recordId = await recordUse(deps, scan, kind, profile, stored?.id);
      return { ok: true, filled: report.filled, scan, report, kind, profile, recordId };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  };
