import { useEffect, useState } from 'react';
import { t } from '../../infra/browser/i18n';
import { History } from './History';
import { Options } from './Options';
import { Overrides } from './Overrides';

const TABS = ['history', 'options', 'overrides'] as const;
export type Tab = (typeof TABS)[number];

const fromHash = (fallback: Tab): Tab => {
  const h = location.hash.slice(1);
  return (TABS as readonly string[]).includes(h) ? (h as Tab) : fallback;
};

/** History and Options share one app (two entrypoints only pick the initial tab). */
export function ManageApp({ initial }: { initial: Tab }) {
  const [tab, setTab] = useState<Tab>(() => fromHash(initial));
  useEffect(() => {
    const onHash = () => setTab(fromHash(initial));
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, [initial]);

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6">
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{t('extName')}</h1>
          <p className="text-xs text-zinc-500">{t('disclaimer')}</p>
        </header>
        <nav role="tablist" className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700">
          {TABS.map((id) => (
            <a
              key={id}
              role="tab"
              href={`#${id}`}
              aria-selected={tab === id}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
                tab === id
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              {t(`tabs.${id}`)}
            </a>
          ))}
        </nav>
        <div role="tabpanel">
          {tab === 'history' && <History />}
          {tab === 'options' && <Options />}
          {tab === 'overrides' && <Overrides />}
        </div>
      </main>
    </div>
  );
}
