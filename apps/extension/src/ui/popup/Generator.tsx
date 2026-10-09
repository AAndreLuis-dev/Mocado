import { RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { defaultOptions, GENERATORS, type GeneratorDef } from '../../domain/generators';
import { fieldLabel, genLabel, optionLabel, t } from '../../infra/browser/i18n';
import { Button, CopyButton, CopyIconButton } from '../components/controls';
import {
  Band,
  Box,
  FormGrid,
  LONG_FIELDS,
  pen,
  PenCheck,
  PenSelect,
  ValueBox,
} from '../components/form';
import { load, save } from './local';

const byId = (id: string) => GENERATORS.find((g) => g.id === id) ?? GENERATORS[0]!;

export function Generator() {
  const [gen, setGen] = useState<GeneratorDef>(() => byId(load('mocado.gen', 'cpf')));
  const [opts, setOpts] = useState<Record<string, string>>(() => defaultOptions(gen));
  const [masked, setMasked] = useState(() => load('mocado.masked', '1') === '1');
  const [round, setRound] = useState(0);

  const result = useMemo(() => (void round, gen.run(opts, masked)), [gen, opts, masked, round]);
  const entries = typeof result === 'string' ? null : Object.entries(result).filter(([, v]) => v);
  const optionEntries = Object.entries(gen.options ?? {});

  return (
    <FormGrid cols={2} fixed>
      <Band
        aside={
          <Button
            variant="ghost"
            className="-mr-2 min-h-7 text-xs"
            icon={<RefreshCw size={13} />}
            onClick={() => setRound((r) => r + 1)}
          >
            {t('popup.generate')}
          </Button>
        }
      >
        {t('popup.standalone')}
      </Band>
      <Box label={t('popup.generator')} htmlFor="gen" span="full">
        <PenSelect
          id="gen"
          value={gen.id}
          onChange={(e) => {
            const next = byId(e.target.value);
            setGen(next);
            setOpts(defaultOptions(next));
            save('mocado.gen', next.id);
          }}
        >
          {GENERATORS.map((g) => (
            <option key={g.id} value={g.id}>
              {genLabel(g.id)}
            </option>
          ))}
        </PenSelect>
      </Box>
      {optionEntries.map(([key, values]) => (
        <Box key={key} label={optionLabel(key)} htmlFor={`opt-${key}`}>
          <PenSelect
            id={`opt-${key}`}
            value={opts[key] ?? ''}
            onChange={(e) => setOpts({ ...opts, [key]: e.target.value })}
          >
            {values.map((v) => (
              <option key={v} value={v}>
                {key === 'uf' && v ? v : optionLabel(v)}
              </option>
            ))}
          </PenSelect>
        </Box>
      ))}
      <Box span={optionEntries.length % 2 ? 1 : 'full'} className="justify-end pb-1.5">
        <PenCheck
          label={t('popup.masked')}
          checked={masked}
          onChange={(e) => {
            setMasked(e.target.checked);
            save('mocado.masked', e.target.checked ? '1' : '0');
          }}
        />
      </Box>

      {entries === null ? (
        <div className="col-span-full flex items-center gap-3 border-t border-linha pt-3">
          <output
            data-testid="result"
            className={`min-w-0 flex-1 font-mono text-[20px] leading-tight break-all tabular-nums ${pen}`}
          >
            {result as string}
          </output>
          <CopyButton value={result as string} />
        </div>
      ) : (
        <>
          <div
            data-testid="result-fields"
            className="col-span-full max-h-72 overflow-y-auto border-t border-linha pt-3"
          >
            <FormGrid cols={2} fixed className="grid-flow-row-dense">
              {entries.map(([k, v]) => (
                <ValueBox
                  key={k}
                  label={fieldLabel(k)}
                  value={v}
                  span={LONG_FIELDS.has(k) ? 'full' : 1}
                  action={<CopyIconButton value={v} label={fieldLabel(k)} />}
                />
              ))}
            </FormGrid>
          </div>
          <div className="col-span-full">
            <CopyButton
              value={entries.map(([k, v]) => `${fieldLabel(k)}: ${v}`).join('\n')}
              text={t('popup.copyAll')}
            />
          </div>
        </>
      )}
    </FormGrid>
  );
}
