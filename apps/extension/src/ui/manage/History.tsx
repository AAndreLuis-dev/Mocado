import { ChevronDown, Download, Pin, Star, Trash2, Upload, WandSparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  domains,
  generatedName,
  keyValues,
  orderedValues,
  type HistoryRecord,
} from '../../domain/profile';
import { fieldLabel, plural, t } from '../../infra/browser/i18n';
import { historyService } from '../../infra/container';
import { watchStorage } from '../../infra/storage/stores';
import { Button, CopyIconButton, IconButton } from '../components/controls';
import { KIND_COLOR } from '../components/brand';
import {
  Box,
  FormGrid,
  LONG_FIELDS,
  PenCheck,
  PenInput,
  PenSelect,
  ValueBox,
} from '../components/form';

const when = (at: number) =>
  new Date(at).toLocaleString(document.documentElement.lang || undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });

function Record({
  r,
  pinned,
  onChange,
}: {
  r: HistoryRecord;
  pinned: boolean;
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [label, setLabel] = useState(r.label);
  const favLabel = r.favorite ? t('history.unfavorite') : t('history.favorite');
  const labelId = `label-${r.id}`;

  return (
    <li data-testid="record" className="border-t border-linha py-7 first:border-t-0 first:pt-2">
      <div className="mb-3 flex items-center gap-2.5">
        <h3 className="min-w-0 truncate text-[19px] font-bold tracking-tight">
          {generatedName(r)}
        </h3>
        <span className={`shrink-0 text-xs font-semibold ${KIND_COLOR[r.tipo]}`}>
          {t(`history.${r.tipo}`)}
        </span>
        {pinned && (
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-carimbo">
            <Pin size={12} aria-hidden />
            {t('history.pinnedStamp')}
          </span>
        )}
        <IconButton
          label={favLabel}
          aria-pressed={r.favorite}
          className={`ml-auto ${r.favorite ? 'text-carimbo hover:text-carimbo' : ''}`}
          onClick={() => void historyService.setFavorite(r.id, !r.favorite).then(onChange)}
        >
          <Star size={18} fill={r.favorite ? 'currentColor' : 'none'} />
        </IconButton>
      </div>

      <FormGrid cols={4} className="sm:grid-flow-row-dense">
        <Box label={t('history.label')} htmlFor={labelId}>
          <PenInput
            id={labelId}
            aria-label={t('history.labelAria')}
            placeholder={t('history.labelPlaceholder')}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={() =>
              label !== r.label && void historyService.rename(r.id, label).then(onChange)
            }
          />
        </Box>
        {keyValues(r.values).map(([k, v]) => (
          <ValueBox key={k} label={fieldLabel(k)} value={v} />
        ))}
        <Box span="full">
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-grafite">
            {t('history.usedIn')}:
            {r.uses.map((u, i) => (
              <span key={i} title={u.url}>
                {i > 0 && <span className="mr-1.5">,</span>}
                <span className="font-semibold text-tinta">{u.domain}</span> {when(u.at)}
              </span>
            ))}
          </p>
        </Box>
        {open &&
          orderedValues(r.values).map(([k, v]) => (
            <ValueBox
              key={k}
              label={fieldLabel(k)}
              value={v}
              span={LONG_FIELDS.has(k) ? 2 : 1}
              action={<CopyIconButton value={v} label={fieldLabel(k)} />}
            />
          ))}
      </FormGrid>

      {pinned && <p className="mt-2 text-xs text-carimbo">{t('history.pinnedHint')}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          variant="primary"
          icon={<WandSparkles size={15} />}
          onClick={() => void historyService.pin(pinned ? undefined : r.id).then(onChange)}
        >
          {pinned ? t('popup.unpin') : t('history.reuse')}
        </Button>
        <Button
          aria-expanded={open}
          icon={
            <ChevronDown size={15} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          }
          onClick={() => setOpen(!open)}
        >
          {open ? t('history.hide') : t('history.details')}
        </Button>
        <Button
          variant={confirm ? 'danger' : 'ghost'}
          className="ml-auto"
          icon={<Trash2 size={15} />}
          onClick={async () => {
            if (!confirm) return setConfirm(true);
            await historyService.remove(r.id);
            onChange();
          }}
          onBlur={() => setConfirm(false)}
        >
          {confirm ? t('history.confirmDelete') : t('history.delete')}
        </Button>
      </div>
    </li>
  );
}

export function History() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [all, setAll] = useState<HistoryRecord[]>([]);
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [pinned, setPinnedId] = useState<string>();
  const [message, setMessage] = useState<{ text: string; error?: boolean }>();
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  useEffect(() => {
    let alive = true;
    void Promise.all([
      historyService.search({ query, domain, favoritesOnly }),
      historyService.pinnedId(),
    ]).then(([found, pin]) => {
      if (!alive) return;
      setRecords(found.records);
      setAll(found.all);
      setPinnedId(pin);
    });
    return () => {
      alive = false;
    };
  }, [query, domain, favoritesOnly, version]);

  useEffect(() => watchStorage(['history', 'pinned'], refresh), []);

  async function exportJson() {
    const data = await historyService.exportFile();
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `mocado-historico-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importJson(file: File) {
    try {
      const count = await historyService.importFile(JSON.parse(await file.text()));
      setMessage({ text: plural('history.imported', count) });
      refresh();
    } catch {
      setMessage({ text: t('history.importError'), error: true });
    }
  }

  return (
    <section>
      <FormGrid cols={4}>
        <Box span={2} label={t('history.searchLabel')} htmlFor="q">
          <PenInput
            id="q"
            type="search"
            aria-label={t('history.search')}
            placeholder={t('history.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Box>
        <Box label={t('history.domain')} htmlFor="domain">
          <PenSelect id="domain" value={domain} onChange={(e) => setDomain(e.target.value)}>
            <option value="">{t('history.allDomains')}</option>
            {domains(all).map((d) => (
              <option key={d}>{d}</option>
            ))}
          </PenSelect>
        </Box>
        <Box className="justify-end pb-2">
          <PenCheck
            label={t('history.favoritesOnly')}
            checked={favoritesOnly}
            onChange={(e) => setFavoritesOnly(e.target.checked)}
          />
        </Box>
      </FormGrid>

      <div className="mt-3 mb-6 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-grafite">
          {plural('history.count', records.length)}
        </span>
        <span className="flex-1" />
        <Button variant="ghost" icon={<Download size={15} />} onClick={exportJson}>
          {t('history.export')}
        </Button>
        <label className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-grafite transition-colors focus-within:outline-2 focus-within:outline-caneta hover:bg-pauta hover:text-tinta">
          <Upload size={15} aria-hidden />
          {t('history.import')}
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importJson(file);
              e.target.value = '';
            }}
          />
        </label>
      </div>

      {message && (
        <p
          role="status"
          className={`mb-6 rounded-lg px-3 py-2 text-sm ${message.error ? 'bg-erro-claro text-erro' : 'bg-caneta-claro text-caneta'}`}
        >
          {message.text}
        </p>
      )}

      {records.length === 0 ? (
        <p className="py-14 text-center text-grafite">
          {all.length ? t('history.noResults') : t('history.empty')}
        </p>
      ) : (
        <ul>
          {records.map((r) => (
            <Record key={`${r.id}:${r.label}`} r={r} pinned={pinned === r.id} onChange={refresh} />
          ))}
        </ul>
      )}
    </section>
  );
}
