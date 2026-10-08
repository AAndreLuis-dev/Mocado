import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { PageContext } from '../application/ports';
import { fillChoices } from './fill/choices';
import { createFocusTracker } from './fill/focus';
import { createPageApi } from './page';

const ctx = (over: Partial<PageContext> = {}): PageContext => ({
  masked: true,
  fillPasswords: false,
  observe: false,
  overrides: {},
  ...over,
});

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('createPageApi', () => {
  test('scan lists types and the focused field type', async () => {
    document.body.innerHTML = `<label>CPF <input name="a"></label><label>E-mail <input name="b"></label>`;
    document.querySelector<HTMLInputElement>('[name=b]')!.focus();
    const scan = await createPageApi().scan(ctx());
    expect(scan).toMatchObject({
      hostname: 'localhost',
      types: ['cpf', 'email'],
      focused: 'email',
    });
  });

  test('fill writes values (mask per field) and the choices', async () => {
    document.body.innerHTML = `
      <label>CPF <input name="cpf" maxlength="11"></label>
      <label>Nome <input name="nome"></label>
      <fieldset><legend>Sexo</legend>
        <label><input type="radio" name="s" value="M">Masculino</label>
        <label><input type="radio" name="s" value="F">Feminino</label>
      </fieldset>
      <input type="checkbox" name="termos" required>
      <select name="plano"><option value=""></option><option value="p">Pro</option></select>`;
    const perfil = { cpf: '123.456.789-09', nome: 'Ana Lima', sexo: 'Feminino' };
    const report = await createPageApi().fill(perfil, ctx());
    expect(report.fields).toEqual([
      { type: 'cpf', value: '12345678909' },
      { type: 'nome', value: 'Ana Lima' },
    ]);
    expect(report.filled).toBe(5);
    expect(document.querySelector<HTMLInputElement>('[value=F]')!.checked).toBe(true);
    expect(document.querySelector<HTMLInputElement>('[name=termos]')!.checked).toBe(true);
    expect(document.querySelector('select')!.value).toBe('p');
  });

  test('overrides for this hostname win over detection', async () => {
    document.body.innerHTML = `<label>Nome <input id="doc"></label>`;
    const api = createPageApi();
    expect((await api.scan(ctx())).types).toEqual(['nome']);
    const overrides = {
      localhost: { '#doc': 'cpf' as const },
      'other.test': { '#doc': 'cep' as const },
    };
    expect((await api.scan(ctx({ overrides }))).types).toEqual(['cpf']);
  });

  test('password fields only with fillPasswords', async () => {
    document.body.innerHTML = `<label>Senha <input type="password" name="senha"></label>`;
    const api = createPageApi();
    expect((await api.scan(ctx())).types).toEqual([]);
    expect((await api.scan(ctx({ fillPasswords: true }))).types).toEqual(['senha']);
  });

  test('fillFocused adapts to the field; focusedSelector names it', async () => {
    document.body.innerHTML = `<input name="doc" maxlength="11">`;
    const api = createPageApi();
    expect(await api.fillFocused('123.456.789-09', 'cpf', ctx())).toEqual({
      filled: 0,
      fields: [],
    });
    expect(await api.focusedSelector()).toBeNull();
    document.querySelector('input')!.focus();
    expect(await api.focusedSelector()).toEqual({
      hostname: 'localhost',
      selector: 'input[name="doc"]',
    });
    expect(await api.fillFocused('123.456.789-09', 'cpf', ctx())).toEqual({
      filled: 1,
      fields: [{ type: 'cpf', value: '12345678909' }],
    });
  });

  test('observe: fields added later get filled, user-typed ones are kept', async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `<label>CPF <input name="cpf"></label>`;
    await createPageApi().fill(
      { cpf: '123.456.789-09', email: 'a@example.com' },
      ctx({ observe: true }),
    );
    document.querySelector<HTMLInputElement>('[name=cpf]')!.value = 'digitado';
    document.body.insertAdjacentHTML('beforeend', `<label>E-mail <input name="email"></label>`);
    await vi.advanceTimersByTimeAsync(300);
    expect(document.querySelector<HTMLInputElement>('[name=email]')!.value).toBe('a@example.com');
    expect(document.querySelector<HTMLInputElement>('[name=cpf]')!.value).toBe('digitado');
    vi.useRealTimers();
  });
});

test('focus tracker falls back to the right-clicked field', () => {
  document.body.innerHTML = `<input name="a"><button>x</button>`;
  const focused = createFocusTracker(document);
  expect(focused()).toBeNull();
  document
    .querySelector('input')!
    .dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, composed: true }));
  expect(focused()?.getAttribute('name')).toBe('a');
});

test('fillChoices skips what is already done or chosen', () => {
  document.body.innerHTML = `
    <input type="radio" name="r1" value="a" checked><input type="radio" name="r1" value="b">
    <input type="radio" name="r2" value="a"><input type="radio" name="r2" value="b">
    <input type="checkbox" name="opt">`;
  const done = new WeakSet<Element>();
  expect(fillChoices(document, {}, new Set(), done)).toBe(1);
  expect(fillChoices(document, {}, new Set(), done)).toBe(0);
  expect(document.querySelector<HTMLInputElement>('[name=opt]')!.checked).toBe(false);
});
