import type { FieldType, Perfil } from '@mocado/core';
import type { Overrides } from '../domain/overrides';
import type { HistoryRecord } from '../domain/profile';
import type { Settings } from '../domain/settings';

// ---------- Persistence ----------

export interface HistoryRepository {
  /** In storage order (newest created first). */
  all(): Promise<HistoryRecord[]>;
  get(id: string): Promise<HistoryRecord | undefined>;
  /** Insert or replace by id. */
  save(record: HistoryRecord): Promise<void>;
  update(id: string, patch: Partial<Omit<HistoryRecord, 'id'>>): Promise<void>;
  remove(id: string): Promise<void>;
  replaceAll(records: HistoryRecord[]): Promise<void>;
}

/** One stored value (settings, overrides, pinned profile). */
export interface Store<T> {
  get(): Promise<T>;
  set(value: T): Promise<void>;
}

// ---------- The page (content script in a tab) ----------

/** What the page needs to detect and fill fields: the user's choices, passed in on each call. */
export interface PageContext {
  masked: boolean;
  fillPasswords: boolean;
  observe: boolean;
  /** All domains; the page picks its own hostname. */
  overrides: Overrides;
}

export interface ScanResult {
  url: string;
  hostname: string;
  title: string;
  types: FieldType[];
  /** Type of the focused field (or the one right-clicked), if any. */
  focused: FieldType | null;
}

export interface FillReport {
  filled: number;
  fields: { type: FieldType; value: string }[];
}

export interface PageGateway {
  scan(tabId: number, ctx: PageContext): Promise<ScanResult>;
  fill(tabId: number, perfil: Perfil, ctx: PageContext): Promise<FillReport>;
  /** Writes a raw value into the focused field ("Gerar CPF aqui"). */
  fillFocused(tabId: number, value: string, type: FieldType, ctx: PageContext): Promise<FillReport>;
  /** Stable selector of the focused field, to remember a user correction. */
  focusedSelector(tabId: number): Promise<{ hostname: string; selector: string } | null>;
}

// ---------- Everything a use case may need ----------

export interface Deps {
  page: PageGateway;
  history: HistoryRepository;
  settings: Store<Settings>;
  overrides: Store<Overrides>;
  /** Profile chosen in the history page for the next fill. */
  pin: Store<string | undefined>;
  now: () => number;
}
