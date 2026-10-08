import IMask from 'imask';

const masks: Record<string, string> = {
  cpf: '000.000.000-00',
  cnpj: '00.000.000/0000-00',
  cep: '00000-000',
  celular: '(00) 00000-0000',
};
for (const [name, mask] of Object.entries(masks)) {
  IMask(document.querySelector<HTMLInputElement>(`[name="${name}"]`)!, { mask });
}
