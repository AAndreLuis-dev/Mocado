import { defaultRng, int, pick, type Rng } from './rng';
import { UFS, type UF } from './uf';
import { cpf } from './docs/cpf';
import { cnpj, type CnpjTipo } from './docs/cnpj';
import { rg } from './docs/rg';
import { cnh } from './docs/cnh';
import { pis } from './docs/pis';
import { titulo } from './docs/titulo';
import { ie } from './docs/ie';
import { renavam } from './docs/renavam';
import { certidao } from './docs/certidao';
import { placa, veiculo } from './veiculo';
import { cartaoCompleto, contaBancaria } from './financeiro';
import {
  dataBR,
  email,
  idade,
  nascimento,
  nomeCompleto,
  pais,
  senha,
  SEXO_LABEL,
  sexo as sorteiaSexo,
  telefone,
  type Sexo,
} from './pessoal';
import { endereco } from './endereco';
import { lorem } from './extras';
import EMPRESAS from './data/empresas.json';

/** Every field the extension can detect and fill. */
export const FIELD_TYPES = [
  // pessoa
  'nome', 'primeiroNome', 'sobrenome', 'sexo', 'nascimento', 'idade', 'mae', 'pai',
  'cpf', 'rg', 'cnh', 'pis', 'titulo', 'certidao',
  'email', 'telefone', 'celular', 'senha',
  // endereço
  'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf',
  // empresa
  'cnpj', 'razaoSocial', 'nomeFantasia', 'ie', 'dataAbertura',
  // financeiro
  'cartaoNumero', 'cartaoNome', 'cartaoValidade', 'cartaoCvv', 'banco', 'agencia', 'conta',
  // veículo
  'placa', 'renavam', 'veiculoMarca', 'veiculoModelo',
  // extras
  'texto',
] as const; // prettier-ignore

export type FieldType = (typeof FIELD_TYPES)[number];
export type Perfil = Partial<Record<FieldType, string>>;

export const EMPRESA_FIELDS: readonly FieldType[] = [
  'cnpj',
  'razaoSocial',
  'nomeFantasia',
  'ie',
  'dataAbertura',
];

export interface PerfilOptions {
  uf?: UF;
  sexo?: Sexo;
  idadeMin?: number;
  idadeMax?: number;
  cnpjTipo?: CnpjTipo;
  masked?: boolean;
  rng?: Rng;
  now?: Date;
}

/** A coherent person: one UF drives CPF region, título, DDD and address; e-mail from the name. */
export function pessoa(opts: PerfilOptions = {}): Perfil {
  const { rng = defaultRng, masked = true, now = new Date() } = opts;
  const uf = opts.uf ?? pick(rng, UFS);
  const s = opts.sexo ?? sorteiaSexo({ rng });
  const nome = nomeCompleto({ sexo: s, rng });
  const [primeiro = '', ...resto] = nome.split(' ');
  const nasc = nascimento({ idadeMin: opts.idadeMin, idadeMax: opts.idadeMax, rng, now });
  const end = endereco({ uf, rng, masked });
  const card = cartaoCompleto({ rng, masked, now });
  const conta = contaBancaria({ rng });
  const v = veiculo({ rng, now });
  return {
    nome,
    primeiroNome: primeiro,
    sobrenome: resto.join(' '),
    sexo: SEXO_LABEL[s],
    nascimento: nasc,
    idade: String(idade(nasc, now)),
    ...pais(nome, { rng }),
    cpf: cpf.generate({ uf, rng, masked }),
    rg: rg.generate({ rng, masked }),
    cnh: cnh.generate({ rng }),
    pis: pis.generate({ rng, masked }),
    titulo: titulo.generate({ uf, rng, masked }),
    certidao: certidao.generate({ tipo: 'nascimento', rng, masked, now }),
    email: email(nome, { rng }),
    telefone: telefone.generate({ uf, tipo: 'fixo', rng, masked }),
    celular: telefone.generate({ uf, tipo: 'celular', rng, masked }),
    senha: senha({ rng }),
    cep: end.cep,
    logradouro: end.logradouro,
    numero: end.numero,
    complemento: end.complemento,
    bairro: end.bairro,
    cidade: end.cidade,
    uf: end.uf,
    cartaoNumero: card.numero,
    cartaoNome: nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase(),
    cartaoValidade: card.validade,
    cartaoCvv: card.cvv,
    banco: conta.banco,
    agencia: conta.agencia,
    conta: conta.conta,
    placa: placa.generate({ rng, masked }),
    renavam: renavam.generate({ rng }),
    veiculoMarca: v.marca,
    veiculoModelo: v.modelo,
    texto: lorem({ rng }),
  };
}

/** A company plus its legal representative (same UF): IE from the address UF. */
export function empresa(opts: PerfilOptions = {}): Perfil {
  const { rng = defaultRng, masked = true, now = new Date() } = opts;
  const uf = opts.uf ?? pick(rng, UFS);
  const responsavel = pessoa({ ...opts, uf, rng, masked, now });
  const fantasia = pick(rng, EMPRESAS.nomes);
  const razao = `${fantasia} ${pick(rng, EMPRESAS.ramos)} ${pick(rng, EMPRESAS.sufixos)}`;
  const domain = `${fantasia
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')}.example.com`;
  const abertura = new Date(now.getFullYear() - int(rng, 1, 30), int(rng, 0, 11), int(rng, 1, 28));
  return {
    ...responsavel,
    cnpj: cnpj.generate({ tipo: opts.cnpjTipo, rng, masked }),
    razaoSocial: razao,
    nomeFantasia: fantasia,
    ie: ie.generate({ uf, rng, masked }),
    dataAbertura: dataBR(abertura),
    email: `${pick(rng, ['contato', 'financeiro', 'comercial'])}@${domain}`,
    telefone: telefone.generate({ uf, tipo: 'fixo', rng, masked }),
  };
}

/** One value for a single field ("Gerar CPF aqui"). */
export function valorAvulso(type: FieldType, opts: PerfilOptions = {}): string {
  const perfil = EMPRESA_FIELDS.includes(type) ? empresa(opts) : pessoa(opts);
  return perfil[type] ?? '';
}
