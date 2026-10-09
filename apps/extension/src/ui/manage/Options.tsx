import { UFS } from '@mocado/core';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  CNPJ_KINDS,
  DEFAULT_SETTINGS,
  IDADE_MAX,
  LANGUAGES,
  parseDomains,
  THEMES,
  withSetting,
  type Settings,
} from '../../domain/settings';
import { optionLabel, t } from '../../infra/browser/i18n';
import { shortcuts as loadShortcuts } from '../../infra/browser/navigation';
import { preferences } from '../../infra/container';
import { Kbd } from '../components/controls';
import {
  Band,
  Box,
  FormGrid,
  PenCheck,
  PenInput,
  PenRadio,
  PenSelect,
  PenTextarea,
} from '../components/form';

const THEME_LABEL = {
  system: 'options.themeSystem',
  light: 'options.themeLight',
  dark: 'options.themeDark',
};

const LANGUAGE_LABEL = {
  auto: 'options.languageAuto',
  pt_BR: 'options.languagePt',
  en: 'options.languageEn',
};

type Shortcut = { name?: string; description?: string; shortcut?: string };

export function Options() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [blockedText, setBlockedText] = useState('');
  const [saves, setSaves] = useState(0);
  const [saved, setSaved] = useState(false);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);

  useEffect(() => {
    void preferences.settings().then((loaded) => {
      setSettings(loaded);
      setBlockedText(loaded.blockedDomains.join('\n'));
    });
    void loadShortcuts().then(setShortcuts);
  }, []);

  useEffect(() => {
    if (!saved) return;
    const id = setTimeout(() => setSaved(false), 1600);
    return () => clearTimeout(id);
  }, [saved, saves]);

  async function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((current) => withSetting(current, key, value));
    setSettings(await preferences.setSetting(key, value));
    setSaves((count) => count + 1);
    setSaved(true);
  }

  const age = (key: 'idadeMin' | 'idadeMax') => (
    <Box label={t(`options.${key}`)} htmlFor={key}>
      <PenInput
        id={key}
        type="number"
        min={0}
        max={IDADE_MAX}
        className="font-mono tabular-nums"
        value={settings[key]}
        onChange={(e) => void set(key, Number(e.target.value) || 0)}
      />
    </Box>
  );

  return (
    <>
      <FormGrid cols={4}>
        <Band>{t('options.sectionData')}</Band>
        <Box label={t('options.cnpjTipo')} htmlFor="cnpjTipo">
          <PenSelect
            id="cnpjTipo"
            value={settings.cnpjTipo}
            onChange={(e) => void set('cnpjTipo', e.target.value as Settings['cnpjTipo'])}
          >
            {CNPJ_KINDS.map((v) => (
              <option key={v} value={v}>
                {optionLabel(v)}
              </option>
            ))}
          </PenSelect>
        </Box>
        <Box label={t('options.uf')} htmlFor="uf">
          <PenSelect
            id="uf"
            value={settings.uf}
            onChange={(e) => void set('uf', e.target.value as Settings['uf'])}
          >
            <option value="">{t('options.ufRandom')}</option>
            {UFS.map((uf) => (
              <option key={uf}>{uf}</option>
            ))}
          </PenSelect>
        </Box>
        {age('idadeMin')}
        {age('idadeMax')}
        <Box span="full" className="justify-center">
          <PenCheck
            label={t('options.masked')}
            checked={settings.masked}
            onChange={(e) => void set('masked', e.target.checked)}
          />
        </Box>

        <Band>{t('options.sectionWhere')}</Band>
        <Box span={2} className="justify-center">
          <PenCheck
            label={t('options.observe')}
            checked={settings.observe}
            onChange={(e) => void set('observe', e.target.checked)}
          />
        </Box>
        <Box span={2} className="justify-center">
          <PenCheck
            label={t('options.fillPasswords')}
            checked={settings.fillPasswords}
            onChange={(e) => void set('fillPasswords', e.target.checked)}
          />
        </Box>
        <Box span="full" label={t('options.blocked')} htmlFor="blocked">
          <PenTextarea
            id="blocked"
            rows={3}
            placeholder="banco.com.br"
            value={blockedText}
            onChange={(e) => setBlockedText(e.target.value)}
            onBlur={() => void set('blockedDomains', parseDomains(blockedText))}
          />
          <span className="text-xs text-grafite">{t('options.blockedHint')}</span>
        </Box>

        <Band>{t('options.sectionLook')}</Band>
        <Box span={2}>
          <fieldset className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <legend className="mb-2 text-xs font-medium text-grafite">{t('options.theme')}</legend>
            {THEMES.map((theme) => (
              <PenRadio
                key={theme}
                name="theme"
                value={theme}
                label={t(THEME_LABEL[theme])}
                checked={settings.theme === theme}
                onChange={() => void set('theme', theme)}
              />
            ))}
          </fieldset>
        </Box>
        <Box span={2} label={t('options.language')} htmlFor="language">
          <PenSelect
            id="language"
            value={settings.language}
            onChange={(e) =>
              void set('language', e.target.value as Settings['language']).then(() =>
                location.reload(),
              )
            }
          >
            {LANGUAGES.map((language) => (
              <option key={language} value={language}>
                {t(LANGUAGE_LABEL[language])}
              </option>
            ))}
          </PenSelect>
        </Box>

        <Band>{t('options.shortcuts')}</Band>
        {shortcuts
          .filter((c) => c.description)
          .map((c) => (
            <Box key={c.name} span={2} label={c.description}>
              {c.shortcut ? (
                <Kbd keys={c.shortcut} className="text-caneta" />
              ) : (
                <span className="text-grafite">{t('options.shortcutUnset')}</span>
              )}
            </Box>
          ))}
        <p className="col-span-full text-xs text-grafite">{t('options.shortcutsHint')}</p>
      </FormGrid>

      <p className="mt-4 text-sm text-grafite">{t('options.privacy')}</p>

      <p role="status" aria-live="polite" className="pointer-events-none fixed right-8 bottom-8">
        {saved && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-tinta px-3.5 py-1.5 text-sm font-semibold text-ficha shadow-lg">
            <Check size={15} aria-hidden />
            {t('options.saved')}
          </span>
        )}
      </p>
    </>
  );
}
