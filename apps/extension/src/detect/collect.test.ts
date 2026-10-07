import { beforeEach, describe, expect, test } from 'vitest';
import { collectFields, radioGroups, stableSelector } from './collect';

beforeEach(() => {
  document.body.innerHTML = '';
});

const types = (root: Document | Element = document) => collectFields(root).map((d) => d.type);

describe('collectFields', () => {
  test('label for/wrapping/aria-labelledby and ignored fields', () => {
    document.body.innerHTML = `
      <form>
        <label for="a">CPF</label><input id="a" name="campo1">
        <label>Nome completo <input name="campo2"></label>
        <span id="lbl">E-mail</span><input name="campo3" aria-labelledby="lbl">
        <input type="hidden" name="cpf">
        <input name="cpf2" disabled aria-label="CPF">
        <input name="cpf3" readonly aria-label="CPF">
        <input type="password" name="senha">
        <input name="g-recaptcha-response" aria-label="captcha">
        <input type="submit" value="Enviar">
      </form>`;
    expect(types()).toEqual(['cpf', 'nome', 'email']);
  });

  test('passwords only with the explicit option', () => {
    document.body.innerHTML = `<input type="password" name="senha"><input type="password" name="confirmar_senha">`;
    expect(types()).toEqual([]);
    expect(collectFields(document, { fillPasswords: true }).map((d) => d.type)).toEqual([
      'senha',
      'senha',
    ]);
  });

  test('open shadow DOM', () => {
    const host = document.createElement('div');
    document.body.append(host);
    host.attachShadow({ mode: 'open' }).innerHTML = `<label>CEP <input name="x"></label>`;
    expect(types()).toEqual(['cep']);
  });

  test('same-origin iframe', () => {
    const frame = document.createElement('iframe');
    document.body.append(frame);
    frame.contentDocument!.body.innerHTML = `<input name="cnpj">`;
    expect(types()).toEqual(['cnpj']);
  });

  test('table layout: label in previous cell', () => {
    document.body.innerHTML = `<table><tr><td>Data de nascimento:</td><td><input name="campo9"></td></tr></table>`;
    expect(types()).toEqual(['nascimento']);
  });

  test('overrides win over classification', () => {
    document.body.innerHTML = `<input name="campo1">`;
    expect(
      collectFields(document, { overrides: { 'input[name="campo1"]': 'cpf' } }).map((d) => d.type),
    ).toEqual(['cpf']);
  });

  test('format hint carried', () => {
    document.body.innerHTML = `<input name="cpf" maxlength="11"><input name="cnpj" maxlength="18">`;
    expect(collectFields(document).map((d) => d.masked)).toEqual([false, true]);
  });
});

test('stableSelector', () => {
  document.body.innerHTML = `<form><div><input id="email"><input id="react-123:r1"><input name="doc"><input><input></div></form>`;
  const els = [...document.querySelectorAll('input')];
  expect(els.map(stableSelector)).toEqual([
    '#email',
    'div:nth-of-type(1) > input:nth-of-type(2)',
    'input[name="doc"]',
    'div:nth-of-type(1) > input:nth-of-type(4)',
    'div:nth-of-type(1) > input:nth-of-type(5)',
  ]);
  for (const [i, el] of els.entries())
    expect(
      document.querySelector(`form ${stableSelector(el)}`) ??
        document.querySelector(stableSelector(el)),
    ).toBe(els[i]);
});

test('radioGroups uses legend as hint', () => {
  document.body.innerHTML = `<fieldset><legend>Sexo</legend><input type="radio" name="s" value="M"><input type="radio" name="s" value="F"></fieldset>`;
  const [g] = radioGroups(document);
  expect(g!.radios).toHaveLength(2);
  expect(g!.hint).toContain('sexo');
});
