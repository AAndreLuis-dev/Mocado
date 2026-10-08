import type { Profile } from '@mocado/core';
import { deepElements, isFillable, radioGroups, type FieldEl } from '../detect/collect';
import { checkRadio, chooseOption, chooseRadio, fillElement } from './fill';

const SEX_HINT = /\b(sexo|genero|gender|sex)\b/;

export function fillChoices(
  root: Document,
  profile: Profile,
  known: ReadonlySet<Element>,
  done: WeakSet<Element>,
): number {
  let checked = 0;
  for (const group of radioGroups(root)) {
    if (group.radios.some((radio) => radio.checked || done.has(radio))) continue;
    const radio = chooseRadio(group.radios, SEX_HINT.test(group.hint) ? profile.sexo : undefined);
    if (radio) {
      checkRadio(radio);
      group.radios.forEach((radio) => done.add(radio));
      checked++;
    }
  }
  for (const el of deepElements(root)) {
    if (done.has(el) || known.has(el)) continue;
    if (el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'checkbox') {
      const checkbox = el as HTMLInputElement;
      if (checkbox.required && !checkbox.checked && !checkbox.disabled) {
        checkRadio(checkbox);
        done.add(checkbox);
        checked++;
      }
    } else if (el.tagName === 'SELECT' && (el as HTMLSelectElement).value === '') {
      const select = el as HTMLSelectElement;
      const opt = isFillable(select as FieldEl) ? chooseOption(select, '') : undefined;
      if (opt && fillElement(select, opt.value)) {
        done.add(select);
        checked++;
      }
    }
  }
  return checked;
}
