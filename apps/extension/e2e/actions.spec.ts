import { cnpj, cpf } from '@massa/core';
import { expect, test } from './fixtures';

const setStorage = (sw: import('@playwright/test').Worker, data: Record<string, unknown>) =>
  sw.evaluate(
    (d) => (globalThis as unknown as { chrome: typeof browser }).chrome.storage.local.set(d),
    data,
  );

test('menu "Marcar este campo como" saves a per-domain override', async ({
  context,
  sw,
  bg,
  pageErrors,
}) => {
  const page = await context.newPage();
  await page.goto('/nomes-ruins.html');
  await page.locator('[name=campo8]').focus();
  await bg(page, 'onMenuClick', { menuItemId: 'mark:cpf' }, '$TAB');
  expect(cpf.validate(await page.locator('[name=campo8]').inputValue())).toBe(true);

  // after reload, a whole-form fill treats campo8 as CPF
  await page.reload();
  await bg(page, 'fillTab', '$TAB_ID');
  expect(cpf.validate(await page.locator('[name=campo8]').inputValue())).toBe(true);

  // listed (and removable) in the options "Campos corrigidos" tab
  const extId = new URL(sw.url()).host;
  const opts = await context.newPage();
  await opts.goto(`chrome-extension://${extId}/options.html#overrides`);
  await expect(opts.getByRole('heading', { name: 'localhost' })).toBeVisible();
  await expect(opts.getByTestId('override')).toHaveCount(1);
  await opts.getByRole('button', { name: 'Remover', exact: true }).click();
  await expect(opts.getByText('Nenhuma correção salva.')).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('shortcut "fill-field" fills only the focused field; "Gerar CNPJ aqui" forces a type', async ({
  context,
  bg,
}) => {
  const page = await context.newPage();
  await page.goto('/pf.html');
  await page.locator('#cpf').focus();
  const res = await bg(page, 'onCommand', 'fill-field', '$TAB');
  expect(res?.filled).toBe(1);
  expect(cpf.validate(await page.locator('#cpf').inputValue())).toBe(true);
  expect(await page.locator('#nome').inputValue()).toBe('');
  expect(await page.locator('#email').inputValue()).toBe('');

  await page.locator('#rg').focus();
  await bg(page, 'onMenuClick', { menuItemId: 'gen:cnpj' }, '$TAB');
  expect(cnpj.validate(await page.locator('#rg').inputValue())).toBe(true);

  // shortcut "fill-form" = whole form
  await bg(page, 'onCommand', 'fill-form', '$TAB');
  expect(await page.locator('#nome').inputValue()).not.toBe('');
});

test('blocked domain: nothing is filled', async ({ context, sw, fill }) => {
  await setStorage(sw, { settings: { blockedDomains: ['localhost'] } });
  const page = await context.newPage();
  await page.goto('/pf.html');
  const res = await fill(page);
  expect(res).toMatchObject({ ok: false, error: 'blocked' });
  expect(await page.locator('#nome').inputValue()).toBe('');
});

test('options: preferences are saved and used (UF, unmasked, passwords)', async ({
  context,
  sw,
  fill,
}) => {
  const extId = new URL(sw.url()).host;
  const opts = await context.newPage();
  await opts.goto(`chrome-extension://${extId}/options.html`);
  await opts.getByLabel('UF preferida').selectOption('PR');
  await opts.getByLabel('Usar máscara por padrão').uncheck();
  await opts.getByLabel('Preencher campos de senha').check();
  await opts.getByLabel('Tema').selectOption('dark');
  await expect(opts.locator('html')).toHaveClass(/dark/);
  await expect(opts.getByRole('status')).toHaveText('Salvo.');

  const page = await context.newPage();
  await page.goto('/pf.html');
  await fill(page);
  expect(await page.locator('#uf').inputValue()).toBe('PR');
  expect(await page.locator('#cep').inputValue()).toMatch(/^8\d{7}$/); // PR range, no mask
  expect(await page.locator('#cpf').inputValue()).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/); // maxlength=14 still wins
  expect(await page.locator('#senha').inputValue()).not.toBe('');
});
