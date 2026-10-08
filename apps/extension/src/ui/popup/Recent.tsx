import { Pin, PinOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { displayName, type HistoryRecord } from '../../domain/profile';
import { t } from '../../infra/browser/i18n';
import { historyService } from '../../infra/container';
import { Button, IconButton } from '../components/controls';
import { TIPO_BG } from '../components/ficha';

/** Last profiles with one-click reuse in the current tab (the popup has activeTab). */
export function Recent({ onReuse }: { onReuse: (id: string) => void }) {
  const [recent, setRecent] = useState<HistoryRecord[]>([]);
  const [pinned, setPinned] = useState<HistoryRecord>();

  useEffect(() => {
    void Promise.all([historyService.recent(4), historyService.pinned()]).then(([r, p]) => {
      setRecent(r);
      setPinned(p);
    });
  }, []);

  if (!pinned && recent.length === 0) return null;
  return (
    <section className="px-4 pt-4 pb-2">
      {pinned && (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-carimbo/40 bg-carimbo-claro py-1.5 pr-1 pl-3 text-[13px] text-carimbo">
          <Pin size={14} aria-hidden className="shrink-0" />
          <span className="min-w-0 flex-1 truncate">
            {t('popup.pinned', [displayName(pinned)])}
          </span>
          <IconButton
            label={t('popup.unpin')}
            className="text-carimbo hover:bg-ficha/60 hover:text-carimbo"
            onClick={async () => {
              await historyService.pin(undefined);
              setPinned(undefined);
            }}
          >
            <PinOff size={15} />
          </IconButton>
        </div>
      )}
      {recent.length > 0 && (
        <>
          <h2 className="mb-1 text-[13px] font-semibold text-grafite">{t('popup.recent')}</h2>
          <ul className="flex flex-col">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center gap-2.5 py-1">
                <span aria-hidden className={`h-7 w-1 shrink-0 rounded-full ${TIPO_BG[r.tipo]}`} />
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-sm font-medium">
                    {r.favorite && <span className="text-carimbo">★ </span>}
                    {displayName(r)}
                  </span>
                  <span className="block truncate text-xs text-grafite">
                    {t(`history.${r.tipo}`)}, {r.uses.at(-1)?.domain}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  className="text-caneta hover:text-caneta-forte"
                  onClick={() => onReuse(r.id)}
                >
                  {t('popup.reuse')}
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
