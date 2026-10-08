import { useEffect, useState } from 'react';
import { FIELD_TYPES, type FieldType } from '@mocado/core';
import { domains, generatedName, type HistoryRecord } from '../../domain/profile';
import { fieldLabel, plural, t } from '../../infra/browser/i18n';
import { historyService } from '../../infra/container';
import { watchStorage } from '../../infra/storage/stores';
import { Button, CopyButton, selectClass } from '../components';

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
  const when = (at: number) => new Date(at).toLocaleString();
  return (
    <li data-testid="record" className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={r.favorite}
          aria-label={r.favorite ? t('history.unfavorite') : t('history.favorite')}
          title={r.favorite ? t('history.unfavorite') : t('history.favorite')}
          className={`text-xl leading-none ${r.favorite ? 'text-amber-500' : 'text-zinc-400 hover:text-amber-500'}`}
          onClick={async () => {
            await historyService.setFavorite(r.id, !r.favorite);
            onChange();
          }}
        >
          {r.favorite ? '★' : '☆'}
        </button>
        <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
          {t(`history.${r.tipo}`)}
        </span>
        <strong className="truncate">{generatedName(r)}</strong>
        <input
          aria-label={t('history.labelAria')}
          placeholder={t('history.labelPlaceholder')}
          className="min-w-40 flex-1 rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-sm dark:border-zinc-600"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => label !== r.label && historyService.rename(r.id, label).then(onChange)}
        />
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        {t('history.usedIn')}:{' '}
        {r.uses.map((u, i) => (
          <span key={i} title={u.url}>
            {i > 0 && ', '}
            {u.domain} ({when(u.at)})
          </span>
        ))}
      </p>
      {pinned && (
        <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
          {t('history.pinnedHint')}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        <Button onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? t('history.hide') : t('history.details')}
        </Button>
        <Button
          variant="primary"
          onClick={async () => {
            await historyService.pin(pinned ? undefined : r.id);
            onChange();
          }}
        >
          {pinned ? t('popup.unpin') : t('history.reuse')}
        </Button>
        <Button
          onClick={async () => {
            if (!confirm) return setConfirm(true);
            await historyService.remove(r.id);
            onChange();
          }}
          onBlur={() => setConfirm(false)}
          className={confirm ? '!border-red-600 !text-red-700 dark:!text-red-400' : ''}
        >
          {confirm ? t('history.confirmDelete') : t('history.delete')}
        </Button>
      </div>
      {open && (
        <dl className="mt-2 grid grid-cols-[minmax(8rem,auto)_1fr_auto] items-center gap-x-2 gap-y-1 text-sm">
          {Object.entries(r.values)
            // storage.local returns keys sorted alphabetically; show them in form order
            .sort(
              ([a], [b]) =>
                FIELD_TYPES.indexOf(a as FieldType) - FIELD_TYPES.indexOf(b as FieldType),
            )
            .map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-xs text-zinc-500">{fieldLabel(k)}</dt>
                <dd className="truncate font-mono text-xs" title={v}>
                  {v}
                </dd>
                <CopyButton value={v ?? ''} label={fieldLabel(k)} />
              </div>
            ))}
        </dl>
      )}
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
  const [message, setMessage] = useState('');
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

  // Fills happen in other tabs: refresh when storage changes.
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
      setMessage(plural('history.imported', n));
      refresh();
    } catch {
      setMessage(t('history.importError'));
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          aria-label={t('history.search')}
          placeholder={t('history.search')}
          className="min-w-64 flex-1 rounded-md border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-600"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label={t('history.allDomains')}
          className={selectClass}
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
        >
          <option value="">{t('history.allDomains')}</option>
          {domains(all).map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={favoritesOnly}
            onChange={(e) => setFavoritesOnly(e.target.checked)}
          />
          {t('history.favoritesOnly')}
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-zinc-500">{plural('history.count', records.length)}</span>
        <span className="flex-1" />
        <Button onClick={exportJson}>{t('history.export')}</Button>
        <label className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 focus-within:outline-2 focus-within:outline-emerald-600 dark:border-zinc-600 dark:hover:bg-zinc-700">
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
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
          {message}
        </p>
      )}
      {records.length === 0 ? (
        <p className="py-8 text-center text-zinc-500">
          {all.length ? t('history.noResults') : t('history.empty')}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {records.map((r) => (
            <Record key={`${r.id}:${r.label}`} r={r} pinned={pinned === r.id} onChange={refresh} />
          ))}
        </ul>
      )}
    </section>
  );
}
