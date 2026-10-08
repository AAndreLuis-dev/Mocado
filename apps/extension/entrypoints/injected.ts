import type { FieldType, Perfil } from '@mocado/core';
import {
  collectFields,
  deepElements,
  isFillable,
  radioGroups,
  stableSelector,
  type Detected,
  type FieldEl,
} from '@/src/detect/collect';
import { classify } from '@/src/detect/classify';
import { signalsOf } from '@/src/detect/collect';
import { adapt, checkRadio, chooseOption, chooseRadio, fillElement } from '@/src/fill/fill';
import { getSettings, isBlocked, type Settings } from '@/src/settings';
import { getOverrides, setOverride } from '@/src/overrides';
import type { FillReport, MocadoApi } from '@/src/content-api';

// Injected on demand (activeTab) — never declared in the manifest, so it never runs on its own.
export default defineUnlistedScript(() => {
  const g = globalThis as typeof globalThis & { __mocado?: MocadoApi };
  if (g.__mocado) return; // already injected in this tab

  const filled = new WeakSet<Element>();
  let lastContextTarget: Element | null = null;
  let observer: MutationObserver | null = null;
  let current: { perfil: Perfil; settings: Settings } | null = null;

  // Right-click target for "Gerar X aqui" (activeElement is usually the same, this is the fallback).
  document.addEventListener(
    'contextmenu',
    (e) => (lastContextTarget = e.composedPath()[0] as Element),
    true,
  );

  const hostname = location.hostname;

  async function detect(settings: Settings): Promise<Detected[]> {
    const overrides = (await getOverrides())[hostname];
    return collectFields(document, { fillPasswords: settings.fillPasswords, overrides });
  }

  /** The focused field, looking through shadow roots and same-origin iframes. */
  function focusedField(): FieldEl | null {
    let el: Element | null = document.activeElement;
    for (;;) {
      if (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
      else if (el?.tagName === 'IFRAME') {
        try {
          el = (el as HTMLIFrameElement).contentDocument?.activeElement ?? null;
        } catch {
          break;
        }
      } else break;
    }
    const isField = (e: Element | null): e is FieldEl =>
      !!e && ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.tagName);
    if (isField(el)) return el;
    return isField(lastContextTarget) ? lastContextTarget : null;
  }

  function fillDetected(
    list: Detected[],
    perfil: Perfil,
    settings: Settings,
    onlyEmpty: boolean,
  ): FillReport {
    const report: FillReport = { filled: 0, fields: [] };
    for (const d of list) {
      if (onlyEmpty && (filled.has(d.el) || d.el.value !== '')) continue;
      const value = perfil[d.type];
      if (!value) continue;
      const v = adapt(value, d.type, d.el, d.masked ?? settings.masked);
      if (fillElement(d.el, v)) {
        filled.add(d.el);
        report.filled++;
        report.fields.push({ type: d.type, value: v });
      }
    }
    return report;
  }

  /** Radios (sexo by value, others: first option if none checked), required checkboxes, empty selects. */
  function fillChoices(detected: Detected[], perfil: Perfil, onlyNew: boolean): number {
    let n = 0;
    for (const group of radioGroups(document)) {
      if (
        group.radios.some((r) => r.checked) ||
        (onlyNew && group.radios.some((r) => filled.has(r)))
      )
        continue;
      const isSexo = /\b(sexo|genero|gender|sex)\b/.test(group.hint);
      const radio = chooseRadio(group.radios, isSexo ? perfil.sexo : undefined);
      if (radio) {
        checkRadio(radio);
        group.radios.forEach((r) => filled.add(r));
        n++;
      }
    }
    const known = new Set<Element>(detected.map((d) => d.el));
    for (const el of deepElements(document)) {
      if (filled.has(el) || known.has(el)) continue;
      if (el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'checkbox') {
        const cb = el as HTMLInputElement;
        if (cb.required && !cb.checked && !cb.disabled) {
          checkRadio(cb);
          filled.add(cb);
          n++;
        }
      } else if (
        el.tagName === 'SELECT' &&
        (el as HTMLSelectElement).value === '' &&
        isFillable(el as FieldEl)
      ) {
        const opt = chooseOption(el as HTMLSelectElement, '');
        if (opt && fillElement(el as FieldEl, opt.value)) {
          filled.add(el);
          n++;
        }
      }
    }
    return n;
  }

  function observe() {
    if (observer) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        if (!current) return;
        const list = await detect(current.settings);
        fillDetected(list, current.perfil, current.settings, true);
        fillChoices(list, current.perfil, true);
      }, 250);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  const api: MocadoApi = {
    async scan() {
      const settings = await getSettings();
      const blocked = isBlocked(hostname, settings.blockedDomains);
      const list = blocked ? [] : await detect(settings);
      const focused = focusedField();
      const focusedType = focused
        ? (list.find((d) => d.el === focused)?.type ?? classify(signalsOf(focused))?.type ?? null)
        : null;
      return {
        url: location.href,
        hostname,
        title: document.title,
        blocked,
        types: [...new Set(list.map((d) => d.type))],
        focused: focusedType,
      };
    },

    async fill(perfil, opts = {}) {
      const settings = await getSettings();
      if (isBlocked(hostname, settings.blockedDomains)) return { filled: 0, fields: [] };
      let list = await detect(settings);
      if (opts.focusedOnly) {
        const f = focusedField();
        list = list.filter((d) => d.el === f);
        return fillDetected(list, perfil, settings, false);
      }
      const report = fillDetected(list, perfil, settings, false);
      report.filled += fillChoices(list, perfil, false);
      current = { perfil, settings };
      if (settings.observe) observe();
      return report;
    },

    async fillFocused(value, type) {
      const el = focusedField();
      const settings = await getSettings();
      if (!el || isBlocked(hostname, settings.blockedDomains)) return { filled: 0, fields: [] };
      const masked = classify(signalsOf(el))?.masked;
      const v = adapt(value, type, el, masked ?? settings.masked);
      return fillElement(el, v)
        ? { filled: 1, fields: [{ type, value: v }] }
        : { filled: 0, fields: [] };
    },

    async markFocused(type: FieldType) {
      const el = focusedField();
      if (!el) return false;
      await setOverride(hostname, stableSelector(el), type);
      return true;
    },
  };

  g.__mocado = api;
});
