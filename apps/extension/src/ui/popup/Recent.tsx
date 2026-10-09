import { ChevronDown, Pin, PinOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { displayName, type HistoryRecord } from '../../domain/profile';
import { t } from '../../infra/browser/i18n';
import { historyService } from '../../infra/container';
import { Button, IconButton } from '../components/controls';
import { KIND_COLOR } from '../components/brand';
import { Band } from '../components/form';

const VISIBLE = 3;

export function Recent({ onReuse }: { onReuse: (id: string) => void }) {
  const [recent, setRecent] = useState<HistoryRecord[]>([]);
  const [pinned, setPinned] = useState<HistoryRecord>();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    void Promise.all([historyService.recent(20), historyService.pinned()]).then(([r, p]) => {
      setRecent(r);
      setPinned(p);
    });
  }, []);

  if (!pinned && recent.length === 0) return null;
  const shown = expanded ? recent : recent.slice(0, VISIBLE);
  return (
    <section className="mt-5">
      <Band>{t('popup.recent')}</Band>
      {pinned && (
        <div className="mt-1 flex items-center gap-2 px-2 text-carimbo">
          <Pin size={14} className="shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
            {t('popup.pinned', [displayName(pinned)])}
          </span>
          <IconButton
            label={t('popup.unpin')}
            className="size-7 text-carimbo hover:text-carimbo"
            onClick={async () => {
              await historyService.pin(undefined);
              setPinned(undefined);
            }}
          >
            <PinOff size={15} />
          </IconButton>
        </div>
      )}
      <ul className={`mt-1 ${expanded ? 'max-h-64 overflow-y-auto' : ''}`}>
        {shown.map((r) => (
          <li
            key={r.id}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-papel"
          >
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-semibold">
                {r.favorite && <span className="text-carimbo">★ </span>}
                {displayName(r)}
              </span>
              <span className="block truncate text-xs text-grafite">
                <span className={`font-semibold ${KIND_COLOR[r.tipo]}`}>
                  {t(`history.${r.tipo}`)}
                </span>
                {' · '}
                {r.uses.at(-1)?.domain}
              </span>
            </span>
            <Button
              variant="ghost"
              className="min-h-7 text-caneta! hover:text-caneta-forte!"
              onClick={() => onReuse(r.id)}
            >
              {t('popup.reuse')}
            </Button>
          </li>
        ))}
      </ul>
      {recent.length > VISIBLE && (
        <Button
          variant="ghost"
          aria-expanded={expanded}
          className="mt-0.5 min-h-7 w-full text-xs"
          icon={
            <ChevronDown
              size={14}
              className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          }
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? t('popup.showLess') : t('popup.showMore', [recent.length - VISIBLE])}
        </Button>
      )}
    </section>
  );
}
