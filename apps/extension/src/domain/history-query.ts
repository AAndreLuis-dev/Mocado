import { lastUse, type HistoryRecord } from './profile';
import { alnum, plain } from './text';

export interface HistoryFilter {
  query?: string;
  domain?: string;
  favoritesOnly?: boolean;
}

export function matches(record: HistoryRecord, filter: HistoryFilter): boolean {
  if (filter.favoritesOnly && !record.favorite) return false;
  if (filter.domain && !record.uses.some((use) => use.domain === filter.domain)) return false;
  const query = filter.query?.trim();
  if (!query) return true;
  const haystack = [
    record.label,
    ...Object.values(record.values),
    ...record.uses.map((use) => use.domain),
  ].filter(Boolean) as string[];
  const queryText = plain(query);
  const queryChars = alnum(query);
  return haystack.some(
    (text) =>
      plain(text).includes(queryText) ||
      (queryChars.length >= 3 && alnum(text).includes(queryChars)),
  );
}

export const byLastUse = (records: readonly HistoryRecord[]) =>
  [...records].sort((a, b) => lastUse(b) - lastUse(a));

export const search = (records: readonly HistoryRecord[], filter: HistoryFilter = {}) =>
  byLastUse(records.filter((record) => matches(record, filter)));
