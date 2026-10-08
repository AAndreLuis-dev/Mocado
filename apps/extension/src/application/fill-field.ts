import type { FieldType, Perfil } from '@mocado/core';
import { generateValue } from '../domain/generate';
import { withOverride } from '../domain/overrides';
import { isBlocked } from '../domain/settings';
import type { FillOutcome } from './fill-form';
import type { Deps, ScanResult } from './ports';
import { loadPageContext, recordUse } from './shared';

export function makeFillField(d: Deps) {
  async function fillSingle(
    tabId: number,
    pickType: (scan: ScanResult) => FieldType | null,
  ): Promise<FillOutcome> {
    try {
      const { settings, ctx } = await loadPageContext(d);
      const scan = await d.page.scan(tabId, ctx);
      if (isBlocked(scan.hostname, settings.blockedDomains))
        return { ok: false, error: 'blocked', scan };
      const type = pickType(scan);
      if (!type) return { ok: false, error: 'no-field', scan };
      const value = generateValue(type, settings);
      const report = await d.page.fillFocused(tabId, value, type, ctx);
      const perfil: Perfil = { [type]: value };
      const recordId = report.filled ? await recordUse(d, scan, 'avulso', perfil) : undefined;
      return { ok: true, filled: report.filled, scan, report, tipo: 'avulso', perfil, recordId };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }

  return {
    focused: (tabId: number) => fillSingle(tabId, (scan) => scan.focused),
    ofType: (tabId: number, type: FieldType) => fillSingle(tabId, () => type),
    async markAs(tabId: number, type: FieldType): Promise<FillOutcome> {
      const target = await d.page.focusedSelector(tabId);
      if (!target) return { ok: false, error: 'no-field' };
      await d.overrides.set(
        withOverride(await d.overrides.get(), target.hostname, target.selector, type),
      );
      return fillSingle(tabId, () => type);
    },
  };
}

export type FillField = ReturnType<typeof makeFillField>;
