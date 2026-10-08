import { FIELD_TYPES, type FieldType, type Perfil } from '@mocado/core';

export type PerfilTipo = 'pessoa' | 'empresa' | 'avulso';
export const PERFIL_TIPOS: readonly PerfilTipo[] = ['pessoa', 'empresa', 'avulso'];

export interface Use {
  domain: string;
  url: string;
  at: number;
}

export interface HistoryRecord {
  id: string;
  label: string;
  tipo: PerfilTipo;
  favorite: boolean;
  createdAt: number;
  values: Perfil;
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

export const domains = (records: readonly HistoryRecord[]) =>
  [...new Set(records.flatMap((r) => r.uses.map((u) => u.domain)))].sort();

export const generatedName = (r: HistoryRecord): string =>
  r.values.razaoSocial || r.values.nome || Object.values(r.values)[0] || r.id;

export const displayName = (r: HistoryRecord): string => r.label || generatedName(r);

export const orderedValues = (values: Perfil): [FieldType, string][] =>
  FIELD_TYPES.flatMap((k) => (values[k] ? [[k, values[k]] as [FieldType, string]] : []));

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
