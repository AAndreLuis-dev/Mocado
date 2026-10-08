import { useEffect, useState } from 'react';
import { FIELD_TYPES, type FieldType } from '@mocado/core';
import type { Overrides as Data } from '../../domain/overrides';
import { fieldLabel, t } from '../../infra/browser/i18n';
import { preferences } from '../../infra/container';
import { Button, selectClass } from '../components';

export function Overrides() {
  const [data, setData] = useState<Data>({});
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  useEffect(() => {
    void preferences.overrides().then(setData);
  }, [version]);

  const hosts = Object.keys(data).sort();
  return (
    <section className="flex flex-col gap-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t('overrides.hint')}</p>
      {hosts.length === 0 && (
        <p className="py-6 text-center text-zinc-500">{t('overrides.empty')}</p>
      )}
      {hosts.map((host) => (
        <div key={host} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">{host}</h2>
            <Button onClick={() => preferences.removeOverride(host).then(refresh)}>
              {t('overrides.removeDomain')}
            </Button>
          </div>
          <ul className="mt-2 flex flex-col gap-1">
            {Object.entries(data[host] ?? {}).map(([selector, type]) => (
              <li
                key={selector}
                data-testid="override"
                className="flex flex-wrap items-center gap-2 text-sm"
              >
                <code
                  className="flex-1 truncate rounded bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800"
                  title={selector}
                >
                  {selector}
                </code>
                <select
                  aria-label={selector}
                  className={selectClass}
                  value={type}
                  onChange={(e) =>
                    preferences
                      .setOverride(host, selector, e.target.value as FieldType)
                      .then(refresh)
                  }
                >
                  {FIELD_TYPES.map((ft) => (
                    <option key={ft} value={ft}>
                      {fieldLabel(ft)}
                    </option>
                  ))}
                </select>
                <Button onClick={() => preferences.removeOverride(host, selector).then(refresh)}>
                  {t('overrides.remove')}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
