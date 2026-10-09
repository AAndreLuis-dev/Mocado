import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import type { Theme } from '../domain/settings';
import { t, loadLanguage } from '../infra/browser/i18n';
import { preferences } from '../infra/container';
import { watchStorage } from '../infra/storage/stores';

function applyTheme(theme: Theme) {
  const dark =
    theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

export async function boot(app: ReactNode) {
  const sync = () => preferences.settings().then((s) => applyTheme(s.theme));
  watchStorage(['settings'], () => void sync());
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => void sync());
  const settings = await preferences.settings();
  applyTheme(settings.theme);
  await loadLanguage(settings.language);
  document.documentElement.lang = t('htmlLang');
  createRoot(document.getElementById('root')!).render(app);
}
