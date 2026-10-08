import type { FieldType } from '@mocado/core';
import type { FieldEl } from '../detect/collect';
import { normalize } from '../detect/classify';

const UF_NAMES: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
};

const TEXTUAL = new Set<FieldType>([
  'nome',
  'primeiroNome',
  'sobrenome',
  'mae',
  'pai',
  'logradouro',
  'complemento',
  'bairro',
  'cidade',
  'razaoSocial',
  'nomeFantasia',
  'cartaoNome',
  'email',
  'senha',
  'texto',
  'veiculoMarca',
  'veiculoModelo',
  'sexo',
]);

const alnum = (s: string) => s.toUpperCase().replace(/[^0-9A-Z]/g, '');

function setNativeValue(el: FieldEl, value: string) {
  const win = el.ownerDocument.defaultView ?? window;
  const proto =
    el.tagName === 'TEXTAREA'
      ? win.HTMLTextAreaElement.prototype
      : el.tagName === 'SELECT'
        ? win.HTMLSelectElement.prototype
        : win.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
}

function fire(el: Element, type: string, init: EventInit = {}) {
  const win = el.ownerDocument.defaultView ?? window;
  const Ctor = type.startsWith('key')
    ? win.KeyboardEvent
    : type === 'input' || type === 'beforeinput'
      ? win.InputEvent
      : win.Event;
  el.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true, composed: true, ...init }));
}

function typeChars(el: FieldEl, value: string) {
  setNativeValue(el, '');
  fire(el, 'input', { inputType: 'deleteContentBackward' } as InputEventInit);
  for (const ch of value) {
    fire(el, 'keydown', { key: ch } as KeyboardEventInit);
    fire(el, 'keypress', { key: ch } as KeyboardEventInit);
    fire(el, 'beforeinput', { inputType: 'insertText', data: ch } as InputEventInit);
    setNativeValue(el, el.value + ch);
    fire(el, 'input', { inputType: 'insertText', data: ch } as InputEventInit);
    fire(el, 'keyup', { key: ch } as KeyboardEventInit);
  }
}

export function adapt(
  value: string,
  type: FieldType,
  el: FieldEl,
  masked: boolean | undefined,
): string {
  const input = el.tagName === 'INPUT' ? (el as HTMLInputElement) : null;
  if (input?.type === 'date' && /^\d{2}\/\d{2}\/\d{4}$/.test(value))
    return value.split('/').reverse().join('-');
  if (input?.type === 'month' && type === 'cartaoValidade') {
    const [month, year] = value.split('/');
    return `20${year}-${month}`;
  }
  if (type === 'cartaoValidade' && input?.maxLength === 7)
    return value.replace(/\/(\d{2})$/, '/20$1');
  if (type === 'cartaoValidade' && input?.maxLength === 4) return value.replace('/', '');
  let adapted = value;
  if (!TEXTUAL.has(type) && (masked === false || input?.type === 'number')) adapted = alnum(value);
  const max = input?.maxLength ?? (el as HTMLTextAreaElement).maxLength ?? -1;
  if (max > 0 && adapted.length > max) {
    const stripped = alnum(adapted);
    adapted = stripped.length <= max && !TEXTUAL.has(type) ? stripped : adapted.slice(0, max);
  }
  return adapted;
}

export function chooseOption(
  select: HTMLSelectElement,
  value: string,
): HTMLOptionElement | undefined {
  const options = [...select.options].filter((option) => !option.disabled && option.value !== '');
  if (!options.length) return undefined;
  const wanted = [value, UF_NAMES[value.toUpperCase()] ?? ''].filter(Boolean).map(normalize);
  const textsOf = (option: HTMLOptionElement) => [normalize(option.value), normalize(option.text)];
  const isPrefixMatch = (text: string) =>
    !!text && wanted.some((target) => text.startsWith(target) || target.startsWith(text));
  return (
    options.find((option) => textsOf(option).some((text) => wanted.includes(text))) ??
    options.find((option) => textsOf(option).some(isPrefixMatch)) ??
    options[Math.floor(Math.random() * options.length)]
  );
}

export function fillElement(el: FieldEl, value: string): boolean {
  try {
    el.focus({ preventScroll: true });
    fire(el, 'focus', { bubbles: false });
    if (el.tagName === 'SELECT') {
      const option = chooseOption(el as HTMLSelectElement, value);
      if (!option) return false;
      setNativeValue(el, option.value);
      fire(el, 'input');
    } else {
      setNativeValue(el, value);
      fire(el, 'input', { inputType: 'insertFromPaste', data: value } as InputEventInit);
      if (alnum(el.value) !== alnum(value)) typeChars(el, alnum(value));
    }
    fire(el, 'change');
    el.blur();
    fire(el, 'blur', { bubbles: false });
    fire(el, 'focusout');
    return true;
  } catch {
    return false;
  }
}

export const checkRadio = (radio: HTMLInputElement) => radio.click();

export function chooseRadio(
  radios: HTMLInputElement[],
  value: string | undefined,
): HTMLInputElement | undefined {
  if (value) {
    const wanted = normalize(value);
    const labelOf = (radio: HTMLInputElement) =>
      normalize(
        `${radio.value} ${[...(radio.labels ?? [])].map((label) => label.textContent).join(' ')}`,
      );
    const matchesWord = (word: string) =>
      word === wanted ||
      word.startsWith(wanted) ||
      ((word.length === 1 || word.length >= 3) && wanted.startsWith(word));
    const hit = radios.find((radio) => labelOf(radio).split(' ').some(matchesWord));
    if (hit) return hit;
  }
  return radios[0];
}
