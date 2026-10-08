import { i18n } from '#i18n';

type Key = Parameters<typeof i18n.t>[0];

export const t = (key: string, subs?: (string | number)[]): string =>
  (subs ? i18n.t(key as Key, subs.map(String) as never) : i18n.t(key as Key)) as string;

export const plural = (key: string, n: number): string =>
  i18n.t(key as Key, n as never) as unknown as string;

const labelOr = (prefix: string, key: string) => t(`${prefix}.${key}`) || key;

export const fieldLabel = (key: string) => labelOr('field', key);
export const genLabel = (id: string) => labelOr('gen', id);
export const optionLabel = (value: string) =>
  value === '' ? t('opt.ufAny') : labelOr('opt', value);
