import { useState } from 'react';
import { createRoot } from 'react-dom/client';

const FIELDS = [
  ['razaoSocial', 'Razão social'],
  ['nomeFantasia', 'Nome fantasia'],
  ['cnpj', 'CNPJ'],
  ['inscricaoEstadual', 'Inscrição estadual'],
  ['dataAbertura', 'Data de abertura'],
  ['email', 'E-mail'],
  ['telefone', 'Telefone'],
  ['cep', 'CEP'],
  ['endereco', 'Endereço'],
  ['numero', 'Número'],
  ['bairro', 'Bairro'],
  ['cidade', 'Cidade'],
  ['responsavel', 'Nome do responsável'],
  ['cpfResponsavel', 'CPF do responsável'],
] as const;

type State = Record<(typeof FIELDS)[number][0] | 'uf', string>;

function App() {
  const [state, setState] = useState<State>(
    () => Object.fromEntries([...FIELDS.map(([k]) => [k, '']), ['uf', '']]) as State,
  );
  const set = (k: keyof State) => (e: { target: { value: string } }) =>
    setState((s) => ({ ...s, [k]: e.target.value }));
  return (
    <>
      <h1>Cadastro de empresa (React)</h1>
      <form onSubmit={(e) => e.preventDefault()}>
        {FIELDS.map(([k, label]) => (
          <label key={k}>
            {label}
            <input
              name={k}
              type={k === 'dataAbertura' ? 'date' : 'text'}
              value={state[k]}
              onChange={set(k)}
            />
          </label>
        ))}
        <label>
          UF
          <select name="uf" value={state.uf} onChange={set('uf')}>
            <option value="">Selecione</option>
            {'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'
              .split(' ')
              .map((uf) => (
                <option key={uf}>{uf}</option>
              ))}
          </select>
        </label>
        <button>Salvar</button>
      </form>
      <h2>Estado React</h2>
      <pre data-testid="state">{JSON.stringify(state, null, 2)}</pre>
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
