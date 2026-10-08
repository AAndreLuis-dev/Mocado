import { useEffect, useState } from 'react';
import { displayName, type HistoryRecord } from '../../domain/profile';
import { t } from '../../infra/browser/i18n';
import { historyService } from '../../infra/container';
import { Button } from '../components';

/** Last profiles with one-click reuse in the current tab (the popup has activeTab). */
export function Recent({ onReuse }: { onReuse: (id: string) => void }) {
  const [recent, setRecent] = useState<HistoryRecord[]>([]);
  const [pinned, setPinnedRecord] = useState<HistoryRecord>();

  useEffect(() => {
    void (async () => {
      setRecent(await historyService.recent(5));
      setPinnedRecord(await historyService.pinned());
    })();
  }, []);

  return (
    <section className="flex flex-col gap-1 border-t border-zinc-200 pt-3 dark:border-zinc-700">
      {pinned && (
        <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-2 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <span className="flex-1">{t('popup.pinned', [displayName(pinned)])}</span>
          <Button
            onClick={async () => {
              await historyService.pin(undefined);
              setPinnedRecord(undefined);
            }}
          >
            {t('popup.unpin')}
          </Button>
        </div>
      )}
      {recent.length > 0 && (
        <>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {t('popup.recent')}
          </h2>
          <ul className="flex flex-col">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center gap-2 py-1 text-sm">
                <span className="flex-1 truncate" title={r.uses.map((u) => u.domain).join(', ')}>
                  {r.favorite ? '★ ' : ''}
                  {displayName(r)}
                  <span className="ml-1 text-xs text-zinc-500">{r.uses.at(-1)?.domain}</span>
                </span>
                <Button onClick={() => onReuse(r.id)}>{t('popup.reuse')}</Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
