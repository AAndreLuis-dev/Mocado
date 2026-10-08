import type { FieldType, Profile } from '@mocado/core';
import { generateValue } from '../domain/generate';
import { withOverride } from '../domain/overrides';
import { isBlocked } from '../domain/settings';
import type { FillOutcome } from './fill-form';
import type { Deps, ScanResult } from './ports';
import { loadPageContext, recordUse } from './shared';

export function makeFillField(deps: Deps) {
  async function fillSingle(
    tabId: number,
    pickType: (scan: ScanResult) => FieldType | null,
  ): Promise<FillOutcome> {
    try {
      const { settings, ctx } = await loadPageContext(deps);
      const scan = await deps.page.scan(tabId, ctx);
      if (isBlocked(scan.hostname, settings.blockedDomains))
        return { ok: false, error: 'blocked', scan };
      const type = pickType(scan);
      if (!type) return { ok: false, error: 'no-field', scan };
      const value = generateValue(type, settings);
      const report = await deps.page.fillFocused(tabId, value, type, ctx);
      const profile: Profile = { [type]: value };
      const recordId = report.filled ? await recordUse(deps, scan, 'avulso', profile) : undefined;
      return { ok: true, filled: report.filled, scan, report, kind: 'avulso', profile, recordId };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }

  return {
    focused: (tabId: number) => fillSingle(tabId, (scan) => scan.focused),
    ofType: (tabId: number, type: FieldType) => fillSingle(tabId, () => type),
    async markAs(tabId: number, type: FieldType): Promise<FillOutcome> {
      const target = await deps.page.focusedSelector(tabId);
      if (!target) return { ok: false, error: 'no-field' };
      await deps.overrides.set(
        withOverride(await deps.overrides.get(), target.hostname, target.selector, type),
      );
      return fillSingle(tabId, () => type);
    },
  };
}

export type FillField = ReturnType<typeof makeFillField>;
