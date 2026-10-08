import { FIELD_TYPES, type FieldType, type Profile } from '@mocado/core';
import { PROFILE_KINDS, type HistoryRecord, type ProfileKind, type Use } from './profile';

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

export function sanitize(input: unknown): HistoryRecord | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  if (typeof raw.id !== 'string' || !raw.id || typeof raw.createdAt !== 'number') return null;
  if (!PROFILE_KINDS.includes(raw.tipo as ProfileKind)) return null;
  if (!raw.values || typeof raw.values !== 'object' || !Array.isArray(raw.uses)) return null;
  const values: Profile = {};
  for (const [field, value] of Object.entries(raw.values as object))
    if (FIELDS.has(field) && typeof value === 'string') values[field as FieldType] = value;
  return {
    id: raw.id,
    label: typeof raw.label === 'string' ? raw.label : '',
    tipo: raw.tipo as ProfileKind,
    favorite: raw.favorite === true,
    createdAt: raw.createdAt,
    values,
    uses: raw.uses.filter(isUse).map(({ domain, url, at }) => ({ domain, url, at })),
  };
}

export function parseImport(data: unknown): HistoryRecord[] {
  const raw = Array.isArray(data) ? data : (data as Partial<HistoryExport> | null)?.records;
  if (!Array.isArray(raw)) throw new Error('invalid-file');
  return raw.map(sanitize).filter((record): record is HistoryRecord => record !== null);
}

export function mergeRecords(
  existing: readonly HistoryRecord[],
  incoming: readonly HistoryRecord[],
  mode: ImportMode,
): HistoryRecord[] {
  const byId = new Map((mode === 'replace' ? [] : existing).map((record) => [record.id, record]));
  for (const record of incoming) byId.set(record.id, record);
  return [...byId.values()];
}
