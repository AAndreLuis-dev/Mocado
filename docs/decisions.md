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

## 2026-10-06: Detecção, preenchimento e e2e

- **Script injetado (`entrypoints/injected.ts`) + `scripting.executeScript({ func, args })`** em vez de `runtime` messaging. O script expõe `globalThis.__massa` no mundo isolado, e o background chama `__massa.scan()` / `__massa.fill(perfil)` e recebe o retorno direto. Assim não há `sendResponse`/`return true` e nenhuma diferença entre Chrome e Firefox.
- **O injetado lê `storage.local` direto** (configurações e overrides), sem o wrapper `storage.defineItem` do WXT: ~9 KB a menos (16 KB minificado).
- **Classificador:** pontuação por fonte (autocomplete 100, label/aria 45, name/id 40, placeholder 30, title 20, texto próximo 15) × força da frase (frases mais longas valem mais; palavras genéricas como "nome", "doc", "numero" valem metade), mais dicas de `type`. Mínimo de 12 pontos. Ignora busca, captcha, token e OTP.
- **Texto próximo** só conta quando não há `<label>`, e nunca "atravessa" outro campo: o texto antes de um campo anterior pertence a ele.
- **Formato:** `pattern` (testado contra amostras com e sem máscara) > `maxlength` > `placeholder` em forma de máscara > padrão das Opções. `type=number` → sem máscara.
- **Preenchimento:** setter nativo do protótipo do _realm_ do elemento (iframes têm protótipos próprios) + `input`/`change`/`blur`. Se os dígitos finais diferirem (máscara que só aceita digitação), redigita caractere a caractere. Radios: sexo casa por rótulo; outros grupos sem seleção recebem a 1ª opção. Checkboxes: só os `required`. Selects sem tipo e vazios: opção aleatória não vazia.
- **Observer:** depois do 1º preenchimento, um `MutationObserver` (debounce de 250 ms) preenche, com o mesmo perfil, campos novos e vazios. Ele não enxerga mutações dentro de shadow roots nem de iframes (limitação do MutationObserver); esses campos entram no próximo gatilho.
- **e2e:** Chromium com `channel: 'chromium'` (o novo headless carrega extensões). O build `MASSA_E2E=1` vai para `.output/e2e`, para não contaminar o build de produção.
- **Import attributes em JSON** (`with { type: 'json' }`) no core: o Node ESM exige (o Playwright importa o core para validar).

## 2026-10-07: Histórico

- **`StorageAdapter`** e a implementação `LocalStorageAdapter` ficam no mesmo arquivo (`src/history.ts`). O histórico inteiro vive numa chave do `storage.local` (≈ 10 mil perfis na quota de 10 MB). Essa simplificação está marcada com `ponytail:`; o IndexedDB entra atrás da mesma interface se o volume exigir.
- **Reuso não duplica:** um registro tem `uses[]` (domínio, URL, data). Reusar adiciona um uso ao mesmo registro, e assim "qual CPF foi usado em qual cadastro" fica num lugar só. O filtro por domínio olha todos os usos.
- **Busca** casa texto sem acento e sem caixa, e também só alfanuméricos (a partir de 3 caracteres): colar um CPF sem máscara acha o CPF mascarado.
- **"Reusar" na página de histórico fixa o perfil** (`pinned`, uso único). O próximo preenchimento usa o perfil fixado e depois o desafixa. No popup, "Reusar" preenche direto (ali há `activeTab`).
- **Importação é validada** campo a campo (`sanitize`): chaves desconhecidas são descartadas, só valores string; arquivo sem `records` gera erro. Por padrão o modo é `merge` por id.
- **Preenchimentos avulsos** (campo focado, "Gerar X aqui") também viram registros do tipo `avulso`.
- **e2e em pt-BR:** `chrome.i18n` segue o idioma da UI do Chromium, e o Playwright precisa de `LANG/LANGUAGE=pt_BR` no ambiente (`--lang` sozinho não basta no headless).

## 2026-10-07: Acionamento, opções e overrides

- **Atalhos:** `fill-form` = `Ctrl+Shift+F` (Mac: `Command+Shift+F`, como pedido) e `fill-field` = `Alt+Shift+F`. Escolhas evitadas: `Ctrl+Shift+E` (Network Monitor do Firefox) e `Ctrl+Shift+Y` (Downloads do Firefox no Linux). No Mac, `Cmd+Shift+F` pode conflitar com o modo de tela cheia/apresentação de alguns navegadores. Por isso a página de Opções lista os atalhos atuais e explica como remapear.
- **Menu de contexto:** "Preencher formulário" (página e campos), submenus "Gerar aqui" e "Marcar este campo como" (28 tipos mais comuns) e "Histórico de perfis" no ícone da extensão. "Marcar como" salva o override e já preenche o campo com o novo tipo.
- **Overrides** ficam em `storage.local.overrides[hostname][seletorEstável]`. São lidos pelo script injetado a cada varredura e editáveis/removíveis na aba "Campos corrigidos".
- **Opções e Histórico são o mesmo app React** com abas (`#history`, `#options`, `#overrides`). Os dois entrypoints só mudam a aba inicial; `options_ui` abre em aba (`open_in_tab`).
- **Tema:** variante `dark` do Tailwind por classe (`@custom-variant`), aplicada por `initTheme()` a partir das Opções (sistema/claro/escuro), e atualizada ao vivo via `storage.onChanged`.
- **Máscara:** a "máscara padrão" das Opções vale para preenchimento quando o campo não dá pista. O toggle do popup vale só para os geradores avulsos do popup (preferência local).
- **Hooks de teste:** `globalThis.massa` no background expõe `fillTab`, `onCommand`, `onMenuClick` etc. O e2e chama os mesmos handlers de atalho e menu, já que o Playwright não aciona os de verdade.
- **`web-ext lint`:** 0 erros. Avisos conhecidos: `innerHTML` interno do react-dom e `data_collection_permissions` sem suporte em versões antigas do Firefox Android.
