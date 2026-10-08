import { i18n } from '#i18n';
import type { FieldType } from '@mocado/core';
import { callContent, fillFocusedTab, fillTab, fillTypeHere } from './actions';

const t = (k: string) => i18n.t(k as Parameters<typeof i18n.t>[0]) as string;

/** Types offered in "Gerar aqui" and "Marcar este campo como" (most used first). */
export const MENU_TYPES: FieldType[] = [
  'cpf', 'cnpj', 'nome', 'email', 'celular', 'telefone', 'cep', 'nascimento', 'rg', 'cnh', 'pis',
  'titulo', 'ie', 'razaoSocial', 'nomeFantasia', 'logradouro', 'numero', 'bairro', 'cidade', 'uf',
  'placa', 'renavam', 'cartaoNumero', 'cartaoValidade', 'cartaoCvv', 'certidao', 'senha', 'texto',
]; // prettier-ignore

export function createMenus() {
  browser.contextMenus.removeAll(() => {
    const add = (props: Parameters<typeof browser.contextMenus.create>[0]) =>
      browser.contextMenus.create(props);
    add({ id: 'fill-form', title: t('menu.fillForm'), contexts: ['editable', 'page'] });
    add({ id: 'gen', title: t('menu.generateHere'), contexts: ['editable'] });
    add({ id: 'mark', title: t('menu.markAs'), contexts: ['editable'] });
    for (const type of MENU_TYPES) {
      add({
        id: `gen:${type}`,
        parentId: 'gen',
        title: t(`field.${type}`),
        contexts: ['editable'],
      });
      add({
        id: `mark:${type}`,
        parentId: 'mark',
        title: t(`field.${type}`),
        contexts: ['editable'],
      });
    }
    add({ id: 'open-history', title: t('menu.history'), contexts: ['action'] });
  });
}

const openHistory = () => browser.tabs.create({ url: browser.runtime.getURL('/history.html') });

export async function onMenuClick(info: { menuItemId: string | number }, tab?: { id?: number }) {
  const id = String(info.menuItemId);
  if (id === 'open-history') return openHistory();
  if (tab?.id === undefined) return;
  if (id === 'fill-form') return fillTab(tab.id);
  const [kind, type] = id.split(':') as [string, FieldType];
  if (kind === 'gen') return fillTypeHere(tab.id, type);
  if (kind === 'mark') {
    await callContent(tab.id, 'markFocused', type);
    return fillTypeHere(tab.id, type); // show the correction right away
  }
}

export async function onCommand(command: string, tab?: { id?: number }) {
  const id = tab?.id ?? (await browser.tabs.query({ active: true, currentWindow: true }))[0]?.id;
  if (id === undefined) return;
  return command === 'fill-field' ? fillFocusedTab(id) : fillTab(id);
}
