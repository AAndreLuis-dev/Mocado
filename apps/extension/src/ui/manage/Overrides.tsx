import { FIELD_TYPES, type FieldType } from '@mocado/core';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Overrides as Data } from '../../domain/overrides';
import { fieldLabel, t } from '../../infra/browser/i18n';
import { preferences } from '../../infra/container';
import { Button } from '../components/controls';
import { Band, Box, FormGrid, PenSelect } from '../components/form';

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
      <p className="border-2 border-dashed border-linha px-6 py-14 text-center text-grafite">
        {t('overrides.empty')}
      </p>
    );

  return (
    <div className="flex flex-col gap-6">
      {hosts.map((host) => (
        <FormGrid key={host} cols={4}>
          <Band
            aside={
              <Button
                variant="ghost"
                className="min-h-7 text-xs"
                onClick={() => void preferences.removeOverride(host).then(refresh)}
              >
                {t('overrides.removeDomain')}
              </Button>
            }
          >
            {host}
          </Band>
          {Object.entries(data[host] ?? {}).map(([selector, type], i) => {
            const id = `ov-${host}-${i}`;
            return (
              <div key={selector} data-testid="override" className="contents">
                <Box span={2} label={t('overrides.selector')}>
                  <code className="truncate font-mono text-[13px] text-tinta" title={selector}>
                    {selector}
                  </code>
                </Box>
                <Box label={t('overrides.type')} htmlFor={id}>
                  <PenSelect
                    id={id}
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
                  </PenSelect>
                </Box>
                <Box className="items-start justify-center">
                  <Button
                    variant="ghost"
                    icon={<X size={15} />}
                    className="hover:bg-erro-claro hover:text-erro"
                    onClick={() => void preferences.removeOverride(host, selector).then(refresh)}
                  >
                    {t('overrides.remove')}
                  </Button>
                </Box>
              </div>
            );
          })}
        </FormGrid>
      ))}
    </div>
  );
}
