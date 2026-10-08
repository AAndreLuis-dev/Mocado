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
    const [m, y] = value.split('/');
    return `20${y}-${m}`;
  }
  if (type === 'cartaoValidade' && input?.maxLength === 7)
    return value.replace(/\/(\d{2})$/, '/20$1');
  if (type === 'cartaoValidade' && input?.maxLength === 4) return value.replace('/', '');
  let v = value;
  if (!TEXTUAL.has(type) && (masked === false || input?.type === 'number')) v = alnum(value);
  const max = input?.maxLength ?? (el as HTMLTextAreaElement).maxLength ?? -1;
  if (max > 0 && v.length > max) {
    const stripped = alnum(v);
    v = stripped.length <= max && !TEXTUAL.has(type) ? stripped : v.slice(0, max);
  }
  return v;
}

export function chooseOption(
  select: HTMLSelectElement,
  value: string,
): HTMLOptionElement | undefined {
  const options = [...select.options].filter((o) => !o.disabled && o.value !== '');
  if (!options.length) return undefined;
  const wanted = [value, UF_NAMES[value.toUpperCase()] ?? ''].filter(Boolean).map(normalize);
  const norm = (o: HTMLOptionElement) => [normalize(o.value), normalize(o.text)];
  return (
    options.find((o) => norm(o).some((x) => wanted.includes(x))) ??
    options.find((o) =>
      norm(o).some((x) => wanted.some((w) => x && (x.startsWith(w) || w.startsWith(x)))),
    ) ??
    options[Math.floor(Math.random() * options.length)]
  );
}

export function fillElement(el: FieldEl, value: string): boolean {
  try {
    el.focus({ preventScroll: true });
    fire(el, 'focus', { bubbles: false });
    if (el.tagName === 'SELECT') {
      const opt = chooseOption(el as HTMLSelectElement, value);
      if (!opt) return false;
      setNativeValue(el, opt.value);
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
    const w = normalize(value);
    const labelOf = (r: HTMLInputElement) =>
      normalize(`${r.value} ${[...(r.labels ?? [])].map((l) => l.textContent).join(' ')}`);
    const hit = radios.find((r) => {
      const l = labelOf(r);
      return l
        .split(' ')
        .some(
          (tok) =>
            tok === w ||
            tok.startsWith(w) ||
            ((tok.length === 1 || tok.length >= 3) && w.startsWith(tok)),
        );
    });
    if (hit) return hit;
  }
  return radios[0];
}
