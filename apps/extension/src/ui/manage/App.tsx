import { useEffect, useState } from 'react';
import { t } from '../../infra/browser/i18n';
import { Logo } from '../components/brand';
import { History } from './History';
import { Options } from './Options';
import { Overrides } from './Overrides';

const TABS = ['history', 'options', 'overrides'] as const;
export type Tab = (typeof TABS)[number];

const fromHash = (fallback: Tab): Tab => {
  const hash = location.hash.slice(1);
  return (TABS as readonly string[]).includes(hash) ? (hash as Tab) : fallback;
};

export function ManageApp({ initial }: { initial: Tab }) {
  const [tab, setTab] = useState<Tab>(() => fromHash(initial));
  useEffect(() => {
    const onHash = () => setTab(fromHash(initial));
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, [initial]);

  return (
    <div className="min-h-screen bg-papel font-sans text-tinta">
      <div className="mx-auto max-w-4xl px-3 pt-6 pb-16 sm:px-8 sm:pt-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 px-1">
          <div className="flex items-center gap-2.5">
            <Logo size={30} />
            <span className="text-[22px] font-bold tracking-tight">{t('extName')}</span>
          </div>
          <p className="text-xs text-grafite">{t('disclaimer')}</p>
        </header>

        <nav
          role="tablist"
          className="relative z-10 -mb-px flex gap-1 overflow-x-auto px-3 sm:px-5"
        >
          {TABS.map((id) => (
            <a
              key={id}
              role="tab"
              href={`#${id}`}
              aria-selected={tab === id}
              className={`shrink-0 rounded-t-lg border px-4 pt-2 pb-2 text-sm font-semibold transition-colors ${
                tab === id
                  ? 'border-tinta/25 border-b-ficha bg-ficha text-tinta'
                  : 'border-transparent text-grafite hover:bg-pauta hover:text-tinta'
              }`}
            >
              {t(`tabs.${id}`)}
            </a>
          ))}
        </nav>

        <main
          role="tabpanel"
          className="rounded-lg border border-tinta/25 bg-ficha px-4 pt-6 pb-8 shadow-[0_1px_0_var(--linha),0_12px_32px_-24px_rgb(28_35_48/0.35)] sm:px-8 sm:pt-8"
        >
          <header className="mb-6">
            <h1 className="sr-only">{t(`tabs.${tab}`)}</h1>
            <p className="max-w-prose text-[15px] text-grafite">{t(`tabs.${tab}Hint`)}</p>
          </header>
          {tab === 'history' && <History />}
          {tab === 'options' && <Options />}
          {tab === 'overrides' && <Overrides />}
        </main>
      </div>
    </div>
  );
}
