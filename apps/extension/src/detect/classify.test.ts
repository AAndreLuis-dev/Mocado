import { describe, expect, test } from 'vitest';
import type { FieldType } from '@mocado/core';
import { classify, expectedMask, normalize, type Signals } from './classify';

const i = (s: Partial<Signals>): Signals => ({ tag: 'input', type: 'text', ...s });

// [description, signals, expected type | null]
const CASES: [string, Signals, FieldType | null][] = [
  ['autocomplete email', i({ autocomplete: 'email', name: 'x' }), 'email'],
  ['autocomplete given-name', i({ autocomplete: 'given-name' }), 'primeiroNome'],
  ['autocomplete family-name', i({ autocomplete: 'family-name' }), 'sobrenome'],
  ['autocomplete postal-code', i({ autocomplete: 'shipping postal-code' }), 'cep'],
  ['autocomplete cc-number', i({ autocomplete: 'cc-number' }), 'cartaoNumero'],
  ['autocomplete cc-csc', i({ autocomplete: 'cc-csc' }), 'cartaoCvv'],
  ['autocomplete bday', i({ autocomplete: 'bday' }), 'nascimento'],
  ['autocomplete address-level2', i({ autocomplete: 'address-level2' }), 'cidade'],
  ['name cpf', i({ name: 'cpf' }), 'cpf'],
  ['id txtCPF', i({ id: 'txtCPF' }), 'cpf'],
  ['name txtDoc', i({ name: 'txtDoc' }), 'cpf'],
  ['label CPF', i({ name: 'campo1', label: 'CPF' }), 'cpf'],
  ['placeholder Digite seu CPF', i({ name: 'campo2', placeholder: 'Digite seu CPF' }), 'cpf'],
  ['aria-label CPF', i({ name: 'f3', ariaLabel: 'Número do CPF' }), 'cpf'],
  ['name cnpj', i({ name: 'cnpj' }), 'cnpj'],
  ['label CNPJ da empresa', i({ label: 'CNPJ da empresa' }), 'cnpj'],
  ['name razao_social', i({ name: 'razao_social' }), 'razaoSocial'],
  ['label Razão Social', i({ label: 'Razão Social' }), 'razaoSocial'],
  ['label Nome Fantasia', i({ label: 'Nome Fantasia' }), 'nomeFantasia'],
  ['name nomeFantasia', i({ name: 'nomeFantasia' }), 'nomeFantasia'],
  ['label Inscrição Estadual', i({ label: 'Inscrição Estadual' }), 'ie'],
  ['label Data de abertura', i({ label: 'Data de abertura', type: 'date' }), 'dataAbertura'],
  ['name dt_nasc', i({ name: 'dt_nasc' }), 'nascimento'],
  ['name dataNascimento', i({ name: 'dataNascimento' }), 'nascimento'],
  ['label Data de Nascimento date', i({ label: 'Data de Nascimento', type: 'date' }), 'nascimento'],
  ['bare date input', i({ type: 'date', name: 'd1' }), 'nascimento'],
  ['name birthdate', i({ name: 'birthdate' }), 'nascimento'],
  ['name nome', i({ name: 'nome' }), 'nome'],
  ['label Nome completo', i({ label: 'Nome completo' }), 'nome'],
  ['label Nome da mãe', i({ label: 'Nome da mãe' }), 'mae'],
  ['label Nome do pai', i({ label: 'Nome do pai' }), 'pai'],
  ['name first_name', i({ name: 'first_name' }), 'primeiroNome'],
  ['name lastName', i({ name: 'lastName' }), 'sobrenome'],
  ['type email only', i({ type: 'email', name: 'login' }), 'email'],
  ['label E-mail', i({ label: 'E-mail' }), 'email'],
  ['name telefone', i({ name: 'telefone' }), 'telefone'],
  ['label Celular tel', i({ label: 'Celular', type: 'tel' }), 'celular'],
  ['name whatsapp', i({ name: 'whatsapp' }), 'celular'],
  ['bare tel', i({ type: 'tel', name: 'x' }), 'celular'],
  ['name cep', i({ name: 'cep' }), 'cep'],
  ['name zip', i({ name: 'zip' }), 'cep'],
  ['label Logradouro', i({ label: 'Logradouro' }), 'logradouro'],
  ['label Endereço', i({ label: 'Endereço' }), 'logradouro'],
  ['label Número', i({ label: 'Número' }), 'numero'],
  ['name numero', i({ name: 'numero' }), 'numero'],
  ['label Complemento', i({ label: 'Complemento' }), 'complemento'],
  ['label Bairro', i({ label: 'Bairro' }), 'bairro'],
  ['label Cidade', i({ label: 'Cidade' }), 'cidade'],
  ['select Estado', { tag: 'select', label: 'Estado' }, 'uf'],
  ['select uf', { tag: 'select', name: 'uf' }, 'uf'],
  ['label RG', i({ label: 'RG' }), 'rg'],
  ['label Identidade', i({ label: 'Identidade' }), 'rg'],
  ['label CNH', i({ label: 'CNH' }), 'cnh'],
  ['label PIS/PASEP', i({ label: 'PIS/PASEP' }), 'pis'],
  ['label Título de eleitor', i({ label: 'Título de eleitor' }), 'titulo'],
  ['label Número do cartão', i({ label: 'Número do cartão' }), 'cartaoNumero'],
  ['label Nome no cartão', i({ label: 'Nome impresso no cartão' }), 'cartaoNome'],
  ['label Validade', i({ label: 'Validade (MM/AA)' }), 'cartaoValidade'],
  ['label CVV', i({ label: 'CVV' }), 'cartaoCvv'],
  ['label Agência', i({ label: 'Agência' }), 'agencia'],
  ['label Conta corrente', i({ label: 'Conta corrente' }), 'conta'],
  ['label Placa do veículo', i({ label: 'Placa do veículo' }), 'placa'],
  ['label RENAVAM', i({ label: 'RENAVAM' }), 'renavam'],
  ['radio-less sexo select', { tag: 'select', label: 'Sexo' }, 'sexo'],
  ['textarea observações', { tag: 'textarea', label: 'Observações' }, 'texto'],
  ['password (classified, filtered later)', i({ type: 'password', name: 'senha' }), 'senha'],
  ['nearby text only', i({ name: 'campo5', nearby: 'Data de nascimento:' }), 'nascimento'],
  ['nearby CEP', i({ name: 'c9', nearby: 'CEP' }), 'cep'],
  ['search ignored', i({ type: 'search', name: 'q' }), null],
  ['captcha ignored', i({ name: 'captcha', label: 'Digite o código' }), null],
  ['busca ignored', i({ label: 'Buscar produtos' }), null],
  ['meaningless', i({ name: 'campo1' }), null],
  ['english street', i({ name: 'street_address' }), 'logradouro'],
  ['english city', i({ placeholder: 'City' }), 'cidade'],
  [
    'cpf vs nome: label CPF, name nome_cpf',
    i({ name: 'cliente_cpf', label: 'CPF do cliente' }),
    'cpf',
  ],
];

describe('classify', () => {
  test.each(CASES)('%s', (_, signals, expected) => {
    expect(classify(signals)?.type ?? null).toBe(expected);
  });
});

describe('expectedMask', () => {
  test('maxlength', () => {
    expect(expectedMask('cpf', i({ maxLength: 11 }))).toBe(false);
    expect(expectedMask('cpf', i({ maxLength: 14 }))).toBe(true);
    expect(expectedMask('cnpj', i({ maxLength: 18 }))).toBe(true);
    expect(expectedMask('cep', i({ maxLength: 8 }))).toBe(false);
    expect(expectedMask('cpf', i({}))).toBeUndefined();
  });
  test('pattern', () => {
    expect(expectedMask('cpf', i({ pattern: '\\d{11}' }))).toBe(false);
    expect(expectedMask('cpf', i({ pattern: '\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}' }))).toBe(true);
    expect(expectedMask('cpf', i({ pattern: '[' }))).toBeUndefined();
  });
  test('placeholder and number input', () => {
    expect(expectedMask('cpf', i({ placeholder: '000.000.000-00' }))).toBe(true);
    expect(expectedMask('cpf', i({ placeholder: '00000000000' }))).toBe(false);
    expect(expectedMask('cep', i({ type: 'number' }))).toBe(false);
  });
});

test('normalize', () => {
  expect(normalize('dtNasc_Cliente')).toBe('dt nasc cliente');
  expect(normalize('E-mail')).toBe('e mail');
  expect(normalize('Razão Social')).toBe('razao social');
  expect(normalize('campo1')).toBe('campo 1');
});

test('generic person words lose to a document type', () => {
  expect(classify(i({ name: 'cpfResponsavel', label: 'CPF do responsável' }))?.type).toBe('cpf');
  expect(classify(i({ name: 'responsavel', label: 'Nome do responsável' }))?.type).toBe('nome');
});
