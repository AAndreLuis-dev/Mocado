import type { FieldType, Profile } from '@mocado/core';
import type { Overrides } from '../domain/overrides';
import type { HistoryRecord } from '../domain/profile';
import type { Settings } from '../domain/settings';

export interface HistoryRepository {
  all(): Promise<HistoryRecord[]>;
  get(id: string): Promise<HistoryRecord | undefined>;
  save(record: HistoryRecord): Promise<void>;
  update(id: string, patch: Partial<Omit<HistoryRecord, 'id'>>): Promise<void>;
  remove(id: string): Promise<void>;
  replaceAll(records: HistoryRecord[]): Promise<void>;
}

export interface Store<T> {
  get(): Promise<T>;
  set(value: T): Promise<void>;
}

export interface PageContext {
  masked: boolean;
  fillPasswords: boolean;
  observe: boolean;
  overrides: Overrides;
}

export interface ScanResult {
  url: string;
  hostname: string;
  title: string;
  types: FieldType[];
  focused: FieldType | null;
}

export interface FillReport {
  filled: number;
  fields: { type: FieldType; value: string }[];
}

export interface PageGateway {
  scan(tabId: number, ctx: PageContext): Promise<ScanResult>;
  fill(tabId: number, profile: Profile, ctx: PageContext): Promise<FillReport>;
  fillFocused(tabId: number, value: string, type: FieldType, ctx: PageContext): Promise<FillReport>;
  focusedSelector(tabId: number): Promise<{ hostname: string; selector: string } | null>;
}

export interface Deps {
  page: PageGateway;
  history: HistoryRepository;
  settings: Store<Settings>;
  overrides: Store<Overrides>;
  pin: Store<string | undefined>;
  now: () => number;
}
