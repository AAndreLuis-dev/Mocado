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

export type PerfilTipo = 'pessoa' | 'empresa' | 'avulso';

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
};

/** Whole-form fill. `perfil` reuses a stored profile instead of generating a new one. */
export async function fillTab(
  tabId: number,
  reuse?: { tipo: PerfilTipo; perfil: Perfil },
): Promise<FillOutcome> {
  try {
    const scan = await callContent(tabId, 'scan');
    if (scan.blocked) return { ok: false, error: 'blocked', scan };
    const settings = await getSettings();
    const { tipo, perfil } = reuse ?? generateFor(scan.types, settings);
    const report = await callContent(tabId, 'fill', perfil);
    return { ok: true, filled: report.filled, scan, report, tipo, perfil };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** Only the focused field, with a value of its detected type. */
export async function fillFocusedTab(tabId: number): Promise<FillOutcome> {
  try {
    const scan = await callContent(tabId, 'scan');
    if (scan.blocked || !scan.focused)
      return { ok: false, error: scan.blocked ? 'blocked' : 'no-field', scan };
    const settings = await getSettings();
    const value = valorAvulso(scan.focused, perfilOptions(settings));
    const report = await callContent(tabId, 'fillFocused', value, scan.focused);
    return {
      ok: true,
      filled: report.filled,
      scan,
      report,
      tipo: 'avulso',
      perfil: { [scan.focused]: value },
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** "Gerar <tipo> aqui": a value of a chosen type into the focused/right-clicked field. */
export async function fillTypeHere(tabId: number, type: FieldType): Promise<FillOutcome> {
  try {
    const scan = await callContent(tabId, 'scan');
    if (scan.blocked) return { ok: false, error: 'blocked', scan };
    const value = valorAvulso(type, perfilOptions(await getSettings()));
    const report = await callContent(tabId, 'fillFocused', value, type);
    return {
      ok: true,
      filled: report.filled,
      scan,
      report,
      tipo: 'avulso',
      perfil: { [type]: value },
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
