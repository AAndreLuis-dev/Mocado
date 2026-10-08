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

export function makeHistoryService(deps: Pick<Deps, 'history' | 'pin' | 'now'>) {
  return {
    async search(filter: HistoryFilter = {}) {
      const all = await deps.history.all();
      return { records: search(all, filter), all };
    },

    recent: async (n: number) => byLastUse(await deps.history.all()).slice(0, n),

    async pinned(): Promise<HistoryRecord | undefined> {
      const id = await deps.pin.get();
      return id ? deps.history.get(id) : undefined;
    },
    pinnedId: () => deps.pin.get(),
    pin: (id: string | undefined) => deps.pin.set(id),

    setFavorite: (id: string, favorite: boolean) => deps.history.update(id, { favorite }),
    rename: (id: string, label: string) => deps.history.update(id, { label: label.trim() }),
    async remove(id: string) {
      if ((await deps.pin.get()) === id) await deps.pin.set(undefined);
      await deps.history.remove(id);
    },

    exportFile: async (): Promise<HistoryExport> => toExport(await deps.history.all(), deps.now()),
    async importFile(data: unknown, mode: ImportMode = 'merge'): Promise<number> {
      const incoming = parseImport(data);
      await deps.history.replaceAll(mergeRecords(await deps.history.all(), incoming, mode));
      return incoming.length;
    },
  };
}

export type HistoryService = ReturnType<typeof makeHistoryService>;
