import type { Profile } from '@mocado/core';
import type { FillReport, PageContext } from '../application/ports';
import type { MocadoApi } from './api';
import { classify } from './detect/classify';
import { collectFields, signalsOf, stableSelector, type Detected } from './detect/collect';
import { fillChoices } from './fill/choices';
import { adapt, fillElement } from './fill/fill';
import { createFocusTracker } from './fill/focus';

const EMPTY: FillReport = { filled: 0, fields: [] };

export function createPageApi(doc: Document = document): MocadoApi {
  const hostname = doc.location?.hostname ?? '';
  const filled = new WeakSet<Element>();
  const focusedField = createFocusTracker(doc);
  let observer: MutationObserver | null = null;
  let current: { profile: Profile; ctx: PageContext } | null = null;

  const detect = (ctx: PageContext): Detected[] =>
    collectFields(doc, { fillPasswords: ctx.fillPasswords, overrides: ctx.overrides[hostname] });

  function fillDetected(list: Detected[], profile: Profile, ctx: PageContext, onlyNew: boolean) {
    const report: FillReport = { filled: 0, fields: [] };
    for (const d of list) {
      if (onlyNew && (filled.has(d.el) || d.el.value !== '')) continue;
      const value = profile[d.type];
      if (!value) continue;
      const v = adapt(value, d.type, d.el, d.masked ?? ctx.masked);
      if (fillElement(d.el, v)) {
        filled.add(d.el);
        report.filled++;
        report.fields.push({ type: d.type, value: v });
      }
    }
    return report;
  }

  function fillAll(profile: Profile, ctx: PageContext, onlyNew: boolean): FillReport {
    const list = detect(ctx);
    const report = fillDetected(list, profile, ctx, onlyNew);
    report.filled += fillChoices(doc, profile, new Set(list.map((d) => d.el)), filled);
    return report;
  }

  function observe() {
    if (observer) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => current && fillAll(current.profile, current.ctx, true), 250);
    });
    observer.observe(doc.documentElement, { childList: true, subtree: true });
  }

  return {
    async scan(ctx) {
      const list = detect(ctx);
      const focused = focusedField();
      const focusedType = focused
        ? (list.find((d) => d.el === focused)?.type ?? classify(signalsOf(focused))?.type ?? null)
        : null;
      return {
        url: doc.location?.href ?? '',
        hostname,
        title: doc.title,
        types: [...new Set(list.map((d) => d.type))],
        focused: focusedType,
      };
    },

    async fill(profile, ctx) {
      const report = fillAll(profile, ctx, false);
      current = { profile, ctx };
      if (ctx.observe) observe();
      return report;
    },

    async fillFocused(value, type, ctx) {
      const el = focusedField();
      if (!el) return EMPTY;
      const v = adapt(value, type, el, classify(signalsOf(el))?.masked ?? ctx.masked);
      return fillElement(el, v) ? { filled: 1, fields: [{ type, value: v }] } : EMPTY;
    },

    async focusedSelector() {
      const el = focusedField();
      return el ? { hostname, selector: stableSelector(el) } : null;
    },
  };
}
