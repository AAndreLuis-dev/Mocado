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

export function makeHistoryService(d: Pick<Deps, 'history' | 'pin' | 'now'>) {
  return {
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
    pin: (id: string | undefined) => d.pin.set(id),

    setFavorite: (id: string, favorite: boolean) => d.history.update(id, { favorite }),
    rename: (id: string, label: string) => d.history.update(id, { label: label.trim() }),
    async remove(id: string) {
      if ((await d.pin.get()) === id) await d.pin.set(undefined);
      await d.history.remove(id);
    },

    exportFile: async (): Promise<HistoryExport> => toExport(await d.history.all(), d.now()),
    async importFile(data: unknown, mode: ImportMode = 'merge'): Promise<number> {
      const incoming = parseImport(data);
      await d.history.replaceAll(mergeRecords(await d.history.all(), incoming, mode));
      return incoming.length;
    },
  };
}

export type HistoryService = ReturnType<typeof makeHistoryService>;
