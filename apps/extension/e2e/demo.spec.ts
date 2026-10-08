import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from './fixtures';

// Frames for docs/demo.gif — run with: MOCADO_DEMO=1 pnpm --filter extension demo
test.skip(!process.env.MOCADO_DEMO, 'demo frames only on demand');

test('demo frames', async ({ context, sw, fill }) => {
  const out = resolve(import.meta.dirname, '../.output/demo');
  mkdirSync(out, { recursive: true });
  let n = 0;
  const shot = (p: import('@playwright/test').Page, caption: string) =>
    p.screenshot({ path: `${out}/${String(n++).padStart(2, '0')}__${caption}.png` });

  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/pj.html');
  await shot(page, 'Formulário React vazio');
  await fill(page);
  await shot(page, 'Ctrl+Shift+F → empresa coerente (CNPJ, IE da UF, endereço)');
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await shot(page, 'O estado do React reflete os valores');

  await page.goto('/mascaras.html');
  await fill(page);
  await shot(page, 'Respeita máscaras e campos só com números');

  const cpf = await (async () => {
    await page.goto('/pf.html');
    await fill(page);
    return page.locator('#cpf').inputValue();
  })();
  await shot(page, 'Cadastro PF preenchido');

  const extId = new URL(sw.url()).host;
  const hist = await context.newPage();
  await hist.setViewportSize({ width: 1280, height: 800 });
  await hist.goto(`chrome-extension://${extId}/history.html`);
  await shot(hist, 'Todo preenchimento vai para o histórico');
  await hist.getByRole('searchbox').fill(cpf);
  await hist.getByRole('button', { name: 'Ver dados' }).first().click();
  await shot(hist, 'Cole um CPF e descubra onde foi usado');

  const ui = await context.newPage();
  await ui.setViewportSize({ width: 380, height: 600 });
  await ui.goto(`chrome-extension://${extId}/popup.html`);
  await shot(ui, 'Popup: preencher, gerar avulso, reusar perfis');

  // Store screenshots and visual review (not in the GIF): popup, options and history in both themes.
  mkdirSync(`${out}/ui`, { recursive: true });
  for (const theme of ['light', 'dark'] as const) {
    await sw.evaluate(
      (t) =>
        (globalThis as unknown as { chrome: typeof browser }).chrome.storage.local.set({
          settings: { theme: t },
        }),
      theme,
    );
    const review = (name: string) => ui.screenshot({ path: `${out}/ui/${name}-${theme}.png` });
    await ui.setViewportSize({ width: 380, height: 600 });
    await ui.goto(`chrome-extension://${extId}/popup.html`);
    await review('popup');
    await ui.getByLabel('Gerador').selectOption('pessoa');
    await ui.waitForTimeout(300); // let the stamp land
    await review('popup-pessoa');
    await ui.setViewportSize({ width: 1280, height: 800 });
    for (const tab of ['history', 'options', 'overrides']) {
      await ui.goto(`chrome-extension://${extId}/options.html#${tab}`);
      await ui.waitForTimeout(100);
      await review(tab);
    }
  }
});
