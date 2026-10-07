import { getSettings, type Settings } from './settings';

export function applyTheme(theme: Settings['theme']) {
  const dark =
    theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

/** Applies the saved theme now and whenever it changes (Options open in another tab). */
export function initTheme() {
  const sync = () => getSettings().then((s) => applyTheme(s.theme));
  void sync();
  browser.storage.onChanged.addListener((changes) => changes.settings && void sync());
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => void sync());
}
