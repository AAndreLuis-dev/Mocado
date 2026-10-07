import { FIELD_TYPES, type FieldType, type Perfil } from '@massa/core';

export type PerfilTipo = 'pessoa' | 'empresa' | 'avulso';

export interface Use {
  domain: string;
  url: string;
  at: number;
}

export interface HistoryRecord {
  id: string;
  /** Editable, e.g. "admin teste", "cliente PJ". */
  label: string;
  tipo: PerfilTipo;
  favorite: boolean;
  createdAt: number;
  /** Every generated value (not only the ones the form had fields for). */
  values: Perfil;
  /** Where it was filled: first entry = creation, then each reuse. */
  uses: Use[];
}

export interface HistoryFilter {
  /** Any value, label or domain; masks are ignored ("12345678909" finds "123.456.789-09"). */
  query?: string;
  domain?: string;
  favoritesOnly?: boolean;
}

export interface HistoryExport {
  app: 'massa';
  version: 1;
  exportedAt: string;
  records: HistoryRecord[];
}

/**
 * Persistence boundary for the history: the UI and background only talk to this interface, so the
 * browser.storage.local implementation can be swapped (IndexedDB, cloud sync) without touching them.
 */
export interface StorageAdapter {
  list(filter?: HistoryFilter): Promise<HistoryRecord[]>;
  get(id: string): Promise<HistoryRecord | undefined>;
  put(record: HistoryRecord): Promise<void>;
  update(id: string, patch: Partial<Omit<HistoryRecord, 'id'>>): Promise<void>;
  remove(id: string): Promise<void>;
  exportAll(): Promise<HistoryExport>;
  /** Returns how many records were imported; invalid entries are skipped. */
  importAll(data: unknown, mode?: 'merge' | 'replace'): Promise<number>;
}

const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const alnum = (s: string) => plain(s).replace(/[^0-9a-z]/g, '');

export const lastUse = (r: HistoryRecord) => r.uses.at(-1)?.at ?? r.createdAt;
export const domains = (records: HistoryRecord[]) =>
  [...new Set(records.flatMap((r) => r.uses.map((u) => u.domain)))].sort();

export function matches(r: HistoryRecord, f: HistoryFilter): boolean {
  if (f.favoritesOnly && !r.favorite) return false;
  if (f.domain && !r.uses.some((u) => u.domain === f.domain)) return false;
  const q = f.query?.trim();
  if (!q) return true;
  const haystack = [r.label, ...Object.values(r.values), ...r.uses.map((u) => u.domain)].filter(
    Boolean,
  ) as string[];
  const qa = alnum(q);
  const qp = plain(q);
  return haystack.some((h) => plain(h).includes(qp) || (qa.length >= 3 && alnum(h).includes(qa)));
}

const FIELDS = new Set<string>(FIELD_TYPES);

/** Shape check for imported data (never trust a file). */
export function sanitize(x: unknown): HistoryRecord | null {
  if (!x || typeof x !== 'object') return null;
  const r = x as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id || typeof r.createdAt !== 'number') return null;
  if (!['pessoa', 'empresa', 'avulso'].includes(r.tipo as string)) return null;
  if (!r.values || typeof r.values !== 'object' || !Array.isArray(r.uses)) return null;
  const values: Perfil = {};
  for (const [k, v] of Object.entries(r.values as object))
    if (FIELDS.has(k) && typeof v === 'string') values[k as FieldType] = v;
  const uses = (r.uses as unknown[])
    .filter(
      (u): u is Use =>
        !!u &&
        typeof u === 'object' &&
        typeof (u as Use).domain === 'string' &&
        typeof (u as Use).url === 'string' &&
        typeof (u as Use).at === 'number',
    )
    .map(({ domain, url, at }) => ({ domain, url, at }));
  return {
    id: r.id,
    label: typeof r.label === 'string' ? r.label : '',
    tipo: r.tipo as PerfilTipo,
    favorite: r.favorite === true,
    createdAt: r.createdAt,
    values,
    uses,
  };
}

const KEY = 'history';

// ponytail: whole history in one storage.local key (10 MB quota ≈ 10k records); read-modify-write
// is not atomic across contexts. Move to IndexedDB behind this same interface if volume demands it.
export class LocalStorageAdapter implements StorageAdapter {
  private async all(): Promise<HistoryRecord[]> {
    const { [KEY]: list } = await browser.storage.local.get(KEY);
    return Array.isArray(list) ? (list as HistoryRecord[]) : [];
  }

  private save(list: HistoryRecord[]) {
    return browser.storage.local.set({ [KEY]: list });
  }

  async list(filter: HistoryFilter = {}) {
    return (await this.all())
      .filter((r) => matches(r, filter))
      .sort((a, b) => lastUse(b) - lastUse(a));
  }

  async get(id: string) {
    return (await this.all()).find((r) => r.id === id);
  }

  async put(record: HistoryRecord) {
    const list = (await this.all()).filter((r) => r.id !== record.id);
    await this.save([record, ...list]);
  }

  async update(id: string, patch: Partial<Omit<HistoryRecord, 'id'>>) {
    await this.save((await this.all()).map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async remove(id: string) {
    await this.save((await this.all()).filter((r) => r.id !== id));
  }

  async exportAll(): Promise<HistoryExport> {
    return {
      app: 'massa',
      version: 1,
      exportedAt: new Date().toISOString(),
      records: await this.all(),
    };
  }

  async importAll(data: unknown, mode: 'merge' | 'replace' = 'merge') {
    const raw = Array.isArray(data) ? data : (data as Partial<HistoryExport> | null)?.records;
    if (!Array.isArray(raw)) throw new Error('invalid-file');
    const incoming = raw.map(sanitize).filter((r): r is HistoryRecord => r !== null);
    const byId = new Map((mode === 'replace' ? [] : await this.all()).map((r) => [r.id, r]));
    for (const r of incoming) byId.set(r.id, r);
    await this.save([...byId.values()]);
    return incoming.length;
  }
}

export const history: StorageAdapter = new LocalStorageAdapter();

// ---------- "Reusar este perfil" from the history page: pin it for the next fill ----------

export async function getPinned(): Promise<string | undefined> {
  const { pinned } = await browser.storage.local.get('pinned');
  return typeof pinned === 'string' ? pinned : undefined;
}

export const setPinned = (id: string | undefined) =>
  id ? browser.storage.local.set({ pinned: id }) : browser.storage.local.remove('pinned');

export function displayName(r: HistoryRecord): string {
  return r.label || r.values.razaoSocial || r.values.nome || Object.values(r.values)[0] || r.id;
}

export function newRecord(tipo: PerfilTipo, values: Perfil, use: Use): HistoryRecord {
  return {
    id: crypto.randomUUID(),
    label: '',
    tipo,
    favorite: false,
    createdAt: use.at,
    values,
    uses: [use],
  };
}
