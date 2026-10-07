# Decisões técnicas

Formato: data, decisão e porquê. A mais recente fica no fim.

## 2026-10-06: Fundação

- **TypeScript 6.0 (não 7).** O `typescript-eslint` 8.x exige `typescript <6.1`, e o TS 7 (nativo/Go) ainda não tem a API que ele usa.
- **pnpm 12 via corepack.** `allowBuilds` em `pnpm-workspace.yaml` libera só o esbuild.
- **Firefox em MV3** (`wxt -b firefox --mv3`, `strict_min_version 140`). A AMO exige `data_collection_permissions`, e declaramos `required: ['none']`. O `browser_specific_settings` só entra no manifest do Firefox.
- **Core exporta o código-fonte TS** (`exports: ./src/index.ts`) enquanto for `private`. A extensão faz o bundle; um build para o npm só quando for publicar.
- **Sem host permissions fixas.** Tudo roda por gesto do usuário (atalho, menu de contexto, popup), o que concede `activeTab`. O build e2e (`MASSA_E2E=1`) adiciona `http://localhost/*` porque o Playwright não consegue apertar atalhos de extensão.
- **Geração no background, preenchimento no content.** O content script não importa o core nem os datasets, e fica pequeno.
- **Dataset de CEP** montado uma vez por script de dev (ViaCEP), versionado como JSON. Em runtime não há rede nenhuma.

## 2026-10-06: Core, documentos principais

- **`Generator` só para tipos validáveis.** Nome, lorem, senha etc. são funções `generate` simples; forçar `validate/format` neles seria cerimônia vazia.
- **CNPJ alfanumérico:** a raiz tem 8 caracteres `[0-9A-Z]` com ao menos uma letra (para ser visivelmente alfanumérico), e a filial é `0001`. Os mesmos pesos e o mesmo DV servem para os dois tipos (`ASCII − 48`), validados com o exemplo oficial `12.ABC.345/01DE-35`. O padrão é `numerico`.
- **Teste de mutação** altera só o último DV. Em CNPJ alfanumérico, uma mudança de valor múltipla de 11 na raiz não é detectada pelo módulo 11; é limitação do algoritmo, não bug.

## 2026-10-06: Core, demais geradores e compostos

- **Referências usadas para conferir os algoritmos (só no desenvolvimento, nenhuma no runtime):** IE com exemplos reais de [gammasoft/ie](https://github.com/gammasoft/ie) (MIT), copiados em `test/ie-fixtures.json`; DVs bancários com os dados de teste de [darkroomdevs/CheckDigitValidator](https://github.com/darkroomdevs/CheckDigitValidator) (MIT); certidão, título, PIS, RENAVAM e RG-SP comparados com [js-brasil](https://github.com/mariohmol/js-brasil). O código é implementação própria.
- **IE:** cada UF tem `gen` + `valid`. Validamos os formatos atuais e alguns legados baratos (BA 8 dígitos, RN 10, MT 9, TO 11, SP produtor rural `P…`). RO de 9 dígitos (anterior a 2000) não é aceito. A regra de RO segue o SINTEGRA: "resultado 10/11 → subtrai 10".
- **Prefixo de IE:** só é obrigatório onde o SINTEGRA exige (AC 01, AL 24, AP 03, CE 06, GO 10/11/15, MA 12, MS 28, PA 15, RN 20, RR 24, DF 07). Nas outras UFs, ele só orienta a geração.
- **RG:** algoritmo SSP-SP para qualquer UF (é o único com DV padronizado; o 4devs faz o mesmo).
- **Bradesco, agência:** resto 10 → "0" (os dados reais da referência confirmam); na conta, resto 10 → "P". **BB:** resto 10 → "X".
- **E-mails gerados usam domínios reservados (RFC 2606: example.com/net/org).** Um e-mail aleatório em gmail.com pode existir de verdade, e o sistema em teste enviaria mensagens a terceiros. A opção `dominio` permite trocar.
- **UUID** é sempre derivado do RNG (Math.random por padrão), sem `crypto.randomUUID`. Assim o core não precisa de nenhuma API de plataforma, e o resultado é determinístico com seed.
- **Compostos sempre geram valores mascarados** quando `masked` é true. O content script remove a máscara se o campo pedir só dígitos (por maxlength/pattern).
- **Dataset de CEP:** 253 endereços reais de 2 a 4 cidades por UF (ViaCEP, out/2026). CEPs com sufixo ≥ 900 (grandes usuários e caixas postais) ficam de fora.
- **`valorAvulso(tipo)`** gera um perfil inteiro e devolve um campo. Custa microssegundos e garante coerência sem um gerador por campo.

## 2026-10-06: Popup

- **Registro único de geradores** (`apps/extension/src/generators.ts`): `id`, opções (listas de valores) e `run`. O popup renderiza qualquer gerador de forma genérica; os rótulos vêm do i18n (`gen.*`, `opt.*`, `field.*`).
- **Gerador escolhido e máscara do popup** ficam em `localStorage`, como conveniência por usuário (dentro de try/catch). A máscara padrão global entra pelas Opções na fase 7.
- **Regenerar em handlers, não em `useEffect`.** A regra `react-hooks/set-state-in-effect` (v7) proíbe `setState` síncrono em efeito.
- **Testes de UI:** o `fakeBrowser` do WXT não implementa `i18n.getMessage`. O `vitest.setup.ts` carrega o `pt_BR.yml` real via `@wxt-dev/i18n/build`, e assim os testes também pegam chaves faltando.
