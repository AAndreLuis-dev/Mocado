import { defaultRng, int, pick, type Rng } from './rng';
import { UFS, type UF } from './uf';
import { cpf } from './documents/cpf';
import { cnpj, type CnpjKind } from './documents/cnpj';
import { rg } from './documents/rg';
import { cnh } from './documents/cnh';
import { pis } from './documents/pis';
import { voterId } from './documents/voter-id';
import { ie } from './documents/ie';
import { renavam } from './documents/renavam';
import { civilCertificate } from './documents/civil-certificate';
import { licensePlate, vehicle } from './vehicle';
import { creditCardDetails, bankAccount } from './finance';
import {
  formatDateBR,
  email,
  age,
  birthDate,
  fullName,
  parents,
  password,
  SEX_LABEL,
  sex as randomSex,
  phone,
  type Sex,
} from './personal';
import { address } from './address';
import { stripAccents } from './mask';
import { lorem } from './extras';
import COMPANIES from './data/empresas.json' with { type: 'json' };

export const FIELD_TYPES = [
  'nome',
  'primeiroNome',
  'sobrenome',
  'sexo',
  'nascimento',
  'idade',
  'mae',
  'pai',
  'cpf',
  'rg',
  'cnh',
  'pis',
  'titulo',
  'certidao',
  'email',
  'telefone',
  'celular',
  'senha',
  'cep',
  'logradouro',
  'numero',
  'complemento',
  'bairro',
  'cidade',
  'uf',
  'cnpj',
  'razaoSocial',
  'nomeFantasia',
  'ie',
  'dataAbertura',
  'cartaoNumero',
  'cartaoNome',
  'cartaoValidade',
  'cartaoCvv',
  'banco',
  'agencia',
  'conta',
  'placa',
  'renavam',
  'veiculoMarca',
  'veiculoModelo',
  'texto',
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];
export type Profile = Partial<Record<FieldType, string>>;

export const COMPANY_FIELDS: readonly FieldType[] = [
  'cnpj',
  'razaoSocial',
  'nomeFantasia',
  'ie',
  'dataAbertura',
];

export interface ProfileOptions {
  uf?: UF;
  sex?: Sex;
  minAge?: number;
  maxAge?: number;
  cnpjKind?: CnpjKind;
  masked?: boolean;
  rng?: Rng;
  now?: Date;
}

export function person(opts: ProfileOptions = {}): Profile {
  const { rng = defaultRng, masked = true, now = new Date() } = opts;
  const uf = opts.uf ?? pick(rng, UFS);
  const chosenSex = opts.sex ?? randomSex({ rng });
  const name = fullName({ sex: chosenSex, rng });
  const [first = '', ...rest] = name.split(' ');
  const birth = birthDate({ minAge: opts.minAge, maxAge: opts.maxAge, rng, now });
  const home = address({ uf, rng, masked });
  const card = creditCardDetails({ rng, masked, now });
  const account = bankAccount({ rng });
  const car = vehicle({ rng, now });
  const { mother, father } = parents(name, { rng });
  return {
    nome: name,
    primeiroNome: first,
    sobrenome: rest.join(' '),
    sexo: SEX_LABEL[chosenSex],
    nascimento: birth,
    idade: String(age(birth, now)),
    mae: mother,
    pai: father,
    cpf: cpf.generate({ uf, rng, masked }),
    rg: rg.generate({ rng, masked }),
    cnh: cnh.generate({ rng }),
    pis: pis.generate({ rng, masked }),
    titulo: voterId.generate({ uf, rng, masked }),
    certidao: civilCertificate.generate({ kind: 'nascimento', rng, masked, now }),
    email: email(name, { rng }),
    telefone: phone.generate({ uf, kind: 'fixo', rng, masked }),
    celular: phone.generate({ uf, kind: 'celular', rng, masked }),
    senha: password({ rng }),
    cep: home.cep,
    logradouro: home.logradouro,
    numero: home.numero,
    complemento: home.complemento,
    bairro: home.bairro,
    cidade: home.cidade,
    uf: home.uf,
    cartaoNumero: card.number,
    cartaoNome: stripAccents(name).toUpperCase(),
    cartaoValidade: card.expiry,
    cartaoCvv: card.cvv,
    banco: account.bankCode,
    agencia: account.branch,
    conta: account.account,
    placa: licensePlate.generate({ rng, masked }),
    renavam: renavam.generate({ rng }),
    veiculoMarca: car.make,
    veiculoModelo: car.model,
    texto: lorem({ rng }),
  };
}

export function company(opts: ProfileOptions = {}): Profile {
  const { rng = defaultRng, masked = true, now = new Date() } = opts;
  const uf = opts.uf ?? pick(rng, UFS);
  const owner = person({ ...opts, uf, rng, masked, now });
  const tradeName = pick(rng, COMPANIES.nomes);
  const legalName = `${tradeName} ${pick(rng, COMPANIES.ramos)} ${pick(rng, COMPANIES.sufixos)}`;
  const domain = `${stripAccents(tradeName)
    .toLowerCase()
    .replace(/[^a-z]/g, '')}.example.com`;
  const openedAt = new Date(now.getFullYear() - int(rng, 1, 30), int(rng, 0, 11), int(rng, 1, 28));
  return {
    ...owner,
    cnpj: cnpj.generate({ kind: opts.cnpjKind, rng, masked }),
    razaoSocial: legalName,
    nomeFantasia: tradeName,
    ie: ie.generate({ uf, rng, masked }),
    dataAbertura: formatDateBR(openedAt),
    email: `${pick(rng, ['contato', 'financeiro', 'comercial'])}@${domain}`,
    telefone: phone.generate({ uf, kind: 'fixo', rng, masked }),
  };
}

export function singleValue(type: FieldType, opts: ProfileOptions = {}): string {
  const profile = COMPANY_FIELDS.includes(type) ? company(opts) : person(opts);
  return profile[type] ?? '';
}
