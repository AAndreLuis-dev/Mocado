import type { Perfil } from '@mocado/core';
import { deepElements, isFillable, radioGroups, type FieldEl } from '../detect/collect';
import { checkRadio, chooseOption, chooseRadio, fillElement } from './fill';

const SEXO = /\b(sexo|genero|gender|sex)\b/;

export function fillChoices(
  root: Document,
  perfil: Perfil,
  known: ReadonlySet<Element>,
  done: WeakSet<Element>,
): number {
  let n = 0;
  for (const group of radioGroups(root)) {
    if (group.radios.some((r) => r.checked || done.has(r))) continue;
    const radio = chooseRadio(group.radios, SEXO.test(group.hint) ? perfil.sexo : undefined);
    if (radio) {
      checkRadio(radio);
      group.radios.forEach((r) => done.add(r));
      n++;
    }
  }
  for (const el of deepElements(root)) {
    if (done.has(el) || known.has(el)) continue;
    if (el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'checkbox') {
      const cb = el as HTMLInputElement;
      if (cb.required && !cb.checked && !cb.disabled) {
        checkRadio(cb);
        done.add(cb);
        n++;
      }
    } else if (el.tagName === 'SELECT' && (el as HTMLSelectElement).value === '') {
      const select = el as HTMLSelectElement;
      const opt = isFillable(select as FieldEl) ? chooseOption(select, '') : undefined;
      if (opt && fillElement(select, opt.value)) {
        done.add(select);
        n++;
      }
    }
  }
  return n;
}
