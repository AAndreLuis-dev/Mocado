import { beforeEach, describe, expect, test, vi } from 'vitest';
import { adapt, chooseOption, chooseRadio, fillElement } from './fill';

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('fillElement', () => {
  test('uses the prototype setter (bypasses instance trackers like React) and fires events', () => {
    document.body.innerHTML = `<input name="cpf">`;
    const input = document.querySelector('input')!;
    const instanceSetter = vi.fn();
    // React keeps a per-instance value tracker; assigning el.value hits it and React ignores the change.
    Object.defineProperty(input, 'value', {
      configurable: true,
      get: () =>
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.get!.call(input),
      set: instanceSetter,
    });
    const events: string[] = [];
    for (const t of ['focus', 'input', 'change', 'blur'])
      input.addEventListener(t, () => events.push(t));
    expect(fillElement(input, '123.456.789-09')).toBe(true);
    expect(instanceSetter).not.toHaveBeenCalled();
    expect(input.value).toBe('123.456.789-09');
    expect(events).toEqual(expect.arrayContaining(['input', 'change', 'blur']));
  });

  test('input/change bubble to a delegated listener (frameworks listen on the root)', () => {
    document.body.innerHTML = `<div id="root"><textarea></textarea></div>`;
    const seen: string[] = [];
    document
      .getElementById('root')!
      .addEventListener('input', (e) => seen.push((e.target as HTMLTextAreaElement).value));
    fillElement(document.querySelector('textarea')!, 'lorem');
    expect(seen).toEqual(['lorem']);
  });

  test('falls back to typing when a mask rejects the bulk value', () => {
    document.body.innerHTML = `<input>`;
    const input = document.querySelector('input')!;
    // fake mask: accepts only one char per input event (like keystroke-driven masks)
    let last = '';
    input.addEventListener('input', (e) => {
      const ie = e as InputEvent;
      if (ie.inputType === 'insertFromPaste') input.value = last;
      else last = input.value;
    });
    fillElement(input, '01310-100');
    expect(input.value.replace(/\D/g, '')).toBe('01310100');
  });

  test('select picks matching option by value, text or UF name', () => {
    document.body.innerHTML = `<select><option value="">Selecione</option><option value="1">Rio de Janeiro</option><option value="2">São Paulo</option></select>`;
    const select = document.querySelector('select')!;
    const changed = vi.fn();
    select.addEventListener('change', changed);
    fillElement(select, 'SP');
    expect(select.value).toBe('2');
    expect(changed).toHaveBeenCalled();
  });
});

test('chooseOption falls back to a random non-empty option', () => {
  document.body.innerHTML = `<select><option value="">--</option><option value="a">A</option><option value="b" disabled>B</option></select>`;
  expect(chooseOption(document.querySelector('select')!, 'zzz')?.value).toBe('a');
});

test('chooseRadio matches by label/value', () => {
  document.body.innerHTML = `
    <input type="radio" name="s" value="M" id="m"><label for="m">Masculino</label>
    <input type="radio" name="s" value="F" id="f"><label for="f">Feminino</label>`;
  const radios = [...document.querySelectorAll('input')];
  expect(chooseRadio(radios, 'Feminino')?.value).toBe('F');
  expect(chooseRadio(radios, 'Masculino')?.value).toBe('M');
  expect(chooseRadio(radios, undefined)?.value).toBe('M');
});

describe('adapt', () => {
  const input = (attrs = '') => {
    document.body.innerHTML = `<input ${attrs}>`;
    return document.querySelector('input')!;
  };
  test('unmasked fields get digits only', () => {
    expect(adapt('123.456.789-09', 'cpf', input('maxlength="11"'), false)).toBe('12345678909');
    expect(adapt('12.ABC.345/01DE-35', 'cnpj', input(), false)).toBe('12ABC34501DE35');
  });
  test('masked kept; too long for maxlength → stripped', () => {
    expect(adapt('123.456.789-09', 'cpf', input(), true)).toBe('123.456.789-09');
    expect(adapt('01310-100', 'cep', input('maxlength="8"'), undefined)).toBe('01310100');
  });
  test('date and month inputs', () => {
    expect(adapt('06/10/1990', 'nascimento', input('type="date"'), true)).toBe('1990-10-06');
    expect(adapt('07/29', 'cartaoValidade', input('type="month"'), true)).toBe('2029-07');
    expect(adapt('07/29', 'cartaoValidade', input('maxlength="4"'), true)).toBe('0729');
  });
  test('text values never stripped', () => {
    expect(adapt('Ana Souza', 'nome', input(), false)).toBe('Ana Souza');
  });
});
