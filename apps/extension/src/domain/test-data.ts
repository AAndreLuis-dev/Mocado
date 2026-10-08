import { newRecord, type HistoryRecord } from './profile';

/** A person record used on app.test at `at`; `over` replaces any field. */
export const rec = (over: Partial<HistoryRecord> = {}, at = 1000): HistoryRecord => ({
  ...newRecord(
    'pessoa',
    { nome: 'João Araújo Silva', cpf: '123.456.789-09', email: 'joao@example.com' },
    { domain: 'app.test', url: 'https://app.test/cadastro', at },
  ),
  ...over,
});
