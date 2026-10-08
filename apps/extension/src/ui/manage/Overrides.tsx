import { FIELD_TYPES, type FieldType } from '@mocado/core';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Overrides as Data } from '../../domain/overrides';
import { fieldLabel, t } from '../../infra/browser/i18n';
import { preferences } from '../../infra/container';
import { Button, IconButton, Select } from '../components/controls';
import { Ficha } from '../components/ficha';

export function Overrides() {
  const [data, setData] = useState<Data>({});
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  useEffect(() => {
    void preferences.overrides().then(setData);
  }, [version]);

  const hosts = Object.keys(data).sort();
  if (hosts.length === 0)
    return (
      <Ficha className="border-dashed">
        <p className="px-6 py-12 text-center text-grafite">{t('overrides.empty')}</p>
      </Ficha>
    );

  return (
    <div className="flex flex-col gap-4">
      {hosts.map((host) => (
        <Ficha key={host} perforated={false}>
          <div className="px-5 pt-3 pb-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="truncate text-[17px] font-bold">{host}</h2>
              <Button
                variant="ghost"
                onClick={() => void preferences.removeOverride(host).then(refresh)}
              >
                {t('overrides.removeDomain')}
              </Button>
            </div>
            <ul className="mt-2 flex flex-col divide-y divide-pauta">
              {Object.entries(data[host] ?? {}).map(([selector, type]) => (
                <li
                  key={selector}
                  data-testid="override"
                  className="flex flex-wrap items-center gap-2 py-2"
                >
                  <code
                    className="min-w-0 flex-1 truncate rounded bg-papel px-2 py-1 font-mono text-xs text-grafite"
                    title={selector}
                  >
                    {selector}
                  </code>
                  <Select
                    aria-label={selector}
                    value={type}
                    onChange={(e) =>
                      void preferences
                        .setOverride(host, selector, e.target.value as FieldType)
                        .then(refresh)
                    }
                  >
                    {FIELD_TYPES.map((ft) => (
                      <option key={ft} value={ft}>
                        {fieldLabel(ft)}
                      </option>
                    ))}
                  </Select>
                  <IconButton
                    label={t('overrides.remove')}
                    className="hover:bg-erro-claro hover:text-erro"
                    onClick={() => void preferences.removeOverride(host, selector).then(refresh)}
                  >
                    <X size={16} />
                  </IconButton>
                </li>
              ))}
            </ul>
          </div>
        </Ficha>
      ))}
    </div>
  );
}
