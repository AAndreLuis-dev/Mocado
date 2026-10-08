import { useState } from 'react';
import { defaultOptions, GENERATORS, type Result } from '../../domain/generators';
import { fieldLabel, genLabel, optionLabel, t } from '../../infra/browser/i18n';
import { sendToBackground } from '../../infra/browser/messages';
import { activeTabId, openHistory, openOptions } from '../../infra/browser/navigation';
import { Button, CopyButton, selectClass } from '../components';
import { Recent } from './Recent';

const load = (key: string, fallback: string) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};
const save = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* per-viewer convenience only */
  }
};

export function App() {
  const [genId, setGenId] = useState(() => load('mocado.gen', 'cpf'));
  const gen = GENERATORS.find((g) => g.id === genId) ?? GENERATORS[0]!;
  const [opts, setOpts] = useState<Record<string, string>>(() => defaultOptions(gen));
  const [masked, setMasked] = useState(() => load('mocado.masked', '1') === '1');
  const [result, setResult] = useState<Result>(() => gen.run(opts, masked));
  const [status, setStatus] = useState('');

  /** Any change to generator/options/mask regenerates immediately. */
  function update(next: { genId?: string; opts?: Record<string, string>; masked?: boolean }) {
    const g = GENERATORS.find((x) => x.id === (next.genId ?? genId)) ?? gen;
    const o = next.opts ?? opts;
    const m = next.masked ?? masked;
    setGenId(g.id);
    setOpts(o);
    setMasked(m);
    setResult(g.run(o, m));
  }

  async function fillPage(reuseId?: string) {
    const tabId = await activeTabId();
    if (tabId === undefined) return;
    const res = await sendToBackground({ type: 'fill-tab', tabId, reuseId }).catch(() => null);
    if (!res || !res.ok)
      return setStatus(t(res?.error === 'blocked' ? 'popup.blocked' : 'popup.fillError'));
    if (res.filled === 0) return setStatus(t('popup.noFields'));
    window.close();
  }

  const entries =
    typeof result === 'string' ? null : Object.entries(result).filter(([, v]) => v !== '');

  return (
    <main className="flex w-[380px] flex-col gap-3 bg-white p-4 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-tight">{t('extName')}</h1>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={masked}
            onChange={(e) => {
              update({ masked: e.target.checked });
              save('mocado.masked', e.target.checked ? '1' : '0');
            }}
          />
          {t('popup.masked')}
        </label>
      </header>

      <Button variant="primary" className="py-2" onClick={() => fillPage()}>
        {t('popup.fillPage')}
      </Button>
      {status && (
        <p role="status" className="text-sm text-amber-700 dark:text-amber-400">
          {status}
        </p>
      )}

      <section className="flex flex-col gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label={t('popup.generator')}
            className={`${selectClass} flex-1`}
            value={gen.id}
            onChange={(e) => {
              const next = GENERATORS.find((g) => g.id === e.target.value)!;
              update({ genId: next.id, opts: defaultOptions(next) });
              save('mocado.gen', next.id);
            }}
          >
            {GENERATORS.map((g) => (
              <option key={g.id} value={g.id}>
                {genLabel(g.id)}
              </option>
            ))}
          </select>
          <Button onClick={() => update({})}>{t('popup.generate')}</Button>
        </div>

        {gen.options && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(gen.options).map(([key, values]) => (
              <label
                key={key}
                className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400"
              >
                {optionLabel(key)}
                <select
                  className={selectClass}
                  value={opts[key] ?? ''}
                  onChange={(e) => update({ opts: { ...opts, [key]: e.target.value } })}
                >
                  {values.map((v) => (
                    <option key={v} value={v}>
                      {key === 'uf' && v ? v : optionLabel(v)}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        )}

        {entries === null ? (
          <div className="flex items-start gap-2">
            <output
              data-testid="result"
              className="flex-1 break-all rounded-md bg-zinc-100 px-3 py-2 font-mono text-sm dark:bg-zinc-800"
            >
              {result as string}
            </output>
            <CopyButton value={result as string} />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <dl className="max-h-80 overflow-y-auto">
              {entries.map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center gap-2 border-b border-zinc-100 py-1 dark:border-zinc-800"
                >
                  <dt className="w-28 shrink-0 text-xs text-zinc-500">{fieldLabel(k)}</dt>
                  <dd className="flex-1 truncate font-mono text-xs" title={v}>
                    {v}
                  </dd>
                  <CopyButton value={v} label={fieldLabel(k)} />
                </div>
              ))}
            </dl>
            <CopyButton
              value={entries.map(([k, v]) => `${fieldLabel(k)}: ${v}`).join('\n')}
              text={t('popup.copyAll')}
            />
          </div>
        )}
      </section>

      <Recent onReuse={(id) => void fillPage(id)} />

      <nav className="flex gap-3 text-sm">
        <a
          href="#"
          className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
          onClick={(e) => {
            e.preventDefault();
            void openHistory();
          }}
        >
          {t('popup.history')}
        </a>
        <a
          href="#"
          className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
          onClick={(e) => {
            e.preventDefault();
            void openOptions();
          }}
        >
          {t('popup.options')}
        </a>
      </nav>

      <footer className="text-[11px] text-zinc-500">{t('disclaimer')}</footer>
    </main>
  );
}
