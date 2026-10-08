import { PinOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { displayName, type HistoryRecord } from '../../domain/profile';
import { t } from '../../infra/browser/i18n';
import { historyService } from '../../infra/container';
import { Button, IconButton } from '../components/controls';
import { Stamp, TIPO_BG } from '../components/brand';
import { Band, Box, FormGrid } from '../components/form';

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
    <FormGrid cols={2} fixed bare className="border-l border-tinta/25">
      <Band>{t('popup.recent')}</Band>
      {pinned && (
        <Box span="full" dense className="flex-row items-center gap-2 bg-carimbo-claro/60">
          <Stamp className="shrink-0">{t('history.pinnedStamp')}</Stamp>
          <span className="min-w-0 flex-1 truncate text-[13px]">
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
        </Box>
      )}
      {recent.map((r) => (
        <Box key={r.id} span="full" dense className="flex-row items-center gap-2.5">
          <span
            className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-bold ${TIPO_BG[r.tipo]}`}
          >
            {t(`history.${r.tipo}`)}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-sm font-semibold">
              {r.favorite && <span className="text-carimbo">★ </span>}
              {displayName(r)}
            </span>
            <span className="block truncate text-xs text-grafite">{r.uses.at(-1)?.domain}</span>
          </span>
          <Button
            variant="ghost"
            className="min-h-7 text-caneta hover:text-caneta-forte"
            onClick={() => onReuse(r.id)}
          >
            {t('popup.reuse')}
          </Button>
        </Box>
      ))}
    </FormGrid>
  );
}
