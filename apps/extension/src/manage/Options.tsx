import { useEffect, useState } from 'react';
import { i18n } from '#i18n';
import { UFS } from '@massa/core';
import { DEFAULT_SETTINGS, getSettings, saveSettings, type Settings } from '@/src/settings';
import { selectClass } from '@/src/ui';

const t = (k: string) => i18n.t(k as Parameters<typeof i18n.t>[0]) as string;

const row = 'flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4';
const inputClass =
  'rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-sm dark:border-zinc-600';

export function Options() {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);
  const [blockedText, setBlockedText] = useState('');
  const [saved, setSaved] = useState(false);
  const [shortcuts, setShortcuts] = useState<
    { name?: string; description?: string; shortcut?: string }[]
  >([]);

  useEffect(() => {
    void getSettings().then((loaded) => {
      setS(loaded);
      setBlockedText(loaded.blockedDomains.join('\n'));
    });
    void browser.commands.getAll().then(setShortcuts);
  }, []);

  /** Auto-save every change. */
  async function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    const next = { ...s, [key]: value };
    if (key === 'idadeMin' && next.idadeMax < next.idadeMin) next.idadeMax = next.idadeMin;
    if (key === 'idadeMax' && next.idadeMin > next.idadeMax) next.idadeMin = next.idadeMax;
    setS(next);
    await saveSettings(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const age = (key: 'idadeMin' | 'idadeMax') => (
    <label className="flex items-center gap-1 text-sm">
      {t(`options.${key}`)}
      <input
        type="number"
        min={0}
        max={120}
        className={`${inputClass} w-20`}
        value={s[key]}
        onChange={(e) => {
          const n = Math.max(0, Math.min(120, Number(e.target.value) || 0));
          void set(key, n);
        }}
      />
    </label>
  );

  return (
    <section className="flex max-w-2xl flex-col gap-5">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={s.masked}
          onChange={(e) => void set('masked', e.target.checked)}
        />
        {t('options.masked')}
      </label>
      <div className={row}>
        <label htmlFor="cnpjTipo">{t('options.cnpjTipo')}</label>
        <select
          id="cnpjTipo"
          className={selectClass}
          value={s.cnpjTipo}
          onChange={(e) => void set('cnpjTipo', e.target.value as Settings['cnpjTipo'])}
        >
          {(['numerico', 'alfanumerico', 'aleatorio'] as const).map((v) => (
            <option key={v} value={v}>
              {t(`opt.${v}`)}
            </option>
          ))}
        </select>
      </div>
      <div className={row}>
        <label htmlFor="uf">{t('options.uf')}</label>
        <select
          id="uf"
          className={selectClass}
          value={s.uf}
          onChange={(e) => void set('uf', e.target.value as Settings['uf'])}
        >
          <option value="">{t('options.ufRandom')}</option>
          {UFS.map((uf) => (
            <option key={uf}>{uf}</option>
          ))}
        </select>
      </div>
      <fieldset className={row}>
        <legend className="sr-only">{t('options.idade')}</legend>
        <span aria-hidden>{t('options.idade')}</span>
        <span className="flex gap-3">
          {age('idadeMin')}
          {age('idadeMax')}
        </span>
      </fieldset>
      <div className="flex flex-col gap-1">
        <label htmlFor="blocked">{t('options.blocked')}</label>
        <textarea
          id="blocked"
          rows={4}
          className={`${inputClass} font-mono`}
          value={blockedText}
          onChange={(e) => setBlockedText(e.target.value)}
          onBlur={() =>
            void set(
              'blockedDomains',
              blockedText
                .split(/\s+/)
                .map((d) => d.trim().toLowerCase())
                .filter(Boolean),
            )
          }
        />
        <span className="text-xs text-zinc-500">{t('options.blockedHint')}</span>
      </div>
      <div className={row}>
        <label htmlFor="theme">{t('options.theme')}</label>
        <select
          id="theme"
          className={selectClass}
          value={s.theme}
          onChange={(e) => void set('theme', e.target.value as Settings['theme'])}
        >
          <option value="system">{t('options.themeSystem')}</option>
          <option value="light">{t('options.themeLight')}</option>
          <option value="dark">{t('options.themeDark')}</option>
        </select>
      </div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={s.fillPasswords}
          onChange={(e) => void set('fillPasswords', e.target.checked)}
        />
        {t('options.fillPasswords')}
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={s.observe}
          onChange={(e) => void set('observe', e.target.checked)}
        />
        {t('options.observe')}
      </label>

      <div className="flex flex-col gap-1 border-t border-zinc-200 pt-4 dark:border-zinc-700">
        <h2 className="font-semibold">{t('options.shortcuts')}</h2>
        <ul className="text-sm">
          {shortcuts
            .filter((c) => c.description)
            .map((c) => (
              <li key={c.name}>
                <kbd className="rounded border border-zinc-300 px-1 font-mono text-xs dark:border-zinc-600">
                  {c.shortcut || t('options.shortcutUnset')}
                </kbd>{' '}
                {c.description}
              </li>
            ))}
        </ul>
        <p className="text-xs text-zinc-500">{t('options.shortcutsHint')}</p>
      </div>
      <p className="text-xs text-zinc-500">{t('options.privacy')}</p>
      <p
        role="status"
        aria-live="polite"
        className="h-5 text-sm text-emerald-700 dark:text-emerald-400"
      >
        {saved ? t('options.saved') : ''}
      </p>
    </section>
  );
}
