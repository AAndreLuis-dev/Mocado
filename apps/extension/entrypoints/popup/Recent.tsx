import { useEffect, useState } from 'react';
import { i18n } from '#i18n';
import { displayName, getPinned, history, setPinned, type HistoryRecord } from '@/src/history';
import { Button } from '@/src/ui';

/** Last profiles with one-click reuse in the current tab (the popup has activeTab). */
export function Recent({ onReuse }: { onReuse: (id: string) => void }) {
  const [recent, setRecent] = useState<HistoryRecord[]>([]);
  const [pinned, setPinnedRecord] = useState<HistoryRecord>();

  useEffect(() => {
    void (async () => {
      setRecent((await history.list()).slice(0, 5));
      const id = await getPinned();
      setPinnedRecord(id ? await history.get(id) : undefined);
    })();
  }, []);

  return (
    <section className="flex flex-col gap-1 border-t border-zinc-200 pt-3 dark:border-zinc-700">
      {pinned && (
        <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-2 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <span className="flex-1">{i18n.t('popup.pinned', [displayName(pinned)])}</span>
          <Button
            onClick={async () => {
              await setPinned(undefined);
              setPinnedRecord(undefined);
            }}
          >
            {i18n.t('popup.unpin')}
          </Button>
        </div>
      )}
      {recent.length > 0 && (
        <>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {i18n.t('popup.recent')}
          </h2>
          <ul className="flex flex-col">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center gap-2 py-1 text-sm">
                <span className="flex-1 truncate" title={r.uses.map((u) => u.domain).join(', ')}>
                  {r.favorite ? '★ ' : ''}
                  {displayName(r)}
                  <span className="ml-1 text-xs text-zinc-500">{r.uses.at(-1)?.domain}</span>
                </span>
                <Button onClick={() => onReuse(r.id)}>{i18n.t('popup.reuse')}</Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
