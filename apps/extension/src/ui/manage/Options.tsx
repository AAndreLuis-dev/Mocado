import { UFS } from '@mocado/core';
import { Check } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import {
  CNPJ_TIPOS,
  DEFAULT_SETTINGS,
  IDADE_MAX,
  parseDomains,
  THEMES,
  withSetting,
  type Settings,
} from '../../domain/settings';
import { optionLabel, t } from '../../infra/browser/i18n';
import { shortcuts as loadShortcuts } from '../../infra/browser/navigation';
import { preferences } from '../../infra/container';
import { inputClass, Kbd, Select, Switch } from '../components/controls';
import { Ficha } from '../components/ficha';

const THEME_LABEL = {
  system: 'options.themeSystem',
  light: 'options.themeLight',
  dark: 'options.themeDark',
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-[15px] font-bold">{title}</h2>
      <Ficha perforated={false}>
        <div className="flex flex-col divide-y divide-pauta px-5 text-[15px] [&>*]:py-3.5">
          {children}
        </div>
      </Ficha>
    </section>
  );
}

/** Label on the left, control on the right (stacked on narrow screens). */
function Row({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}

export function Options() {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);
  const [blockedText, setBlockedText] = useState('');
  const [saved, setSaved] = useState(false);
  const [shortcuts, setShortcuts] = useState<
    { name?: string; description?: string; shortcut?: string }[]
  >([]);

  useEffect(() => {
    void preferences.settings().then((loaded) => {
      setS(loaded);
      setBlockedText(loaded.blockedDomains.join('\n'));
    });
    void loadShortcuts().then(setShortcuts);
  }, []);

  /** Auto-save every change. */
  async function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setS((cur) => withSetting(cur, key, value)); // controlled inputs must update synchronously
    setS(await preferences.setSetting(key, value));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const age = (key: 'idadeMin' | 'idadeMax') => (
    <label className="flex items-center gap-2 text-sm text-grafite">
      {t(`options.${key}`)}
      <input
        type="number"
        min={0}
        max={IDADE_MAX}
        className={`${inputClass} w-20 font-mono tabular-nums`}
        value={s[key]}
        onChange={(e) => void set(key, Number(e.target.value) || 0)}
      />
    </label>
  );

  return (
    <div className="flex max-w-2xl flex-col gap-7">
      <Section title={t('options.sectionData')}>
        <Switch
          label={t('options.masked')}
          checked={s.masked}
          onChange={(e) => void set('masked', e.target.checked)}
        />
        <Row label={t('options.cnpjTipo')} htmlFor="cnpjTipo">
          <Select
            id="cnpjTipo"
            value={s.cnpjTipo}
            onChange={(e) => void set('cnpjTipo', e.target.value as Settings['cnpjTipo'])}
          >
            {CNPJ_TIPOS.map((v) => (
              <option key={v} value={v}>
                {optionLabel(v)}
              </option>
            ))}
          </Select>
        </Row>
        <Row label={t('options.uf')} htmlFor="uf">
          <Select
            id="uf"
            value={s.uf}
            onChange={(e) => void set('uf', e.target.value as Settings['uf'])}
          >
            <option value="">{t('options.ufRandom')}</option>
            {UFS.map((uf) => (
              <option key={uf}>{uf}</option>
            ))}
          </Select>
        </Row>
        <fieldset className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <legend className="float-left">{t('options.idade')}</legend>
          <span className="flex gap-4">
            {age('idadeMin')}
            {age('idadeMax')}
          </span>
        </fieldset>
      </Section>

      <Section title={t('options.sectionWhere')}>
        <Switch
          label={t('options.observe')}
          checked={s.observe}
          onChange={(e) => void set('observe', e.target.checked)}
        />
        <Switch
          label={t('options.fillPasswords')}
          checked={s.fillPasswords}
          onChange={(e) => void set('fillPasswords', e.target.checked)}
        />
        <div className="flex flex-col gap-2">
          <label htmlFor="blocked">{t('options.blocked')}</label>
          <textarea
            id="blocked"
            rows={4}
            placeholder="banco.com.br"
            className={`${inputClass} h-auto py-2 font-mono`}
            value={blockedText}
            onChange={(e) => setBlockedText(e.target.value)}
            onBlur={() => void set('blockedDomains', parseDomains(blockedText))}
          />
          <span className="text-xs text-grafite">{t('options.blockedHint')}</span>
        </div>
      </Section>

      <Section title={t('options.sectionLook')}>
        <fieldset className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <legend className="float-left">{t('options.theme')}</legend>
          <span className="inline-flex rounded-md border border-linha bg-papel p-0.5">
            {THEMES.map((theme) => (
              <label
                key={theme}
                className="cursor-pointer rounded px-3 py-1 text-sm font-semibold text-grafite has-checked:bg-ficha has-checked:text-caneta has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-caneta"
              >
                <input
                  type="radio"
                  name="theme"
                  value={theme}
                  className="sr-only"
                  checked={s.theme === theme}
                  onChange={() => void set('theme', theme)}
                />
                {t(THEME_LABEL[theme])}
              </label>
            ))}
          </span>
        </fieldset>
      </Section>

      <Section title={t('options.shortcuts')}>
        <ul className="flex flex-col gap-2.5 text-sm">
          {shortcuts
            .filter((c) => c.description)
            .map((c) => (
              <li key={c.name} className="flex items-center justify-between gap-4">
                {c.description}
                {c.shortcut ? (
                  <Kbd keys={c.shortcut} className="text-grafite" />
                ) : (
                  <span className="text-grafite">{t('options.shortcutUnset')}</span>
                )}
              </li>
            ))}
        </ul>
        <p className="text-xs text-grafite">{t('options.shortcutsHint')}</p>
      </Section>

      <p className="text-sm text-grafite">{t('options.privacy')}</p>
      <p
        role="status"
        aria-live="polite"
        className="fixed right-6 bottom-6 flex items-center gap-1.5 rounded-md bg-tinta px-3 py-2 text-sm font-semibold text-papel shadow-lg transition-opacity empty:opacity-0"
      >
        {saved && (
          <>
            <Check size={15} aria-hidden />
            {t('options.saved')}
          </>
        )}
      </p>
    </div>
  );
}
