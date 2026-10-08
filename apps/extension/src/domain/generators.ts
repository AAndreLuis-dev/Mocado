import {
  BANKS,
  CARD_BRANDS,
  creditCardDetails,
  civilCertificate,
  cnh,
  cnpj,
  bankAccount,
  cpf,
  email,
  company,
  address,
  ie,
  lorem,
  birthDate,
  fullName,
  randomNumber,
  person,
  pis,
  licensePlate,
  renavam,
  rg,
  password,
  phone,
  voterId,
  UFS,
  uuid,
  vehicle,
  type Bank,
  type CardBrand,
  type CertificateKind,
  type CnpjKind,
  type PlateKind,
  type Sex,
  type PhoneKind,
  type UF,
} from '@mocado/core';

export type Choices = Record<string, readonly string[]>;
export type Result = string | Record<string, string>;

export interface GeneratorDef {
  id: string;
  options?: Choices;
  run(selected: Record<string, string>, masked: boolean): Result;
}

const UF_OPT = ['', ...UFS] as const;
const uf = (selected: Record<string, string>) => (selected.uf || undefined) as UF | undefined;

export const GENERATORS: GeneratorDef[] = [
  {
    id: 'pessoa',
    options: { uf: UF_OPT, sexo: ['', 'M', 'F'] },
    run: (selected, masked) =>
      person({ uf: uf(selected), sex: (selected.sexo || undefined) as Sex, masked }) as Record<
        string,
        string
      >,
  },
  {
    id: 'empresa',
    options: { uf: UF_OPT, tipo: ['numerico', 'alfanumerico', 'aleatorio'] },
    run: (selected, masked) =>
      company({ uf: uf(selected), cnpjKind: selected.tipo as CnpjKind, masked }) as Record<
        string,
        string
      >,
  },
  {
    id: 'cpf',
    options: { uf: UF_OPT },
    run: (selected, masked) => cpf.generate({ uf: uf(selected), masked }),
  },
  {
    id: 'cnpj',
    options: { tipo: ['numerico', 'alfanumerico', 'aleatorio'] },
    run: (selected, masked) => cnpj.generate({ kind: selected.tipo as CnpjKind, masked }),
  },
  { id: 'rg', run: (_, masked) => rg.generate({ masked }) },
  { id: 'cnh', run: () => cnh.generate() },
  { id: 'pis', run: (_, masked) => pis.generate({ masked }) },
  {
    id: 'titulo',
    options: { uf: UF_OPT },
    run: (selected, masked) => voterId.generate({ uf: uf(selected), masked }),
  },
  {
    id: 'ie',
    options: { uf: UF_OPT },
    run: (selected, masked) => ie.generate({ uf: uf(selected), masked }),
  },
  {
    id: 'certidao',
    options: { tipo: ['nascimento', 'casamento', 'obito'] },
    run: (selected, masked) =>
      civilCertificate.generate({ kind: selected.tipo as CertificateKind, masked }),
  },
  { id: 'renavam', run: () => renavam.generate() },
  {
    id: 'placa',
    options: { tipo: ['mercosul', 'antiga', 'aleatorio'] },
    run: (selected, masked) => licensePlate.generate({ kind: selected.tipo as PlateKind, masked }),
  },
  {
    id: 'veiculo',
    run: () => {
      const car = vehicle();
      return {
        veiculoMarca: car.make,
        veiculoModelo: car.model,
        veiculoAno: car.year,
        placa: licensePlate.generate(),
        renavam: renavam.generate(),
      };
    },
  },
  {
    id: 'cartao',
    options: { bandeira: ['', ...Object.keys(CARD_BRANDS)] },
    run: (selected, masked) => {
      const card = creditCardDetails({
        brand: (selected.bandeira || undefined) as CardBrand,
        masked,
      });
      return {
        cartaoNumero: card.number,
        cartaoBandeira: card.brand,
        cartaoValidade: card.expiry,
        cartaoCvv: card.cvv,
      };
    },
  },
  {
    id: 'conta',
    options: { banco: ['', ...Object.keys(BANKS)] },
    run: (selected) => {
      const account = bankAccount({ bank: (selected.banco || undefined) as Bank });
      return {
        banco: account.bankCode,
        nomeBanco: account.bankName,
        agencia: account.branch,
        conta: account.account,
      };
    },
  },
  {
    id: 'nome',
    options: { sexo: ['', 'M', 'F'] },
    run: (selected) => fullName({ sex: (selected.sexo || undefined) as Sex }),
  },
  { id: 'email', run: () => email(fullName()) },
  {
    id: 'telefone',
    options: { tipo: ['celular', 'fixo'], uf: UF_OPT },
    run: (selected, masked) =>
      phone.generate({ uf: uf(selected), kind: selected.tipo as PhoneKind, masked }),
  },
  {
    id: 'endereco',
    options: { uf: UF_OPT },
    run: (selected, masked) => ({ ...address({ uf: uf(selected), masked }) }),
  },
  {
    id: 'nascimento',
    options: { idade: ['18-25', '26-40', '41-60', '61-90', '0-17'] },
    run: (selected) => {
      const [min = 18, max = 60] = (selected.idade ?? '18-60').split('-').map(Number);
      return birthDate({ minAge: min, maxAge: max });
    },
  },
  {
    id: 'senha',
    options: { tamanho: ['12', '8', '16', '24', '32'], simbolos: ['sim', 'nao'] },
    run: (selected) =>
      password({ length: Number(selected.tamanho), symbols: selected.simbolos !== 'nao' }),
  },
  {
    id: 'lorem',
    options: { paragrafos: ['1', '2', '3', '5'] },
    run: (selected) => lorem({ paragraphs: Number(selected.paragrafos) }),
  },
  { id: 'numero', run: () => String(randomNumber({ min: 0, max: 100000 })) },
  { id: 'uuid', run: () => uuid() },
];

export const defaultOptions = (generator: GeneratorDef): Record<string, string> =>
  Object.fromEntries(
    Object.entries(generator.options ?? {}).map(([name, choices]) => [name, choices[0] ?? '']),
  );
