import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from './fixtures';

// Frames for docs/demo.gif — run with: MASSA_DEMO=1 pnpm --filter extension demo
test.skip(!process.env.MASSA_DEMO, 'demo frames only on demand');

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
});
