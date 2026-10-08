import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { cpf, cnpj, isCnpjAlfanumerico } from '@mocado/core';
import { App } from './App';

beforeEach(() => localStorage.clear());

describe('popup', () => {
  test('generates a masked CPF by default and copies it', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    render(<App />);
    const value = screen.getByTestId('result').textContent!;
    expect(value).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
    expect(cpf.validate(value)).toBe(true);
    await user.click(screen.getByRole('button', { name: /copiar/i }));
    expect(writeText).toHaveBeenCalledWith(value);
  });

  test('mask toggle and regenerate', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('checkbox'));
    const first = screen.getByTestId('result').textContent!;
    expect(first).toMatch(/^\d{11}$/);
    await user.click(screen.getByRole('button', { name: /^gerar$/i }));
    expect(screen.getByTestId('result').textContent).not.toBe(first);
  });

  test('CNPJ alfanumérico option', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(screen.getByLabelText(/gerador/i), 'cnpj');
    await user.selectOptions(screen.getByLabelText(/tipo/i), 'alfanumerico');
    const value = screen.getByTestId('result').textContent!;
    expect(cnpj.validate(value)).toBe(true);
    expect(isCnpjAlfanumerico(value)).toBe(true);
  });

  test('composite generators list each field with its own copy button', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(screen.getByLabelText(/gerador/i), 'pessoa');
    const list = document.querySelector('dl')! as HTMLElement;
    expect(within(list).getByText('CPF')).toBeTruthy();
    expect(within(list).getAllByRole('button').length).toBeGreaterThan(30);
  });

  test('every generator renders a value', async () => {
    const user = userEvent.setup();
    render(<App />);
    const select = screen.getByLabelText(/gerador/i) as HTMLSelectElement;
    for (const opt of [...select.options]) {
      await user.selectOptions(select, opt.value);
      const out =
        screen.queryByTestId('result')?.textContent ?? document.querySelector('dl')?.textContent;
      expect(out, opt.value).toBeTruthy();
    }
  });
});
