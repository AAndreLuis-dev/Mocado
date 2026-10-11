import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { makeRecord } from '../../../test/records';
import { LocalHistoryRepository } from '../../infra/storage/history-repository';
import { overridesStore, pinStore, settingsStore } from '../../infra/storage/stores';
import { ManageApp } from './App';

const repo = new LocalHistoryRepository();

beforeEach(() => {
  fakeBrowser.reset();
  location.hash = '';
});

describe('manage page tabs', () => {
  test('opens the initial tab and follows the hash', async () => {
    render(<ManageApp initial="history" />);
    expect(screen.getByRole('tab', { name: 'Histórico' }).getAttribute('aria-selected')).toBe(
      'true',
    );
    location.hash = '#overrides';
    dispatchEvent(new HashChangeEvent('hashchange'));
    expect(await screen.findByText('Nenhuma correção salva.')).toBeTruthy();
  });

  test('an unknown hash falls back to the initial tab', () => {
    location.hash = '#nope';
    render(<ManageApp initial="options" />);
    expect(screen.getByRole('tab', { name: 'Opções' }).getAttribute('aria-selected')).toBe('true');
  });
});

describe('history', () => {
  test('lists records, searches by unmasked CPF and filters favorites', async () => {
    const user = userEvent.setup();
    await repo.save(makeRecord({ id: 'a' }));
    await repo.save(
      makeRecord({ id: 'b', values: { nome: 'Maria Souza', cpf: '529.982.247-25' } }),
    );
    render(<ManageApp initial="history" />);
    expect(await screen.findByText('2 perfis')).toBeTruthy();

    await user.type(screen.getByRole('searchbox'), '52998224725');
    expect(await screen.findByText('1 perfil')).toBeTruthy();
    expect(screen.getByText('Maria Souza')).toBeTruthy();

    await user.clear(screen.getByRole('searchbox'));
    await user.click(screen.getByRole('checkbox', { name: 'Só favoritos' }));
    expect(await screen.findByText('Nada encontrado.')).toBeTruthy();
  });

  test('favorite, label, reuse and delete a record', async () => {
    const user = userEvent.setup();
    await repo.save(makeRecord({ id: 'a' }));
    render(<ManageApp initial="history" />);
    const record = await screen.findByTestId('record');

    await user.click(within(record).getByRole('button', { name: 'Favoritar' }));
    await vi.waitFor(async () => expect((await repo.get('a'))?.favorite).toBe(true));

    await user.type(within(record).getByLabelText('Rótulo do perfil'), 'admin teste');
    await user.tab();
    await vi.waitFor(async () => expect((await repo.get('a'))?.label).toBe('admin teste'));
    await vi.waitFor(() => expect(screen.getByTestId('record')).not.toBe(record));

    await user.click(screen.getByRole('button', { name: 'Reusar este perfil' }));
    await vi.waitFor(async () => expect(await pinStore.get()).toBe('a'));
    expect(await screen.findByText(/O próximo preenchimento/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Excluir' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));
    expect(await screen.findByText(/Nenhum perfil ainda/)).toBeTruthy();
    expect(await repo.all()).toEqual([]);
  });

  test('details show every value with a copy button', async () => {
    const user = userEvent.setup();
    await repo.save(makeRecord({ id: 'a' }));
    render(<ManageApp initial="history" />);
    await user.click(await screen.findByRole('button', { name: 'Ver dados' }));
    expect(screen.getByRole('button', { name: 'Ocultar dados' })).toBeTruthy();
    expect(screen.getAllByText('joao@example.com').length).toBeGreaterThan(0);
  });

  test('imports a valid file and rejects an invalid one', async () => {
    const user = userEvent.setup();
    render(<ManageApp initial="history" />);
    const input = document.querySelector<HTMLInputElement>('input[type=file]')!;
    const file = (body: string) => new File([body], 'h.json', { type: 'application/json' });

    await user.upload(input, file('not json'));
    expect(await screen.findByText('Arquivo inválido.')).toBeTruthy();

    await user.upload(input, file(JSON.stringify({ records: [makeRecord({ id: 'x' })] })));
    expect(await screen.findByText('1 perfil importado.')).toBeTruthy();
    expect(await screen.findByText('1 perfil')).toBeTruthy();
  });
});

describe('options', () => {
  test('each change is saved right away', async () => {
    const user = userEvent.setup();
    render(<ManageApp initial="options" />);
    await user.selectOptions(await screen.findByLabelText('UF preferida'), 'BA');
    await user.click(screen.getByRole('checkbox', { name: /máscara por padrão/ }));
    await user.click(screen.getByRole('radio', { name: 'Escuro' }));
    await user.type(screen.getByLabelText('Domínios onde o Mocado nunca atua'), 'Banco.com.br');
    await user.tab();
    await vi.waitFor(async () =>
      expect(await settingsStore.get()).toMatchObject({
        uf: 'BA',
        masked: false,
        theme: 'dark',
        blockedDomains: ['banco.com.br'],
      }),
    );
    expect(screen.getByRole('status').textContent).toBe('Salvo.');
  });

  test('lists the extension shortcuts', async () => {
    render(<ManageApp initial="options" />);
    expect(await screen.findByText('Preencher o formulário inteiro')).toBeTruthy();
  });
});

describe('field corrections', () => {
  test('change the type of a field, remove it, then remove the whole domain', async () => {
    const user = userEvent.setup();
    await overridesStore.set({
      'a.test': { '#doc': 'cpf', '[name="x"]': 'cep' },
      'b.test': { '#y': 'email' },
    });
    render(<ManageApp initial="overrides" />);

    await user.selectOptions(await screen.findByLabelText('#doc'), 'cnpj');
    await vi.waitFor(async () =>
      expect((await overridesStore.get())['a.test']?.['#doc']).toBe('cnpj'),
    );

    const [first] = screen.getAllByTestId('override');
    await user.click(within(first!).getByRole('button', { name: 'Remover' }));
    await vi.waitFor(() => expect(screen.getAllByTestId('override')).toHaveLength(2));

    await user.click(screen.getAllByRole('button', { name: 'Remover todas deste domínio' })[0]!);
    await vi.waitFor(async () =>
      expect(await overridesStore.get()).toEqual({ 'b.test': { '#y': 'email' } }),
    );
  });
});
