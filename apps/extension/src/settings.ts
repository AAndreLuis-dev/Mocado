import type { CnpjTipo, UF } from '@mocado/core';

export interface Settings {
  /** Default mask when the field gives no hint (maxlength/pattern/placeholder). */
  masked: boolean;
  cnpjTipo: CnpjTipo;
  /** Preferred UF; '' = random. */
  uf: UF | '';
  idadeMin: number;
  idadeMax: number;
  /** Hostnames (suffix match) where Mocado never acts. */
  blockedDomains: string[];
  theme: 'system' | 'light' | 'dark';
  fillPasswords: boolean;
  /** Keep filling fields that appear after the first fill (SPAs, wizards, modals). */
  observe: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  masked: true,
  cnpjTipo: 'numerico',
  uf: '',
  idadeMin: 18,
  idadeMax: 60,
  blockedDomains: [],
  theme: 'system',
  fillPasswords: false,
  observe: true,
};

/** Stored settings merged over defaults (new keys added in updates get their default). */
export async function getSettings(): Promise<Settings> {
  const { settings } = await browser.storage.local.get('settings');
  return { ...DEFAULT_SETTINGS, ...(settings as Partial<Settings> | undefined) };
}

export const saveSettings = (settings: Settings) => browser.storage.local.set({ settings });

export const isBlocked = (hostname: string, blocked: readonly string[]) =>
  blocked.some((d) => {
    const domain = d.trim().toLowerCase().replace(/^\*\./, '');
    return domain !== '' && (hostname === domain || hostname.endsWith(`.${domain}`));
  });
