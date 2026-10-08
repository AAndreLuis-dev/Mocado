import {
  company,
  COMPANY_FIELDS,
  person,
  singleValue,
  type FieldType,
  type Profile,
  type ProfileOptions,
} from '@mocado/core';
import type { ProfileKind } from './profile';
import type { Settings } from './settings';

export const profileOptions = (s: Settings): ProfileOptions => ({
  uf: s.uf || undefined,
  minAge: s.idadeMin,
  maxAge: s.idadeMax,
  cnpjKind: s.cnpjTipo,
  masked: true,
});

export function generateFor(
  types: readonly FieldType[],
  settings: Settings,
): { kind: ProfileKind; profile: Profile } {
  const opts = profileOptions(settings);
  return types.some((t) => COMPANY_FIELDS.includes(t))
    ? { kind: 'empresa', profile: company(opts) }
    : { kind: 'pessoa', profile: person(opts) };
}

export const generateValue = (type: FieldType, settings: Settings) =>
  singleValue(type, profileOptions(settings));
