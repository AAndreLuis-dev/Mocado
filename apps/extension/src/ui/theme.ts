import type { Theme } from '../domain/settings';
import { preferences } from '../infra/container';
import { watchStorage } from '../infra/storage/stores';

export function applyTheme(theme: Theme) {
  const dark =
    theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

/** Applies the saved theme now and whenever it changes (Options open in another tab). */
export function initTheme() {
  const sync = () => preferences.settings().then((s) => applyTheme(s.theme));
  void sync();
  watchStorage(['settings'], () => void sync());
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => void sync());
}
