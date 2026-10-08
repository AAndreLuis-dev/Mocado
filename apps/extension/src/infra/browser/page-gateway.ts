import type { PageGateway } from '../../application/ports';
import type { MocadoApi } from '../../content/api';

type Method = keyof MocadoApi;
type Args<M extends Method> = Parameters<MocadoApi[M]>;
type Ret<M extends Method> = Awaited<ReturnType<MocadoApi[M]>>;

/** Injects the content script (idempotent) and calls one of its methods in the tab's main frame. */
async function call<M extends Method>(tabId: number, method: M, ...args: Args<M>): Promise<Ret<M>> {
  await browser.scripting.executeScript({ target: { tabId }, files: ['/injected.js'] });
  const [res] = await browser.scripting.executeScript({
    target: { tabId },
    func: (m: string, a: unknown[]) =>
      (globalThis as unknown as { __mocado: Record<string, (...x: unknown[]) => unknown> })
        .__mocado[m]!(...a),
    args: [method, args],
  });
  return res?.result as Ret<M>;
}

/** The page port over scripting.executeScript (activeTab grants access after a user gesture). */
export const scriptingPageGateway: PageGateway = {
  scan: (tabId, ctx) => call(tabId, 'scan', ctx),
  fill: (tabId, perfil, ctx) => call(tabId, 'fill', perfil, ctx),
  fillFocused: (tabId, value, type, ctx) => call(tabId, 'fillFocused', value, type, ctx),
  focusedSelector: (tabId) => call(tabId, 'focusedSelector'),
};
