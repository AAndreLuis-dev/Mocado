import { isField, type FieldEl } from '../detect/collect';

/**
 * Tracks the field the user is acting on: the focused one (through open shadow roots and
 * same-origin iframes), else the last right-clicked one ("Gerar X aqui" on an unfocused field).
 */
export function createFocusTracker(doc: Document) {
  let lastContextTarget: Element | null = null;
  doc.addEventListener(
    'contextmenu',
    (e) => (lastContextTarget = e.composedPath()[0] as Element),
    true,
  );

  return function focusedField(): FieldEl | null {
    let el: Element | null = doc.activeElement;
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
    if (el && isField(el)) return el;
    return lastContextTarget && isField(lastContextTarget) ? lastContextTarget : null;
  };
}
