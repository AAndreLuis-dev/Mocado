import {
  BANCOS,
  BANDEIRAS,
  cartaoCompleto,
  certidao,
  cnh,
  cnpj,
  contaBancaria,
  cpf,
  email,
  empresa,
  endereco,
  ie,
  lorem,
  nascimento,
  nomeCompleto,
  numero,
  pessoa,
  pis,
  placa,
  renavam,
  rg,
  senha,
  telefone,
  titulo,
  UFS,
  uuid,
  veiculo,
  type Banco,
  type Bandeira,
  type CertidaoTipo,
  type CnpjTipo,
  type PlacaTipo,
  type Sexo,
  type TelefoneTipo,
  type UF,
} from '@mocado/core';

/** Option values; '' means "any". Labels come from i18n `opt.<value>` (UFs/banks/brands shown raw). */
export type Choices = Record<string, readonly string[]>;
export type Result = string | Record<string, string>;

export interface GeneratorDef {
  id: string;
  options?: Choices;
  run(opts: Record<string, string>, masked: boolean): Result;
}

const UF_OPT = ['', ...UFS] as const;
const uf = (o: Record<string, string>) => (o.uf || undefined) as UF | undefined;

// Stays in one place so the popup (and later the history page) render any generator generically.
export const GENERATORS: GeneratorDef[] = [
  {
    id: 'pessoa',
    options: { uf: UF_OPT, sexo: ['', 'M', 'F'] },
    run: (o, masked) =>
      pessoa({ uf: uf(o), sexo: (o.sexo || undefined) as Sexo, masked }) as Record<string, string>,
  },
  {
    id: 'empresa',
    options: { uf: UF_OPT, tipo: ['numerico', 'alfanumerico', 'aleatorio'] },
    run: (o, masked) =>
      empresa({ uf: uf(o), cnpjTipo: o.tipo as CnpjTipo, masked }) as Record<string, string>,
  },
  { id: 'cpf', options: { uf: UF_OPT }, run: (o, masked) => cpf.generate({ uf: uf(o), masked }) },
  {
    id: 'cnpj',
    options: { tipo: ['numerico', 'alfanumerico', 'aleatorio'] },
    run: (o, masked) => cnpj.generate({ tipo: o.tipo as CnpjTipo, masked }),
  },
  { id: 'rg', run: (_, masked) => rg.generate({ masked }) },
  { id: 'cnh', run: () => cnh.generate() },
  { id: 'pis', run: (_, masked) => pis.generate({ masked }) },
  {
    id: 'titulo',
    options: { uf: UF_OPT },
    run: (o, masked) => titulo.generate({ uf: uf(o), masked }),
  },
  { id: 'ie', options: { uf: UF_OPT }, run: (o, masked) => ie.generate({ uf: uf(o), masked }) },
  {
    id: 'certidao',
    options: { tipo: ['nascimento', 'casamento', 'obito'] },
    run: (o, masked) => certidao.generate({ tipo: o.tipo as CertidaoTipo, masked }),
  },
  { id: 'renavam', run: () => renavam.generate() },
  {
    id: 'placa',
    options: { tipo: ['mercosul', 'antiga', 'aleatorio'] },
    run: (o, masked) => placa.generate({ tipo: o.tipo as PlacaTipo, masked }),
  },
  {
    id: 'veiculo',
    run: () => {
      const v = veiculo();
      return {
        veiculoMarca: v.marca,
        veiculoModelo: v.modelo,
        veiculoAno: v.ano,
        placa: placa.generate(),
        renavam: renavam.generate(),
      };
    },
  },
  {
    id: 'cartao',
    options: { bandeira: ['', ...Object.keys(BANDEIRAS)] },
    run: (o, masked) => {
      const c = cartaoCompleto({ bandeira: (o.bandeira || undefined) as Bandeira, masked });
      return {
        cartaoNumero: c.numero,
        cartaoBandeira: c.bandeira,
        cartaoValidade: c.validade,
        cartaoCvv: c.cvv,
      };
    },
  },
  {
    id: 'conta',
    options: { banco: ['', ...Object.keys(BANCOS)] },
    run: (o) => {
      const c = contaBancaria({ banco: (o.banco || undefined) as Banco });
      return { banco: c.banco, nomeBanco: c.nomeBanco, agencia: c.agencia, conta: c.conta };
    },
  },
  {
    id: 'nome',
    options: { sexo: ['', 'M', 'F'] },
    run: (o) => nomeCompleto({ sexo: (o.sexo || undefined) as Sexo }),
  },
  { id: 'email', run: () => email(nomeCompleto()) },
  {
    id: 'telefone',
    options: { tipo: ['celular', 'fixo'], uf: UF_OPT },
    run: (o, masked) => telefone.generate({ uf: uf(o), tipo: o.tipo as TelefoneTipo, masked }),
  },
  {
    id: 'endereco',
    options: { uf: UF_OPT },
    run: (o, masked) => ({ ...endereco({ uf: uf(o), masked }) }),
  },
  {
    id: 'nascimento',
    options: { idade: ['18-25', '26-40', '41-60', '61-90', '0-17'] },
    run: (o) => {
      const [min = 18, max = 60] = (o.idade ?? '18-60').split('-').map(Number);
      return nascimento({ idadeMin: min, idadeMax: max });
    },
  },
  {
    id: 'senha',
    options: { tamanho: ['12', '8', '16', '24', '32'], simbolos: ['sim', 'nao'] },
    run: (o) => senha({ tamanho: Number(o.tamanho), simbolos: o.simbolos !== 'nao' }),
  },
  {
    id: 'lorem',
    options: { paragrafos: ['1', '2', '3', '5'] },
    run: (o) => lorem({ paragrafos: Number(o.paragrafos) }),
  },
  { id: 'numero', run: () => String(numero({ min: 0, max: 100000 })) },
  { id: 'uuid', run: () => uuid() },
];

export const defaultOptions = (g: GeneratorDef): Record<string, string> =>
  Object.fromEntries(Object.entries(g.options ?? {}).map(([k, v]) => [k, v[0] ?? '']));
