import { UFS, type CnpjTipo, type UF } from '@mocado/core';

export type Theme = 'system' | 'light' | 'dark';
export const THEMES: readonly Theme[] = ['system', 'light', 'dark'];
export const CNPJ_TIPOS: readonly CnpjTipo[] = ['numerico', 'alfanumerico', 'aleatorio'];

export const IDADE_MAX = 120;

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
  theme: Theme;
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

const oneOf = <T>(list: readonly T[], v: unknown, fallback: T): T =>
  list.includes(v as T) ? (v as T) : fallback;
const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
const age = (v: unknown, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v)
    ? Math.max(0, Math.min(IDADE_MAX, Math.round(v)))
    : fallback;

/**
 * Any stored/partial value → valid Settings: unknown or invalid keys get their default (so new
 * keys added in updates work with old storage) and the age range is always min ≤ max.
 */
export function normalizeSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof Settings, unknown>>;
  const d = DEFAULT_SETTINGS;
  const idadeMin = age(r.idadeMin, d.idadeMin);
  return {
    masked: bool(r.masked, d.masked),
    cnpjTipo: oneOf(CNPJ_TIPOS, r.cnpjTipo, d.cnpjTipo),
    uf: oneOf<UF | ''>(['', ...UFS], r.uf, d.uf),
    idadeMin,
    idadeMax: Math.max(idadeMin, age(r.idadeMax, d.idadeMax)),
    blockedDomains: Array.isArray(r.blockedDomains)
      ? r.blockedDomains.filter((x): x is string => typeof x === 'string')
      : d.blockedDomains,
    theme: oneOf(THEMES, r.theme, d.theme),
    fillPasswords: bool(r.fillPasswords, d.fillPasswords),
    observe: bool(r.observe, d.observe),
  };
}

/** Changes one setting; moving one end of the age range past the other drags the other along. */
export function withSetting<K extends keyof Settings>(
  s: Settings,
  key: K,
  value: Settings[K],
): Settings {
  const next = { ...s, [key]: value };
  if (key === 'idadeMin' && next.idadeMax < next.idadeMin) next.idadeMax = next.idadeMin;
  if (key === 'idadeMax' && next.idadeMin > next.idadeMax) next.idadeMin = next.idadeMax;
  return normalizeSettings(next);
}

/** Textarea content → list of domains (one per line or space separated). */
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
