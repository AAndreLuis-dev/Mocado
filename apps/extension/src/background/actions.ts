import {
  empresa,
  EMPRESA_FIELDS,
  pessoa,
  valorAvulso,
  type FieldType,
  type Perfil,
  type PerfilOptions,
} from '@massa/core';
import type { FillReport, MassaApi, MassaMethod, ScanResult } from '../content-api';
import { getPinned, history, newRecord, setPinned, type PerfilTipo } from '../history';
import type { FillResult } from '../messages';
import { getSettings, type Settings } from '../settings';

type Args<M extends MassaMethod> = Parameters<MassaApi[M]>;
type Ret<M extends MassaMethod> = Awaited<ReturnType<MassaApi[M]>>;

/** Injects the content script (idempotent) and calls one of its methods in the tab's main frame. */
export async function callContent<M extends MassaMethod>(
  tabId: number,
  method: M,
  ...args: Args<M>
): Promise<Ret<M>> {
  await browser.scripting.executeScript({ target: { tabId }, files: ['/injected.js'] });
  const [res] = await browser.scripting.executeScript({
    target: { tabId },
    func: (m: string, a: unknown[]) =>
      (globalThis as unknown as { __massa: Record<string, (...x: unknown[]) => unknown> }).__massa[
        m
      ]!(...a),
    args: [method, args],
  });
  return res?.result as Ret<M>;
}

export const perfilOptions = (s: Settings): PerfilOptions => ({
  uf: s.uf || undefined,
  idadeMin: s.idadeMin,
  idadeMax: s.idadeMax,
  cnpjTipo: s.cnpjTipo,
  masked: true, // the content script strips masks per field
});

/** Company fields on the page → empresa (it includes the legal representative); else pessoa. */
export function generateFor(
  types: FieldType[],
  settings: Settings,
): { tipo: PerfilTipo; perfil: Perfil } {
  const isEmpresa = types.some((t) => EMPRESA_FIELDS.includes(t));
  const opts = perfilOptions(settings);
  return isEmpresa
    ? { tipo: 'empresa', perfil: empresa(opts) }
    : { tipo: 'pessoa', perfil: pessoa(opts) };
}

export type FillOutcome = FillResult & {
  scan?: ScanResult;
  report?: FillReport;
  tipo?: PerfilTipo;
  perfil?: Perfil;
  /** History record created (or reused) by this fill. */
  recordId?: string;
};

/** Every successful fill lands in the history: a new record, or a new "use" of a reused one. */
async function record(
  scan: ScanResult,
  tipo: PerfilTipo,
  perfil: Perfil,
  reusedId?: string,
): Promise<string> {
  const use = { domain: scan.hostname, url: scan.url, at: Date.now() };
  const existing = reusedId ? await history.get(reusedId) : undefined;
  if (existing) {
    await history.update(existing.id, { uses: [...existing.uses, use] });
    return existing.id;
  }
  const rec = newRecord(tipo, perfil, use);
  await history.put(rec);
  return rec.id;
}

/**
 * Whole-form fill. `reuseId` fills with a stored profile; otherwise a pinned profile (one-shot,
 * set from the history page) is used, else a new one is generated for the fields on the page.
 */
export async function fillTab(tabId: number, reuseId?: string): Promise<FillOutcome> {
  try {
    const scan = await callContent(tabId, 'scan');
    if (scan.blocked) return { ok: false, error: 'blocked', scan };
    const pinned = reuseId ? undefined : await getPinned();
    const storedId = reuseId ?? pinned;
    const stored = storedId ? await history.get(storedId) : undefined;
    const { tipo, perfil } = stored
      ? { tipo: stored.tipo, perfil: stored.values }
      : generateFor(scan.types, await getSettings());
    const report = await callContent(tabId, 'fill', perfil);
    if (report.filled === 0) return { ok: true, filled: 0, scan, report, tipo, perfil };
    if (pinned) await setPinned(undefined);
    const recordId = await record(scan, tipo, perfil, stored?.id);
    return { ok: true, filled: report.filled, scan, report, tipo, perfil, recordId };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** Fills only the focused field and records it as an "avulso" history entry. */
async function fillSingle(
  tabId: number,
  pickType: (scan: ScanResult) => FieldType | null,
): Promise<FillOutcome> {
  try {
    const scan = await callContent(tabId, 'scan');
    const type = scan.blocked ? null : pickType(scan);
    if (!type) return { ok: false, error: scan.blocked ? 'blocked' : 'no-field', scan };
    const value = valorAvulso(type, perfilOptions(await getSettings()));
    const report = await callContent(tabId, 'fillFocused', value, type);
    const perfil: Perfil = { [type]: value };
    const recordId = report.filled ? await record(scan, 'avulso', perfil) : undefined;
    return { ok: true, filled: report.filled, scan, report, tipo: 'avulso', perfil, recordId };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** Only the focused field, with a value of its detected type. */
export const fillFocusedTab = (tabId: number) => fillSingle(tabId, (scan) => scan.focused);

/** "Gerar <tipo> aqui": a value of a chosen type into the focused/right-clicked field. */
export const fillTypeHere = (tabId: number, type: FieldType) => fillSingle(tabId, () => type);
