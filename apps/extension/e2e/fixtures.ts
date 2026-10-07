import {
  test as base,
  chromium,
  expect,
  type BrowserContext,
  type Page,
  type Worker,
} from '@playwright/test';
import { resolve } from 'node:path';
import type { FillOutcome } from '../src/background/actions';

const EXT = resolve(import.meta.dirname, '../.output/e2e/chrome-mv3');

export const test = base.extend<{
  context: BrowserContext;
  sw: Worker;
  /** Triggers a whole-form fill on `page` the same way the shortcut/popup do. */
  fill: (page: Page) => Promise<FillOutcome>;
  /**
   * Calls a background hook (`globalThis.massa[method]`) for `page`'s tab: the strings '$TAB_ID'
   * and '$TAB' in `args` are replaced by the tab id / tab object (shortcuts and menus need them).
   */
  bg: (page: Page, method: string, ...args: unknown[]) => Promise<FillOutcome | undefined>;
  /** Console errors and uncaught exceptions raised by the page. */
  pageErrors: string[];
}>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium', // new headless supports extensions
      locale: 'pt-BR',
      env: { ...process.env, LANG: 'pt_BR.UTF-8', LANGUAGE: 'pt_BR' }, // chrome.i18n follows the UI locale
      args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--lang=pt-BR'],
    });
    await use(context);
    await context.close();
  },
  sw: async ({ context }, use) => {
    const sw = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
    await use(sw);
  },
  bg: async ({ sw }, use) => {
    await use(async (page, method, ...args) => {
      await page.bringToFront(); // several tabs may share the URL: target the active one
      return sw.evaluate(
        async ({ url, method, args }) => {
          const g = globalThis as unknown as {
            chrome: typeof browser;
            massa: Record<string, (...a: unknown[]) => Promise<unknown>>;
          };
          const [tab] = await g.chrome.tabs.query({ url, active: true });
          const resolved = args.map((a) => (a === '$TAB_ID' ? tab!.id : a === '$TAB' ? tab : a));
          return g.massa[method]!(...resolved);
        },
        { url: page.url().split('#')[0]!, method, args },
      ) as Promise<FillOutcome | undefined>;
    });
  },
  fill: async ({ bg }, use) => {
    await use((page) => bg(page, 'fillTab', '$TAB_ID') as Promise<FillOutcome>);
  },
  pageErrors: async ({ context }, use) => {
    const errors: string[] = [];
    context.on('page', (page) => {
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      page.on('pageerror', (e) => errors.push(e.message));
    });
    await use(errors);
  },
});

export { expect };
