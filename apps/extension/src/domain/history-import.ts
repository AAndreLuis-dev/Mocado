import { FIELD_TYPES, type FieldType, type Perfil } from '@mocado/core';
import { PERFIL_TIPOS, type HistoryRecord, type PerfilTipo, type Use } from './profile';

export interface HistoryExport {
  app: 'mocado';
  version: 1;
  exportedAt: string;
  records: HistoryRecord[];
}

export type ImportMode = 'merge' | 'replace';

export const toExport = (records: HistoryRecord[], now: number): HistoryExport => ({
  app: 'mocado',
  version: 1,
  exportedAt: new Date(now).toISOString(),
  records,
});

const FIELDS = new Set<string>(FIELD_TYPES);

const isUse = (u: unknown): u is Use =>
  !!u &&
  typeof u === 'object' &&
  typeof (u as Use).domain === 'string' &&
  typeof (u as Use).url === 'string' &&
  typeof (u as Use).at === 'number';

export function sanitize(x: unknown): HistoryRecord | null {
  if (!x || typeof x !== 'object') return null;
  const r = x as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id || typeof r.createdAt !== 'number') return null;
  if (!PERFIL_TIPOS.includes(r.tipo as PerfilTipo)) return null;
  if (!r.values || typeof r.values !== 'object' || !Array.isArray(r.uses)) return null;
  const values: Perfil = {};
  for (const [k, v] of Object.entries(r.values as object))
    if (FIELDS.has(k) && typeof v === 'string') values[k as FieldType] = v;
  return {
    id: r.id,
    label: typeof r.label === 'string' ? r.label : '',
    tipo: r.tipo as PerfilTipo,
    favorite: r.favorite === true,
    createdAt: r.createdAt,
    values,
    uses: r.uses.filter(isUse).map(({ domain, url, at }) => ({ domain, url, at })),
  };
}

export function parseImport(data: unknown): HistoryRecord[] {
  const raw = Array.isArray(data) ? data : (data as Partial<HistoryExport> | null)?.records;
  if (!Array.isArray(raw)) throw new Error('invalid-file');
  return raw.map(sanitize).filter((r): r is HistoryRecord => r !== null);
}

export function mergeRecords(
  existing: readonly HistoryRecord[],
  incoming: readonly HistoryRecord[],
  mode: ImportMode,
): HistoryRecord[] {
  const byId = new Map((mode === 'replace' ? [] : existing).map((r) => [r.id, r]));
  for (const r of incoming) byId.set(r.id, r);
  return [...byId.values()];
}
