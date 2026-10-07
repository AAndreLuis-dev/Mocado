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
  fill: async ({ sw }, use) => {
    await use(async (page) => {
      await page.bringToFront(); // several tabs may share the URL: target the active one
      return sw.evaluate(async (url) => {
        const g = globalThis as unknown as {
          chrome: typeof browser;
          massaFillTab: (id: number) => Promise<unknown>;
        };
        const [tab] = await g.chrome.tabs.query({ url, active: true });
        return g.massaFillTab(tab!.id!);
      }, page.url().split('#')[0]!) as Promise<FillOutcome>;
    });
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
