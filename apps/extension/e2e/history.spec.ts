import { readFileSync } from 'node:fs';
import { expect, test } from './fixtures';

test('histórico: busca pelo CPF, reuso, export/import', async ({
  context,
  sw,
  fill,
  pageErrors,
}) => {
  const extId = new URL(sw.url()).host;
  const form = await context.newPage();
  await form.goto('/pf.html');
  const first = await fill(form);
  expect(first.recordId).toBeTruthy();
  const cpf = await form.locator('#cpf').inputValue();

  const hist = await context.newPage();
  await hist.goto(`chrome-extension://${extId}/history.html`);
  await expect(hist.getByTestId('record')).toHaveCount(1);

  // paste the CPF without mask → still found
  await hist.getByRole('searchbox').fill(cpf.replace(/\D/g, ''));
  await expect(hist.getByTestId('record')).toHaveCount(1);
  await hist.getByRole('searchbox').fill('99999999999');
  await expect(hist.getByTestId('record')).toHaveCount(0);
  await hist.getByRole('searchbox').fill('');

  // label + favorite persist
  await hist.getByLabel('Rótulo do perfil').fill('admin teste');
  await hist.getByLabel('Rótulo do perfil').blur();
  await hist.getByRole('button', { name: 'Favoritar' }).click();
  await expect(hist.getByRole('button', { name: 'Remover dos favoritos' })).toBeVisible();

  // pin for reuse, then fill a fresh form → same data, same record gets a 2nd use
  await hist.getByRole('button', { name: 'Reusar este perfil' }).click();
  await expect(hist.getByText(/Fixado/)).toBeVisible();
  const again = await context.newPage();
  await again.goto('/pf.html');
  const second = await fill(again);
  expect(second.recordId).toBe(first.recordId);
  expect(await again.locator('#cpf').inputValue()).toBe(cpf);
  expect(await again.locator('#nome').inputValue()).toBe(await form.locator('#nome').inputValue());
  await expect(hist.getByText(/Fixado/)).toHaveCount(0); // one-shot pin
  await expect(hist.getByTestId('record')).toHaveCount(1);
  await expect(hist.getByText(/Usado em/)).toContainText(/localhost.*localhost/);

  // a third fill without pin generates a new profile
  const third = await context.newPage();
  await third.goto('/pf.html');
  expect((await fill(third)).recordId).not.toBe(first.recordId);
  await expect(hist.getByTestId('record')).toHaveCount(2);

  // export → clear → import
  const [download] = await Promise.all([
    hist.waitForEvent('download'),
    hist.getByRole('button', { name: 'Exportar JSON' }).click(),
  ]);
  const file = await download.path();
  const dumped = JSON.parse(readFileSync(file, 'utf8'));
  expect(dumped.records).toHaveLength(2);
  await sw.evaluate(() =>
    (globalThis as unknown as { chrome: typeof browser }).chrome.storage.local.clear(),
  );
  await expect(hist.getByText('Nenhum perfil ainda', { exact: false })).toBeVisible();
  await hist.locator('input[type=file]').setInputFiles(file);
  await expect(hist.getByRole('status')).toContainText('2 perfis importados');
  await expect(hist.getByTestId('record')).toHaveCount(2);
  await expect(hist.getByLabel('Rótulo do perfil').first()).toHaveValue(/admin teste|^$/);
  await hist.getByRole('searchbox').fill('admin');
  await expect(hist.getByTestId('record')).toHaveCount(1);

  expect(pageErrors).toEqual([]);
});
