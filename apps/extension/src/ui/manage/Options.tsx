import { UFS } from '@mocado/core';
import { useEffect, useState } from 'react';
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
import { Kbd } from '../components/controls';
import { Stamp } from '../components/brand';
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

type Shortcut = { name?: string; description?: string; shortcut?: string };

export function Options() {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);
  const [blockedText, setBlockedText] = useState('');
  const [saves, setSaves] = useState(0);
  const [saved, setSaved] = useState(false);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);

  useEffect(() => {
    void preferences.settings().then((loaded) => {
      setS(loaded);
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
    setS((cur) => withSetting(cur, key, value));
    setS(await preferences.setSetting(key, value));
    setSaves((n) => n + 1);
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
        value={s[key]}
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
            value={s.cnpjTipo}
            onChange={(e) => void set('cnpjTipo', e.target.value as Settings['cnpjTipo'])}
          >
            {CNPJ_TIPOS.map((v) => (
              <option key={v} value={v}>
                {optionLabel(v)}
              </option>
            ))}
          </PenSelect>
        </Box>
        <Box label={t('options.uf')} htmlFor="uf">
          <PenSelect
            id="uf"
            value={s.uf}
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
            checked={s.masked}
            onChange={(e) => void set('masked', e.target.checked)}
          />
        </Box>

        <Band>{t('options.sectionWhere')}</Band>
        <Box span={2} className="justify-center">
          <PenCheck
            label={t('options.observe')}
            checked={s.observe}
            onChange={(e) => void set('observe', e.target.checked)}
          />
        </Box>
        <Box span={2} className="justify-center">
          <PenCheck
            label={t('options.fillPasswords')}
            checked={s.fillPasswords}
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
        <Box span="full">
          <fieldset className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <legend className="mb-1.5 text-[11.5px] text-grafite">{t('options.theme')}</legend>
            {THEMES.map((theme) => (
              <PenRadio
                key={theme}
                name="theme"
                value={theme}
                label={t(THEME_LABEL[theme])}
                checked={s.theme === theme}
                onChange={() => void set('theme', theme)}
              />
            ))}
          </fieldset>
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
        <Box span="full" dense>
          <span className="text-xs text-grafite">{t('options.shortcutsHint')}</span>
        </Box>
      </FormGrid>

      <p className="mt-4 text-sm text-grafite">{t('options.privacy')}</p>

      <p role="status" aria-live="polite" className="pointer-events-none fixed right-8 bottom-8">
        {saved && (
          <Stamp replay={saves} className="bg-ficha/85 px-3 py-1 text-[15px]">
            {t('options.saved')}
          </Stamp>
        )}
      </p>
    </>
  );
}
