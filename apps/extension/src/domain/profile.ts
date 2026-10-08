import { FIELD_TYPES, type FieldType, type Perfil } from '@mocado/core';

export type PerfilTipo = 'pessoa' | 'empresa' | 'avulso';
export const PERFIL_TIPOS: readonly PerfilTipo[] = ['pessoa', 'empresa', 'avulso'];

/** One fill of a profile on a page. */
export interface Use {
  domain: string;
  url: string;
  at: number;
}

export interface HistoryRecord {
  id: string;
  /** Editable, e.g. "admin teste", "cliente PJ". */
  label: string;
  tipo: PerfilTipo;
  favorite: boolean;
  createdAt: number;
  /** Every generated value (not only the ones the form had fields for). */
  values: Perfil;
  /** Where it was filled: first entry = creation, then each reuse. */
  uses: Use[];
}

export function newRecord(
  tipo: PerfilTipo,
  values: Perfil,
  use: Use,
  id: string = crypto.randomUUID(),
): HistoryRecord {
  return { id, label: '', tipo, favorite: false, createdAt: use.at, values, uses: [use] };
}

export const lastUse = (r: HistoryRecord) => r.uses.at(-1)?.at ?? r.createdAt;

/** Every domain a profile was used on, sorted. */
export const domains = (records: readonly HistoryRecord[]) =>
  [...new Set(records.flatMap((r) => r.uses.map((u) => u.domain)))].sort();

/** The generated name of the profile (company first), ignoring the user label. */
export const generatedName = (r: HistoryRecord): string =>
  r.values.razaoSocial || r.values.nome || Object.values(r.values)[0] || r.id;

/** What the user calls it: their label, else the generated name. */
export const displayName = (r: HistoryRecord): string => r.label || generatedName(r);

/** Non-empty values in form order (storage returns keys sorted alphabetically). */
export const orderedValues = (values: Perfil): [FieldType, string][] =>
  FIELD_TYPES.flatMap((k) => (values[k] ? [[k, values[k]] as [FieldType, string]] : []));

/** The few values that identify a profile at a glance: document, e-mail, city/UF. */
export function keyValues(values: Perfil): [FieldType, string][] {
  const city = values.cidade && values.uf ? `${values.cidade}/${values.uf}` : values.cidade;
  const picks: [FieldType, string | undefined][] = [
    values.cnpj ? ['cnpj', values.cnpj] : ['cpf', values.cpf],
    ['email', values.email],
    ['cidade', city],
  ];
  const found = picks.filter((p): p is [FieldType, string] => !!p[1]);
  return found.length ? found : orderedValues(values).slice(0, 1);
}
