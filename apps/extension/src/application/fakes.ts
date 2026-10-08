import { vi } from 'vitest';
import type { FieldType } from '@mocado/core';
import { DEFAULT_SETTINGS, type Settings } from '../domain/settings';
import type { HistoryRecord } from '../domain/profile';
import type { Deps, FillReport, HistoryRepository, PageGateway, ScanResult, Store } from './ports';

// In-memory adapters for use-case tests: same ports, no browser.

export function memoryHistory(initial: HistoryRecord[] = []): HistoryRepository {
  let list = [...initial];
  return {
    all: async () => list,
    get: async (id) => list.find((r) => r.id === id),
    save: async (r) => void (list = [r, ...list.filter((x) => x.id !== r.id)]),
    update: async (id, patch) =>
      void (list = list.map((r) => (r.id === id ? { ...r, ...patch } : r))),
    remove: async (id) => void (list = list.filter((r) => r.id !== id)),
    replaceAll: async (records) => void (list = records),
  };
}

export function memoryStore<T>(value: T): Store<T> {
  return { get: async () => value, set: async (v) => void (value = v) };
}

/** A page with the given field types; fills report one field per perfil key it has a type for. */
export function fakePage(
  types: FieldType[],
  { hostname = 'app.test', focused = null as FieldType | null, selector = '#campo' } = {},
) {
  const scan: ScanResult = {
    url: `https://${hostname}/form`,
    hostname,
    title: 'Form',
    types,
    focused,
  };
  const page = {
    scan: vi.fn(async () => scan),
    fill: vi.fn(async (_tab, perfil): Promise<FillReport> => {
      const fields = types.flatMap((type) =>
        perfil[type] ? [{ type, value: perfil[type]! }] : [],
      );
      return { filled: fields.length, fields };
    }),
    fillFocused: vi.fn(async (_tab, value, type): Promise<FillReport> =>
      focused || selector ? { filled: 1, fields: [{ type, value }] } : { filled: 0, fields: [] },
    ),
    focusedSelector: vi.fn(async () => (selector ? { hostname, selector } : null)),
  } satisfies PageGateway;
  return page;
}

export function fakeDeps(over: Partial<Deps> & { settings?: Store<Settings> } = {}): Deps {
  let t = 1000;
  return {
    page: fakePage(['cpf', 'nome']),
    history: memoryHistory(),
    settings: memoryStore(DEFAULT_SETTINGS),
    overrides: memoryStore({}),
    pin: memoryStore<string | undefined>(undefined),
    now: () => t++,
    ...over,
  };
}
