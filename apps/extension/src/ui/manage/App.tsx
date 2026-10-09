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
    <div className="min-h-screen bg-ficha font-sans text-tinta">
      <div className="mx-auto max-w-4xl px-4 pt-6 pb-16 sm:px-8 sm:pt-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 px-1">
          <div className="flex items-center gap-2.5">
            <Logo size={30} />
            <span className="text-[22px] font-bold tracking-tight">{t('extName')}</span>
          </div>
          <p className="text-xs text-grafite">{t('disclaimer')}</p>
        </header>

        <nav role="tablist" className="flex gap-6 overflow-x-auto border-b border-linha">
          {TABS.map((id) => (
            <a
              key={id}
              role="tab"
              href={`#${id}`}
              aria-selected={tab === id}
              className={`-mb-px shrink-0 border-b-2 pb-2.5 text-[15px] font-semibold transition-colors ${
                tab === id
                  ? 'border-caneta text-tinta'
                  : 'border-transparent text-grafite hover:text-tinta'
              }`}
            >
              {t(`tabs.${id}`)}
            </a>
          ))}
        </nav>

        <main role="tabpanel" className="pt-6">
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
