import type { Language } from '../../domain/settings';

type Messages = Record<string, { message: string }>;

let dictionary: Messages | undefined;

type MessageName = Parameters<typeof browser.i18n.getMessage>[0];

export async function loadLanguage(language: Language) {
  dictionary =
    language === 'auto'
      ? undefined
      : await fetch(browser.runtime.getURL(`/_locales/${language}/messages.json` as '/'))
          .then((r) => r.json() as Promise<Messages>)
          .catch(() => undefined);
}

const message = (name: string, subs: string[]) =>
  dictionary
    ? subs.reduce((m, s, i) => m.replaceAll(`$${i + 1}`, s), dictionary[name]?.message ?? '')
    : browser.i18n.getMessage(name as MessageName, subs);

export const t = (key: string, subs: (string | number)[] = []): string =>
  message(key.replaceAll('.', '_'), subs.map(String));

export const plural = (key: string, n: number): string => {
  const forms = t(key, [n]).split(' | ');
  return (n === 1 ? forms[0] : forms.at(-1)) ?? '';
};

const labelOr = (prefix: string, key: string) => t(`${prefix}.${key}`) || key;

export const fieldLabel = (key: string) => labelOr('field', key);
export const genLabel = (id: string) => labelOr('gen', id);
export const optionLabel = (value: string) =>
  value === '' ? t('opt.ufAny') : labelOr('opt', value);
