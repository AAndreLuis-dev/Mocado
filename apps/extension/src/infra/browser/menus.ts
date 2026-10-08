import type { FieldType } from '@mocado/core';
import { t, fieldLabel } from './i18n';
import { fillField, fillForm } from '../container';
import { activeTabId, openHistory } from './navigation';

/** Types offered in "Gerar aqui" and "Marcar este campo como" (most used first). */
export const MENU_TYPES: FieldType[] = [
  'cpf', 'cnpj', 'nome', 'email', 'celular', 'telefone', 'cep', 'nascimento', 'rg', 'cnh', 'pis',
  'titulo', 'ie', 'razaoSocial', 'nomeFantasia', 'logradouro', 'numero', 'bairro', 'cidade', 'uf',
  'placa', 'renavam', 'cartaoNumero', 'cartaoValidade', 'cartaoCvv', 'certidao', 'senha', 'texto',
]; // prettier-ignore

/** Idempotent: safe on install and on every startup. */
export function createMenus() {
  browser.contextMenus.removeAll(() => {
    const add = (props: Parameters<typeof browser.contextMenus.create>[0]) =>
      browser.contextMenus.create(props);
    add({ id: 'fill-form', title: t('menu.fillForm'), contexts: ['editable', 'page'] });
    add({ id: 'gen', title: t('menu.generateHere'), contexts: ['editable'] });
    add({ id: 'mark', title: t('menu.markAs'), contexts: ['editable'] });
    for (const type of MENU_TYPES)
      for (const parentId of ['gen', 'mark'])
        add({
          id: `${parentId}:${type}`,
          parentId,
          title: fieldLabel(type),
          contexts: ['editable'],
        });
    add({ id: 'open-history', title: t('menu.history'), contexts: ['action'] });
  });
}

export async function onMenuClick(info: { menuItemId: string | number }, tab?: { id?: number }) {
  const id = String(info.menuItemId);
  if (id === 'open-history') return openHistory();
  if (tab?.id === undefined) return;
  if (id === 'fill-form') return fillForm(tab.id);
  const [kind, type] = id.split(':') as [string, FieldType];
  if (kind === 'gen') return fillField.ofType(tab.id, type);
  if (kind === 'mark') return fillField.markAs(tab.id, type);
}

export async function onCommand(command: string, tab?: { id?: number }) {
  const id = tab?.id ?? (await activeTabId());
  if (id === undefined) return;
  return command === 'fill-field' ? fillField.focused(id) : fillForm(id);
}
