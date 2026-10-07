# Massa

**Gere e preencha dados de teste brasileiros direto no formulário, e saiba depois qual CPF foi usado em qual cadastro.**

> ⚠️ **Dados fictícios, matematicamente válidos, apenas para testes de software.**

![Demonstração do Massa preenchendo formulários e buscando no histórico](docs/demo.gif)

Massa é uma extensão de navegador (Chrome, Edge, Brave, Opera e Firefox) para quem testa sistemas brasileiros. Ela:

1. **Detecta os campos** do formulário (CPF, CNPJ, nome, e-mail, CEP, telefone…) por `autocomplete`, `name`/`id`, `<label>`, `placeholder`, `aria-label`, `pattern`, `maxlength` e texto próximo, inclusive em shadow DOM aberto e iframes same-origin.
2. **Gera dados válidos e coerentes**: uma _pessoa_ com a mesma UF no CPF, no título, no DDD e no endereço; uma _empresa_ com IE da UF do endereço. Tudo com os algoritmos oficiais de dígito verificador.
3. **Preenche como um usuário de verdade**, compatível com React, Vue, Angular e bibliotecas de máscara, respeitando o formato que o campo espera (com ou sem pontuação).
4. **Guarda cada preenchimento num histórico pesquisável**: cole um CPF e descubra em que site e quando ele foi usado, dê um rótulo ("admin teste", "cliente PJ"), favorite, reuse e exporte/importe em JSON.

**Nada sai do navegador.** Sem rede, sem telemetria, sem conta. Veja [PRIVACY.md](PRIVACY.md).

## Como usar

| Ação                                 | Como                                                                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Preencher o formulário inteiro       | `Ctrl+Shift+F` (Mac: `Cmd+Shift+F`), botão **Preencher página** no popup ou menu de contexto **Preencher formulário** |
| Preencher só o campo focado          | `Alt+Shift+F`                                                                                                         |
| Um tipo específico no campo          | Botão direito → **Gerar aqui** → CPF, CNPJ…                                                                           |
| Corrigir um tipo detectado errado    | Botão direito → **Marcar este campo como** → tipo (vale para o domínio)                                               |
| Gerar avulso e copiar (estilo 4devs) | Popup → escolha o gerador → **Copiar**                                                                                |
| Reusar um perfil                     | Popup → **Últimos perfis** → Reusar, ou Histórico → **Reusar este perfil** (vale para o próximo preenchimento)        |

Os atalhos podem ser trocados em `chrome://extensions/shortcuts` ou em `about:addons` → engrenagem → _Gerenciar atalhos_.

## Geradores

- **Documentos:** CPF (com UF de emissão), CNPJ numérico e **alfanumérico** (IN RFB 2.229/2024), RG (SSP-SP), CNH, PIS/PASEP, título de eleitor (com UF), inscrição estadual (as 27 UFs), RENAVAM e certidões de nascimento, casamento e óbito (matrícula de 32 dígitos).
- **Veículos:** placa antiga e Mercosul, RENAVAM, marca/modelo.
- **Financeiro:** cartão de crédito (Visa, Mastercard, Amex, Elo, Hipercard, Diners) com Luhn, validade futura e CVV; conta bancária (BB, Bradesco, Itaú, Caixa e Santander, com o DV de cada banco).
- **Pessoais:** nome (por gênero), e-mail derivado do nome em domínios reservados (`example.com`, para nunca acertar a caixa de alguém), telefone fixo e celular com DDD da UF, nascimento por faixa de idade, sexo, mãe/pai e senha configurável.
- **Endereço:** CEP, logradouro, bairro, cidade e UF reais e coerentes, de um dataset local.
- **Extras:** lorem ipsum, número aleatório, UUID.

O 4devs serviu só de referência para a lista de geradores: o Massa não faz nenhuma chamada a ele nem a qualquer outro serviço.

## Desenvolvimento

Requisitos: Node 22+ e pnpm (`corepack enable pnpm`).

```sh
pnpm install
pnpm --filter extension dev          # Chrome com hot reload
pnpm --filter extension dev:firefox  # Firefox
pnpm --filter playground dev         # páginas de teste em http://localhost:5174
pnpm check                           # lint + typecheck + testes + build (o mesmo que o CI)
pnpm e2e                             # Playwright carregando a extensão
pnpm zip                             # ZIPs para Chrome, Firefox e código-fonte (AMO)
```

Estrutura:

- `packages/core`: geradores, validadores e formatadores em TypeScript puro, sem nenhuma API de navegador. Seed opcional para resultados determinísticos.
- `apps/extension`: a extensão (WXT, Manifest V3). O script injetado nas páginas é TS puro (~16 kB), e React + Tailwind ficam só no popup e nas páginas de histórico/opções.
- `apps/playground`: formulários de teste (HTML puro, React controlado, máscaras, SPA/modal, nomes ruins).

Mais detalhes em [CONTRIBUTING.md](CONTRIBUTING.md), decisões técnicas em [docs/decisions.md](docs/decisions.md) e publicação em [docs/publishing.md](docs/publishing.md).

### Compilar a partir do código-fonte (revisores da AMO)

```sh
corepack enable pnpm
pnpm install --frozen-lockfile
pnpm --filter extension exec wxt build -b firefox --mv3
# saída: apps/extension/.output/firefox-mv3
```

## Licença

[MIT](LICENSE)

---

## English

**Massa** is a browser extension (Chrome, Edge, Brave, Opera, Firefox) that detects form fields, generates **valid Brazilian test data** (CPF, CNPJ, including the new alphanumeric CNPJ, IE for all 27 states, CNH, RENAVAM, credit cards, bank accounts, coherent people and companies with real addresses) and fills them with one click or `Ctrl+Shift+F`. It works with React, Vue, Angular and input-mask libraries. Every fill is saved to a searchable history, so you can paste a CPF and find where it was used, label profiles, reuse them and export/import JSON.

Everything runs locally: no network requests, no telemetry. _Fictitious, mathematically valid data, for software testing only._ The UI is in Portuguese, with English available when your browser runs in English.
