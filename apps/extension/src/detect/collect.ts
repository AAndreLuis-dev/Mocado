import type { FieldType } from '@mocado/core';
import { classify, normalize, type Classification, type Signals } from './classify';

export type FieldEl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export interface Detected extends Classification {
  el: FieldEl;
}

const SKIP_TYPES = new Set([
  'hidden',
  'submit',
  'button',
  'reset',
  'image',
  'file',
  'range',
  'color',
  'checkbox',
  'radio',
]);

/** Every element under `root`, descending into open shadow roots and same-origin iframes. */
export function* deepElements(root: Document | ShadowRoot | Element): Generator<Element> {
  const walker = (root.ownerDocument ?? (root as Document)).createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
  );
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node as Element;
    yield el;
    if (el.shadowRoot) yield* deepElements(el.shadowRoot);
    if (el.tagName === 'IFRAME' || el.tagName === 'FRAME') {
      let doc: Document | null;
      try {
        doc = (el as HTMLIFrameElement).contentDocument; // null when cross-origin
      } catch {
        doc = null;
      }
      if (doc?.documentElement) yield* deepElements(doc.documentElement);
    }
  }
}

const isField = (el: Element): el is FieldEl =>
  ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName);

const text = (el: Element | null | undefined) =>
  (el?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);

function labelText(el: FieldEl): string {
  const parts: string[] = [];
  for (const l of el.labels ?? []) parts.push(text(l));
  const ids = el.getAttribute('aria-labelledby');
  if (ids) for (const id of ids.split(/\s+/)) parts.push(text(el.ownerDocument.getElementById(id)));
  if (!parts.length) parts.push(text(el.closest('label')));
  return parts.filter(Boolean).join(' ');
}

/** Text right before the field when there is no <label>: previous sibling, or previous table cell. */
function nearbyText(el: FieldEl): string {
  const prev = el.previousElementSibling;
  if (prev && isField(prev)) return ''; // text before a previous field belongs to that field
  const own = prev ? text(prev) : '';
  if (own) return own;
  const parent = el.parentElement;
  const direct = [...(parent?.childNodes ?? [])]
    .filter((n) => n.nodeType === 3)
    .map((n) => n.textContent ?? '')
    .join(' ')
    .trim();
  if (direct) return direct.slice(0, 80);
  const cell = el.closest('td, th, dd');
  return text(cell?.previousElementSibling);
}

export function signalsOf(el: FieldEl): Signals {
  const tag = el.tagName.toLowerCase() as Signals['tag'];
  const input = tag === 'input' ? (el as HTMLInputElement) : null;
  return {
    tag,
    type: input?.type ?? undefined,
    autocomplete: el.getAttribute('autocomplete') ?? undefined,
    name: el.getAttribute('name') ?? undefined,
    id: el.id || undefined,
    label: labelText(el),
    ariaLabel: el.getAttribute('aria-label') ?? undefined,
    placeholder: el.getAttribute('placeholder') ?? undefined,
    title: el.getAttribute('title') ?? undefined,
    nearby: labelText(el) ? undefined : nearbyText(el),
    maxLength: input && input.maxLength > 0 ? input.maxLength : undefined,
    pattern: el.getAttribute('pattern') ?? undefined,
  };
}

/** Visible, enabled, editable — checkVisibility is missing in jsdom, so absent = visible. */
export function isFillable(el: FieldEl): boolean {
  if ((el as HTMLInputElement).disabled || (el as HTMLInputElement).readOnly) return false;
  if (el.tagName === 'INPUT' && SKIP_TYPES.has((el as HTMLInputElement).type)) return false;
  if (el.getAttribute('aria-hidden') === 'true') return false;
  const visible = (el as Element & { checkVisibility?: (o?: object) => boolean }).checkVisibility;
  return visible ? visible.call(el, { visibilityProperty: true, opacityProperty: false }) : true;
}

/**
 * Stable selector for per-domain overrides: #id (if it doesn't look generated), [name], else a
 * tag:nth-of-type path from the closest form (or body).
 */
export function stableSelector(el: Element): string {
  const tag = el.tagName.toLowerCase();
  if (el.id && !/\d{3,}|[:]|^(ember|react|mui|rc|headlessui|radix|v-)/i.test(el.id))
    return `#${CSS.escape(el.id)}`;
  const name = el.getAttribute('name');
  if (name) return `${tag}[name="${CSS.escape(name)}"]`;
  const path: string[] = [];
  for (
    let cur: Element | null = el;
    cur && cur.tagName !== 'FORM' && cur.tagName !== 'BODY';
    cur = cur.parentElement
  ) {
    const t = cur.tagName.toLowerCase();
    const idx =
      [...(cur.parentElement?.children ?? [])]
        .filter((c) => c.tagName === cur!.tagName)
        .indexOf(cur) + 1;
    path.unshift(`${t}:nth-of-type(${idx})`);
  }
  return path.join(' > ');
}

export interface CollectOptions {
  fillPasswords?: boolean;
  /** stableSelector → type, set by the user for this domain. */
  overrides?: Record<string, FieldType>;
}

export function collectFields(root: Document | Element, opts: CollectOptions = {}): Detected[] {
  const out: Detected[] = [];
  for (const el of deepElements(root)) {
    if (!isField(el) || !isFillable(el)) continue;
    const override = opts.overrides?.[stableSelector(el)];
    if (override) {
      out.push({ el, type: override, score: Infinity, masked: undefined });
      continue;
    }
    const signals = signalsOf(el);
    if (signals.type === 'password' && !opts.fillPasswords) continue;
    const c = classify(signals);
    if (!c) continue;
    if (c.type === 'senha' && !opts.fillPasswords) continue;
    out.push({ el, ...c });
  }
  return out;
}

/** Radio groups (by name) in the page, with a text describing the group. */
export function radioGroups(
  root: Document | Element,
): { name: string; radios: HTMLInputElement[]; hint: string }[] {
  const groups = new Map<string, HTMLInputElement[]>();
  for (const el of deepElements(root)) {
    if (el.tagName !== 'INPUT' || (el as HTMLInputElement).type !== 'radio') continue;
    const r = el as HTMLInputElement;
    if (r.disabled || !r.name) continue;
    groups.set(r.name, [...(groups.get(r.name) ?? []), r]);
  }
  return [...groups].map(([name, radios]) => ({
    name,
    radios,
    hint: normalize(
      `${name} ${text(radios[0]?.closest('fieldset')?.querySelector('legend'))} ${radios[0]?.closest('[role=radiogroup]')?.getAttribute('aria-label') ?? ''}`,
    ),
  }));
}
