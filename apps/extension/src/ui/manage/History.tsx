import { ChevronDown, Download, Search, Star, Trash2, Upload, WandSparkles } from 'lucide-react';
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
import { Button, IconButton, inputClass, Select } from '../components/controls';
import { FieldList, Ficha, Stamp, TIPO_BG } from '../components/ficha';

const when = (at: number) =>
  new Date(at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });

/** One profile as an index card: a file tab with its kind, key values, where it was used. */
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

  return (
    <li data-testid="record" className="relative pt-4">
      <span
        className={`absolute top-0 left-4 rounded-t-md px-2.5 pt-0.5 pb-1 text-[11px] font-bold ${TIPO_BG[r.tipo]}`}
      >
        {t(`history.${r.tipo}`)}
      </span>
      <Ficha className={pinned ? 'ring-2 ring-carimbo/50' : ''}>
        <div className="flex flex-col gap-3 px-4 pt-2 pb-4">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[17px] font-bold">{generatedName(r)}</h3>
              <input
                aria-label={t('history.labelAria')}
                placeholder={t('history.labelPlaceholder')}
                className="mt-0.5 w-full max-w-sm border-0 border-b border-dashed border-linha bg-transparent px-0 py-0.5 text-sm text-caneta placeholder:text-grafite/70 focus:border-caneta focus:outline-none"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onBlur={() =>
                  label !== r.label && void historyService.rename(r.id, label).then(onChange)
                }
              />
            </div>
            {pinned && <Stamp className="mt-1 shrink-0">{t('history.pinnedStamp')}</Stamp>}
            <IconButton
              label={favLabel}
              aria-pressed={r.favorite}
              className={r.favorite ? 'text-carimbo hover:text-carimbo' : ''}
              onClick={() => void historyService.setFavorite(r.id, !r.favorite).then(onChange)}
            >
              <Star size={18} fill={r.favorite ? 'currentColor' : 'none'} />
            </IconButton>
          </div>

          <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-3">
            {keyValues(r.values).map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-[11px] text-grafite">{fieldLabel(k)}</dt>
                <dd className="truncate font-mono text-[13px] tabular-nums" title={v}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>

          <p className="flex flex-wrap items-center gap-1.5 text-xs text-grafite">
            {t('history.usedIn')}:
            {r.uses.map((u, i) => (
              <span
                key={i}
                title={u.url}
                className="rounded border border-pauta bg-papel px-1.5 py-0.5"
              >
                <span className="font-semibold text-tinta">{u.domain}</span> {when(u.at)}
              </span>
            ))}
          </p>
          {pinned && <p className="-mt-1 text-xs text-carimbo">{t('history.pinnedHint')}</p>}

          <div className="flex flex-wrap items-center gap-2">
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
                <ChevronDown
                  size={15}
                  className={`transition-transform ${open ? 'rotate-180' : ''}`}
                />
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

          {open && (
            <FieldList
              entries={orderedValues(r.values)}
              labelOf={fieldLabel}
              className="border-t border-pauta sm:columns-2 sm:gap-8 [&>div]:break-inside-avoid"
            />
          )}
        </div>
      </Ficha>
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

  // Fills happen in other tabs: refresh when the history changes.
  useEffect(() => watchStorage(['history', 'pinned'], refresh), []);

  async function exportJson() {
    const data = await historyService.exportFile();
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `mocado-historico-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importJson(file: File) {
    try {
      const n = await historyService.importFile(JSON.parse(await file.text()));
      setMessage({ text: plural('history.imported', n) });
      refresh();
    } catch {
      setMessage({ text: t('history.importError'), error: true });
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-60 flex-1">
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-grafite"
          />
          <input
            type="search"
            aria-label={t('history.search')}
            placeholder={t('history.search')}
            className={`${inputClass} h-10 w-full rounded-lg pl-9 text-[15px]`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <Select
          aria-label={t('history.allDomains')}
          className="[&>select]:h-10 [&>select]:rounded-lg"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
        >
          <option value="">{t('history.allDomains')}</option>
          {domains(all).map((d) => (
            <option key={d}>{d}</option>
          ))}
        </Select>
        <Button
          aria-pressed={favoritesOnly}
          className={`h-10 rounded-lg ${favoritesOnly ? 'border-carimbo/50 bg-carimbo-claro text-carimbo' : ''}`}
          icon={<Star size={15} fill={favoritesOnly ? 'currentColor' : 'none'} />}
          onClick={() => setFavoritesOnly(!favoritesOnly)}
        >
          {t('history.favoritesOnly')}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
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
              const f = e.target.files?.[0];
              if (f) void importJson(f);
              e.target.value = '';
            }}
          />
        </label>
      </div>

      {message && (
        <p
          role="status"
          className={`rounded-md px-3 py-2 text-sm ${message.error ? 'bg-erro-claro text-erro' : 'bg-caneta-claro text-caneta'}`}
        >
          {message.text}
        </p>
      )}

      {records.length === 0 ? (
        <Ficha className="border-dashed">
          <p className="px-6 py-12 text-center text-grafite">
            {all.length ? t('history.noResults') : t('history.empty')}
          </p>
        </Ficha>
      ) : (
        <ul className="flex flex-col gap-3">
          {records.map((r) => (
            <Record key={`${r.id}:${r.label}`} r={r} pinned={pinned === r.id} onChange={refresh} />
          ))}
        </ul>
      )}
    </section>
  );
}
