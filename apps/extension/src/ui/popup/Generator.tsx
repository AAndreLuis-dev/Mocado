import { RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { defaultOptions, GENERATORS, type GeneratorDef } from '../../domain/generators';
import { fieldLabel, genLabel, optionLabel, t } from '../../infra/browser/i18n';
import { CopyButton, IconButton, Select } from '../components/controls';
import { FieldList, Ficha, Stamp } from '../components/ficha';
import { load, save } from './local';

const byId = (id: string) => GENERATORS.find((g) => g.id === id) ?? GENERATORS[0]!;

/** Standalone generators: pick one, tweak its options, copy the value. */
export function Generator({ masked }: { masked: boolean }) {
  const [gen, setGen] = useState<GeneratorDef>(() => byId(load('mocado.gen', 'cpf')));
  const [opts, setOpts] = useState<Record<string, string>>(() => defaultOptions(gen));
  const [round, setRound] = useState(0); // every change generates a new value

  const result = useMemo(() => (void round, gen.run(opts, masked)), [gen, opts, masked, round]);
  const entries = typeof result === 'string' ? null : Object.entries(result).filter(([, v]) => v);

  return (
    <section className="px-4 pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label={t('popup.generator')}
          className="min-w-0 flex-1"
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
        </Select>
        <IconButton
          label={t('popup.generate')}
          className="border border-linha bg-ficha"
          onClick={() => setRound((r) => r + 1)}
        >
          <RefreshCw size={15} />
        </IconButton>
      </div>

      {gen.options && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-2">
          {Object.entries(gen.options).map(([key, values]) => (
            <label key={key} className="flex items-center gap-1.5 text-xs text-grafite">
              {optionLabel(key)}
              <Select
                value={opts[key] ?? ''}
                onChange={(e) => setOpts({ ...opts, [key]: e.target.value })}
              >
                {values.map((v) => (
                  <option key={v} value={v}>
                    {key === 'uf' && v ? v : optionLabel(v)}
                  </option>
                ))}
              </Select>
            </label>
          ))}
        </div>
      )}

      <Ficha className="mt-3">
        <div className="flex items-start justify-between gap-2 px-4 pt-2">
          <span className="text-xs text-grafite">{genLabel(gen.id)}</span>
          <Stamp replay={`${gen.id}:${round}:${JSON.stringify(opts)}:${masked}`} decorative>
            {t('popup.fictitious')}
          </Stamp>
        </div>
        {entries === null ? (
          <div className="px-4 pt-1 pb-4">
            <output
              data-testid="result"
              className="block font-mono text-[22px] leading-tight font-medium break-all tabular-nums"
            >
              {result as string}
            </output>
            <div className="mt-3">
              <CopyButton value={result as string} />
            </div>
          </div>
        ) : (
          <div className="px-4 pb-3">
            <FieldList
              entries={entries}
              labelOf={fieldLabel}
              className="max-h-64 overflow-y-auto"
            />
            <div className="mt-2 border-t border-pauta pt-3">
              <CopyButton
                value={entries.map(([k, v]) => `${fieldLabel(k)}: ${v}`).join('\n')}
                text={t('popup.copyAll')}
              />
            </div>
          </div>
        )}
      </Ficha>
    </section>
  );
}
