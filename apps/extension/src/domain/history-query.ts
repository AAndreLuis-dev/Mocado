import { lastUse, type HistoryRecord } from './profile';
import { alnum, plain } from './text';

export interface HistoryFilter {
  query?: string;
  domain?: string;
  favoritesOnly?: boolean;
}

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

export const byLastUse = (records: readonly HistoryRecord[]) =>
  [...records].sort((a, b) => lastUse(b) - lastUse(a));

export const search = (records: readonly HistoryRecord[], f: HistoryFilter = {}) =>
  byLastUse(records.filter((r) => matches(r, f)));
