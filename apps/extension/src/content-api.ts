import type { FieldType, Perfil } from '@mocado/core';

export interface ScanResult {
  url: string;
  hostname: string;
  title: string;
  blocked: boolean;
  types: FieldType[];
  /** Type of the focused field (or the one right-clicked), if any. */
  focused: FieldType | null;
}

export interface FillReport {
  filled: number;
  fields: { type: FieldType; value: string }[];
}

/** What the content script exposes on `globalThis.__mocado` (called via scripting.executeScript). */
export interface MocadoApi {
  scan(): Promise<ScanResult>;
  fill(perfil: Perfil, opts?: { focusedOnly?: boolean }): Promise<FillReport>;
  /** Writes a raw value into the focused field ("Gerar CPF aqui"). */
  fillFocused(value: string, type: FieldType): Promise<FillReport>;
  /** Saves a per-domain override for the focused field. */
  markFocused(type: FieldType): Promise<boolean>;
}

export type MocadoMethod = keyof MocadoApi;
