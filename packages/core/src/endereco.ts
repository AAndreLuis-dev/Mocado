import { type Generator } from './types';
import { defaultRng, digits, int, pick, type Rng } from './rng';
import { maskIf, onlyDigits } from './mask';
import { UFS, type UF } from './uf';
import CEPS from './data/ceps.json' with { type: 'json' };

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: UF;
}

// Correios CEP ranges per UF (first 5 digits).
// prettier-ignore
const FAIXAS: [UF, number, number][] = [
  ['SP', 1000, 19999], ['RJ', 20000, 28999], ['ES', 29000, 29999], ['MG', 30000, 39999],
  ['BA', 40000, 48999], ['SE', 49000, 49999], ['PE', 50000, 56999], ['AL', 57000, 57999],
  ['PB', 58000, 58999], ['RN', 59000, 59999], ['CE', 60000, 63999], ['PI', 64000, 64999],
  ['MA', 65000, 65999], ['PA', 66000, 68899], ['AP', 68900, 68999], ['AM', 69000, 69299],
  ['RR', 69300, 69399], ['AM', 69400, 69899], ['AC', 69900, 69999], ['DF', 70000, 72799],
  ['GO', 72800, 72999], ['DF', 73000, 73699], ['GO', 73700, 76799], ['RO', 76800, 76999],
  ['TO', 77000, 77999], ['MT', 78000, 78899], ['MS', 79000, 79999], ['PR', 80000, 87999],
  ['SC', 88000, 89999], ['RS', 90000, 99999],
];

export const cepUF = (value: string): UF | undefined => {
  const n = Number(onlyDigits(value).slice(0, 5));
  return FAIXAS.find(([, a, b]) => n >= a && n <= b)?.[0];
};

/** CEP inside a UF range (format-level validity; not every such CEP exists). */
export const cep: Generator<{ uf?: UF }> = {
  generate({ uf, rng = defaultRng, masked = true } = {}) {
    const target = uf ?? pick(rng, UFS);
    const [, a, b] = pick(
      rng,
      FAIXAS.filter(([u]) => u === target),
    );
    return cep.format(String(int(rng, a, b)).padStart(5, '0') + digits(rng, 3), { masked });
  },
  validate(value, { uf } = {}) {
    const v = onlyDigits(value);
    if (v.length !== 8 || /[^\d\s.-]/.test(value)) return false;
    const found = cepUF(v);
    return uf ? found === uf : !!found;
  },
  format: (value, { masked }) => maskIf(onlyDigits(value), '#####-###', masked),
};

const COMPLEMENTOS = ['', '', '', 'Casa', 'Casa 2', 'Fundos', 'Sala 3'];

/** Real CEP + street + district + city (bundled ViaCEP sample), random number/complement. */
export function endereco({
  uf,
  rng = defaultRng,
  masked = true,
}: { uf?: UF; rng?: Rng; masked?: boolean } = {}): Endereco {
  const target = uf ?? pick(rng, UFS);
  const base = pick(
    rng,
    CEPS.filter((e) => e.uf === target),
  );
  const apto = rng() < 0.25 ? `Apto ${int(rng, 1, 20)}${pick(rng, ['01', '02', '03', '04'])}` : '';
  return {
    cep: cep.format(base.cep, { masked }),
    logradouro: base.logradouro,
    numero: String(int(rng, 1, 3999)),
    complemento: apto || pick(rng, COMPLEMENTOS),
    bairro: base.bairro,
    cidade: base.cidade,
    uf: target,
  };
}
