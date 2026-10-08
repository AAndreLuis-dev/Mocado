import {
  empresa,
  EMPRESA_FIELDS,
  pessoa,
  valorAvulso,
  type FieldType,
  type Perfil,
  type PerfilOptions,
} from '@mocado/core';
import type { PerfilTipo } from './profile';
import type { Settings } from './settings';

export const perfilOptions = (s: Settings): PerfilOptions => ({
  uf: s.uf || undefined,
  idadeMin: s.idadeMin,
  idadeMax: s.idadeMax,
  cnpjTipo: s.cnpjTipo,
  masked: true,
});

export function generateFor(
  types: readonly FieldType[],
  settings: Settings,
): { tipo: PerfilTipo; perfil: Perfil } {
  const opts = perfilOptions(settings);
  return types.some((t) => EMPRESA_FIELDS.includes(t))
    ? { tipo: 'empresa', perfil: empresa(opts) }
    : { tipo: 'pessoa', perfil: pessoa(opts) };
}

export const generateValue = (type: FieldType, settings: Settings) =>
  valorAvulso(type, perfilOptions(settings));
