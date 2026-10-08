import { cep, cepUF, cnpj, cpf, ie, rg, telefone, type UF } from '@mocado/core';
import { expect, test } from './fixtures';

const val = (page: import('@playwright/test').Page, sel: string) => page.locator(sel).inputValue();

test('1. HTML puro (PF)', async ({ context, fill, pageErrors }) => {
  const page = await context.newPage();
  await page.goto('/pf.html');
  const res = await fill(page);
  expect(res.ok).toBe(true);
  expect(res.tipo).toBe('pessoa');

  expect(await val(page, '#nome')).toMatch(/^\S+ \S+ \S+$/);
  const c = await val(page, '#cpf');
  expect(c).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
  expect(cpf.validate(c)).toBe(true);
  expect(rg.validate(await val(page, '#rg'))).toBe(true);
  expect(await val(page, '#nasc')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(await page.locator('input[name=sexo]:checked').count()).toBe(1);
  expect(await val(page, '#email')).toMatch(/^[a-z0-9.]+@example\.(com|net|org)$/);
  expect(telefone.validate(await val(page, '#cel'), { tipo: 'celular' })).toBe(true);
  const uf = (await val(page, '#uf')) as UF;
  expect(uf).toMatch(/^[A-Z]{2}$/);
  expect(cepUF(await val(page, '#cep'))).toBe(uf);
  for (const id of ['#log', '#num', '#bairro', '#cidade']) expect(await val(page, id)).not.toBe('');
  expect(await val(page, '#senha')).toBe('');
  expect(await page.locator('input[name=termos]').isChecked()).toBe(true);
  expect(pageErrors).toEqual([]);
});

test('2. React controlado (PJ): state reflects the values', async ({
  context,
  fill,
  pageErrors,
}) => {
  const page = await context.newPage();
  await page.goto('/pj.html');
  const res = await fill(page);
  expect(res.ok).toBe(true);
  expect(res.tipo).toBe('empresa');

  const state = JSON.parse((await page.getByTestId('state').textContent())!) as Record<
    string,
    string
  >;
  for (const [k, v] of Object.entries(state)) {
    expect(v, k).not.toBe('');
    expect(await page.locator(`[name=${k}]`).inputValue()).toBe(v);
  }
  expect(cnpj.validate(state.cnpj!)).toBe(true);
  expect(cpf.validate(state.cpfResponsavel!)).toBe(true);
  expect(ie.validate(state.inscricaoEstadual!, { uf: state.uf as UF })).toBe(true);
  expect(cepUF(state.cep!)).toBe(state.uf);
  expect(state.dataAbertura).toMatch(/^\d{4}-\d{2}-\d{2}$/);

  await page.locator('[name=numero]').focus();
  await page.keyboard.type('0');
  const after = JSON.parse((await page.getByTestId('state').textContent())!) as Record<
    string,
    string
  >;
  expect(after.cnpj).toBe(state.cnpj);
  expect(after.numero).toBe(state.numero + '0');
  expect(pageErrors).toEqual([]);
});

test('3. Máscaras (IMask)', async ({ context, fill, pageErrors }) => {
  const page = await context.newPage();
  await page.goto('/mascaras.html');
  expect((await fill(page)).ok).toBe(true);

  const c = await val(page, '[name=cpf]');
  expect(c).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
  expect(cpf.validate(c)).toBe(true);
  expect(await val(page, '[name=cnpj]')).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
  expect(cep.validate(await val(page, '[name=cep]'))).toBe(true);
  expect(await val(page, '[name=cep]')).toMatch(/^\d{5}-\d{3}$/);
  expect(await val(page, '[name=celular]')).toMatch(/^\(\d{2}\) 9\d{4}-\d{4}$/);
  const raw = await val(page, '[name=cpf_numeros]');
  expect(raw).toMatch(/^\d{11}$/);
  expect(cpf.validate(raw)).toBe(true);
  expect(pageErrors).toEqual([]);
});

test('4. SPA/modal + shadow DOM + iframe', async ({ context, fill, pageErrors }) => {
  const page = await context.newPage();
  await page.goto('/spa.html');
  const res = await fill(page);
  expect(res.ok).toBe(true);

  expect(await val(page, '[name=atendente_nome]')).not.toBe('');
  expect(await page.locator('mocado-email').locator('input').inputValue()).toMatch(/@/);
  const frameCnpj = await page.frameLocator('#frame').locator('[name=doc_cnpj]').inputValue();
  expect(cnpj.validate(frameCnpj)).toBe(true);

  await page.click('#novo');
  await expect(page.locator('[name=cliente_cpf]')).not.toHaveValue('', { timeout: 5000 });
  expect(cpf.validate(await val(page, '[name=cliente_cpf]'))).toBe(true);
  expect(await val(page, '[name=cliente_nome]')).toBe(await val(page, '[name=atendente_nome]'));
  expect(telefone.validate(await val(page, '[name=cliente_celular]'))).toBe(true);
  expect(pageErrors).toEqual([]);
});

test('5. Nomes ruins: label/placeholder/aria/texto próximo', async ({
  context,
  fill,
  pageErrors,
}) => {
  const page = await context.newPage();
  await page.goto('/nomes-ruins.html');
  expect((await fill(page)).ok).toBe(true);

  expect(await val(page, '[name=campo1]')).toMatch(/^\S+ \S+ \S+$/);
  expect(cpf.validate(await val(page, '[name=campo2]'))).toBe(true);
  expect(cpf.validate(await val(page, '[name=txtDoc]'))).toBe(true);
  expect(await val(page, '[name=campo4]')).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  expect(cep.validate(await val(page, '[name=campo5]'))).toBe(true);
  expect(await val(page, '[name=campo6]')).toMatch(/@example\./);
  expect(telefone.validate(await val(page, '[name=campo7]'), { tipo: 'celular' })).toBe(true);
  expect(await val(page, '[name=campo8]')).toBe('');
  expect(pageErrors).toEqual([]);
});
