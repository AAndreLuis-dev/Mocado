import { vi } from 'vitest';
import type { FieldType } from '@mocado/core';
import { DEFAULT_SETTINGS, type Settings } from '../src/domain/settings';
import type { HistoryRecord } from '../src/domain/profile';
import type {
  Deps,
  FillReport,
  HistoryRepository,
  PageGateway,
  ScanResult,
  Store,
} from '../src/application/ports';

export function memoryHistory(initial: HistoryRecord[] = []): HistoryRepository {
  let records = [...initial];
  return {
    all: async () => records,
    get: async (id) => records.find((record) => record.id === id),
    async save(record) {
      records = [record, ...records.filter((other) => other.id !== record.id)];
    },
    async update(id, patch) {
      records = records.map((record) => (record.id === id ? { ...record, ...patch } : record));
    },
    async remove(id) {
      records = records.filter((record) => record.id !== id);
    },
    async replaceAll(next) {
      records = next;
    },
  };
}

export function memoryStore<T>(value: T): Store<T> {
  return {
    get: async () => value,
    async set(next) {
      value = next;
    },
  };
}

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
    fill: vi.fn(async (_tab, profile): Promise<FillReport> => {
      const fields = types.flatMap((type) =>
        profile[type] ? [{ type, value: profile[type]! }] : [],
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

export function fakeDeps(custom: Partial<Deps> & { settings?: Store<Settings> } = {}): Deps {
  let clock = 1000;
  return {
    page: fakePage(['cpf', 'nome']),
    history: memoryHistory(),
    settings: memoryStore(DEFAULT_SETTINGS),
    overrides: memoryStore({}),
    pin: memoryStore<string | undefined>(undefined),
    now: () => clock++,
    ...custom,
  };
}
