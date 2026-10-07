import { useState } from 'react';
import { i18n } from '#i18n';
import { History } from './History';

export type Tab = 'history';

export function ManageApp({ initial }: { initial: Tab }) {
  const [tab] = useState<Tab>(initial);
  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6">
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {i18n.t('extName')} · {i18n.t('history.title')}
          </h1>
          <p className="text-xs text-zinc-500">{i18n.t('disclaimer')}</p>
        </header>
        {tab === 'history' && <History />}
      </main>
    </div>
  );
}
