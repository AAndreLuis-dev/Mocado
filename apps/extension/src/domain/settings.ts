import { UFS, type CnpjKind, type UF } from '@mocado/core';

export type Theme = 'system' | 'light' | 'dark';
export const THEMES: readonly Theme[] = ['system', 'light', 'dark'];
export type Language = 'auto' | 'pt_BR' | 'en';
export const LANGUAGES: readonly Language[] = ['auto', 'pt_BR', 'en'];
export const CNPJ_KINDS: readonly CnpjKind[] = ['numerico', 'alfanumerico', 'aleatorio'];

export const IDADE_MAX = 120;

export interface Settings {
  masked: boolean;
  cnpjTipo: CnpjKind;
  uf: UF | '';
  idadeMin: number;
  idadeMax: number;
  blockedDomains: string[];
  theme: Theme;
  language: Language;
  fillPasswords: boolean;
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
  language: 'auto',
  fillPasswords: false,
  observe: true,
};

const oneOf = <T>(list: readonly T[], v: unknown, fallback: T): T =>
  list.includes(v as T) ? (v as T) : fallback;
const bool = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback);
const age = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(IDADE_MAX, Math.round(value)))
    : fallback;

export function normalizeSettings(raw: unknown): Settings {
  const stored = (raw && typeof raw === 'object' ? raw : {}) as Partial<
    Record<keyof Settings, unknown>
  >;
  const defaults = DEFAULT_SETTINGS;
  const idadeMin = age(stored.idadeMin, defaults.idadeMin);
  return {
    masked: bool(stored.masked, defaults.masked),
    cnpjTipo: oneOf(CNPJ_KINDS, stored.cnpjTipo, defaults.cnpjTipo),
    uf: oneOf<UF | ''>(['', ...UFS], stored.uf, defaults.uf),
    idadeMin,
    idadeMax: Math.max(idadeMin, age(stored.idadeMax, defaults.idadeMax)),
    blockedDomains: Array.isArray(stored.blockedDomains)
      ? stored.blockedDomains.filter((domain): domain is string => typeof domain === 'string')
      : defaults.blockedDomains,
    theme: oneOf(THEMES, stored.theme, defaults.theme),
    language: oneOf(LANGUAGES, stored.language, defaults.language),
    fillPasswords: bool(stored.fillPasswords, defaults.fillPasswords),
    observe: bool(stored.observe, defaults.observe),
  };
}

export function withSetting<K extends keyof Settings>(
  settings: Settings,
  key: K,
  value: Settings[K],
): Settings {
  const next = { ...settings, [key]: value };
  if (key === 'idadeMin' && next.idadeMax < next.idadeMin) next.idadeMax = next.idadeMin;
  if (key === 'idadeMax' && next.idadeMin > next.idadeMax) next.idadeMin = next.idadeMax;
  return normalizeSettings(next);
}

export const parseDomains = (text: string) =>
  text
    .split(/\s+/)
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

export const isBlocked = (hostname: string, blocked: readonly string[]) =>
  blocked.some((d) => {
    const domain = d.trim().toLowerCase().replace(/^\*\./, '');
    return domain !== '' && (hostname === domain || hostname.endsWith(`.${domain}`));
  });
