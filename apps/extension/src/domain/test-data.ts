import { newRecord, type HistoryRecord } from './profile';

export const rec = (over: Partial<HistoryRecord> = {}, at = 1000): HistoryRecord => ({
  ...newRecord(
    'pessoa',
    { nome: 'João Araújo Silva', cpf: '123.456.789-09', email: 'joao@example.com' },
    { domain: 'app.test', url: 'https://app.test/cadastro', at },
  ),
  ...over,
});
