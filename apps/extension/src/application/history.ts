import {
  mergeRecords,
  parseImport,
  toExport,
  type HistoryExport,
  type ImportMode,
} from '../domain/history-import';
import { byLastUse, search, type HistoryFilter } from '../domain/history-query';
import type { HistoryRecord } from '../domain/profile';
import type { Deps } from './ports';

/** Everything the history page and the popup do with stored profiles. */
export function makeHistoryService(d: Pick<Deps, 'history' | 'pin' | 'now'>) {
  return {
    /** Matching records (most recent first) and the whole history (for the domain filter). */
    async search(filter: HistoryFilter = {}) {
      const all = await d.history.all();
      return { records: search(all, filter), all };
    },

    recent: async (n: number) => byLastUse(await d.history.all()).slice(0, n),

    async pinned(): Promise<HistoryRecord | undefined> {
      const id = await d.pin.get();
      return id ? d.history.get(id) : undefined;
    },
    pinnedId: () => d.pin.get(),
    /** Uses this profile on the next fill (shortcut, popup or menu); `undefined` unpins. */
    pin: (id: string | undefined) => d.pin.set(id),

    setFavorite: (id: string, favorite: boolean) => d.history.update(id, { favorite }),
    rename: (id: string, label: string) => d.history.update(id, { label: label.trim() }),
    async remove(id: string) {
      if ((await d.pin.get()) === id) await d.pin.set(undefined);
      await d.history.remove(id);
    },

    exportFile: async (): Promise<HistoryExport> => toExport(await d.history.all(), d.now()),
    /** Returns how many valid records were imported; throws `invalid-file` for anything else. */
    async importFile(data: unknown, mode: ImportMode = 'merge'): Promise<number> {
      const incoming = parseImport(data);
      await d.history.replaceAll(mergeRecords(await d.history.all(), incoming, mode));
      return incoming.length;
    },
  };
}

export type HistoryService = ReturnType<typeof makeHistoryService>;
