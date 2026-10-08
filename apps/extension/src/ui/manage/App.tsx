import { History as HistoryIcon, SlidersHorizontal, Wrench } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { t } from '../../infra/browser/i18n';
import { Logo } from '../components/ficha';
import { History } from './History';
import { Options } from './Options';
import { Overrides } from './Overrides';

const TABS = ['history', 'options', 'overrides'] as const;
export type Tab = (typeof TABS)[number];

const ICONS: Record<Tab, ReactNode> = {
  history: <HistoryIcon size={17} />,
  options: <SlidersHorizontal size={17} />,
  overrides: <Wrench size={17} />,
};

const fromHash = (fallback: Tab): Tab => {
  const h = location.hash.slice(1);
  return (TABS as readonly string[]).includes(h) ? (h as Tab) : fallback;
};

/** History, Options and field corrections share one app (two entrypoints pick the initial tab). */
export function ManageApp({ initial }: { initial: Tab }) {
  const [tab, setTab] = useState<Tab>(() => fromHash(initial));
  useEffect(() => {
    const onHash = () => setTab(fromHash(initial));
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, [initial]);

  return (
    <div className="min-h-screen bg-papel font-sans text-tinta">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:grid-cols-[13rem_1fr] sm:gap-10 sm:px-6 sm:py-10">
        <aside className="flex flex-col gap-5 sm:sticky sm:top-10 sm:self-start">
          <div className="flex items-center gap-2.5">
            <Logo size={30} />
            <span className="text-xl font-bold tracking-tight">{t('extName')}</span>
          </div>
          <nav
            role="tablist"
            aria-orientation="vertical"
            className="-mx-1 flex gap-1 overflow-x-auto sm:flex-col"
          >
            {TABS.map((id) => (
              <a
                key={id}
                role="tab"
                href={`#${id}`}
                aria-selected={tab === id}
                className={`flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                  tab === id
                    ? 'bg-ficha text-caneta shadow-[inset_3px_0_0_var(--caneta)] ring-1 ring-linha'
                    : 'text-grafite hover:bg-pauta hover:text-tinta'
                }`}
              >
                {ICONS[id]}
                {t(`tabs.${id}`)}
              </a>
            ))}
          </nav>
          <p className="hidden text-xs leading-relaxed text-grafite sm:block">{t('disclaimer')}</p>
        </aside>

        <main role="tabpanel" className="min-w-0">
          <header className="mb-6">
            <h1 className="text-[28px] leading-tight font-bold tracking-tight">
              {t(`tabs.${tab}`)}
            </h1>
            <p className="mt-1 max-w-prose text-[15px] text-grafite">{t(`tabs.${tab}Hint`)}</p>
          </header>
          {tab === 'history' && <History />}
          {tab === 'options' && <Options />}
          {tab === 'overrides' && <Overrides />}
          <p className="mt-10 text-xs text-grafite sm:hidden">{t('disclaimer')}</p>
        </main>
      </div>
    </div>
  );
}
