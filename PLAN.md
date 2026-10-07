# PLAN — Massa

## Contexto

Você gera dados de teste brasileiros manualmente no 4devs (abre o site, gera, copia, cola) e perde o rastro de qual CPF foi usado em qual cadastro. O Massa é uma extensão (Chrome/Edge/Brave/Opera + Firefox, MV3) que detecta campos, gera dados válidos **localmente** e preenche com um clique ou atalho. Cada preenchimento fica num histórico pesquisável e reutilizável. O 4devs serve só como referência funcional: nada de scraping e nenhuma chamada a ele.

Estado atual: diretório vazio, sem git. Node 24.20 instalado; pnpm não (usar `corepack enable pnpm` ou `npx pnpm`, com a versão travada em `packageManager`).

## Arquitetura

```
pnpm workspace
├─ packages/core        TS puro, sem APIs de navegador. Geradores/validadores/formatadores + datasets.
├─ apps/extension       WXT + MV3
│   ├─ background       recebe o gatilho (atalho, menu de contexto, popup), injeta o content script,
│   │                   GERA os dados (usa o core) e grava o histórico
│   ├─ content (unlisted script, TS puro, sem core)
│   │                   detecta e classifica campos → devolve os tipos → recebe os valores → preenche
│   ├─ popup (React)    "Preencher página", geradores avulsos com cópia, toggle de máscara, últimos perfis
│   └─ manage (React)   página única com abas Histórico | Opções | Overrides (também é o options_ui)
└─ apps/playground      Vite multipágina: 5 fixtures (HTML puro, React controlado, máscaras, SPA/modal, nomes ruins)
```

**Fluxo de preenchimento:** gatilho → `scripting.executeScript` (com `activeTab`) injeta `injected.js` uma vez por aba → o content detecta os campos (documento principal, iframes same-origin via `contentDocument`, shadow roots abertos) e devolve `[{ref, tipo, formato}]` → o background escolhe o composto (havendo CNPJ/razão social → `empresa`, senão `pessoa`, senão avulso), gera os dados, manda os valores e grava o registro no histórico → o content preenche. O content script não carrega datasets nem o core e fica pequeno (meta: < 25 KB minificado).

**Decisões-chave** (todas vão para `docs/decisions.md`):

- **Sem `<all_urls>` nem host permissions fixas.** Tudo roda por gesto do usuário (atalho, menu de contexto, clique no popup), o que concede `activeTab`. "Detecção automática" quer dizer classificar sozinho os campos no momento do gatilho, não rodar em toda página carregada.
- **MutationObserver:** depois do primeiro preenchimento numa aba, o content script continua ativo e preenche com o **mesmo perfil** os campos que surgirem depois (wizards, modais, SPAs). Pode ser desligado nas Opções.
- **Seed/RNG:** `type Rng = () => number` injetável em todo gerador; `mulberry32(seed)` no core; padrão `Math.random`. O UUID com seed é derivado do RNG; sem seed, usa `crypto.randomUUID`.
- **Interface comum** `Generator<O> { generate(opts & {rng?, masked?}), validate(v), format(v, {masked}) }` para todo tipo com estrutura verificável (documentos, placa, cartão, conta, CEP, telefone). Nome, lorem, senha etc. expõem só `generate` (não há o que validar). Isso fica registrado em decisions.
- **`StorageAdapter`** (pedido explicitamente): `list/get/put/remove/search/exportAll/importAll`, com implementação inicial em `browser.storage.local` (quota de 10 MB ≈ 10 mil perfis). Migrar para IndexedDB só se precisar.
- **"Reusar este perfil" a partir da página de histórico:** essa página fica em outra aba e não tem `activeTab` na aba-alvo. Por isso o reuso **fixa** o perfil como "próximo preenchimento" (aviso visível no popup), e o próximo gatilho o usa. No popup, os últimos perfis têm "reusar" direto, porque ali há `activeTab`.
- **Override por domínio:** um item do menu de contexto, "Marcar este campo como → CPF/CNPJ/…", salva `{domínio, seletorEstável → tipo}`. Seletor estável: `#id` (se o id não parecer gerado), senão `[name]`, senão um caminho `tag:nth-of-type` a partir do `<form>`. A listagem e a remoção ficam na aba Overrides.
- **Preenchimento:** setter nativo do protótipo (`HTMLInputElement`/`HTMLTextAreaElement`/`HTMLSelectElement`) + `focus` → `input` → `change` → `blur` (bubbles). Se o valor final diferir do pretendido (máscara que reage a teclado), cai para digitação caractere a caractere (`keydown/keypress/input/keyup`). Select: opção que casa com o valor (ex.: UF), senão uma opção aleatória não vazia. Radio: casa por sexo/valor, senão o primeiro. Checkbox: marca os `required`. Tudo dentro de try/catch silencioso, para não sujar o console da página.
- **Formato do campo:** `maxlength`/`pattern`/placeholder definem com ou sem máscara (ex.: CPF maxlength 11 → sem máscara; 14 → com máscara). Sem pista, vale a máscara padrão das Opções.
- **Ignorados:** hidden, disabled, readonly, captcha (heurística por nome/classe/iframe do recaptcha/hcaptcha), `type=password` (só com a opção explícita, e aí preenche senha e confirmação com o mesmo valor).
- **UI:** React 19 + Tailwind v4 (plugin Vite), só em popup/manage. i18n com `@wxt-dev/i18n`: `pt_BR` padrão, `en` com as mesmas chaves.
- **Dataset de endereços:** script de dev `packages/core/scripts/build-ceps.ts`, rodado uma vez e **fora da extensão**, consulta o ViaCEP para ~3 cidades/UF × ~4 CEPs e grava `packages/core/src/data/ceps.json` (versionado). Em runtime não há rede nenhuma.

## Estrutura de pastas (alvo)

```
package.json  pnpm-workspace.yaml  tsconfig.base.json  eslint.config.js  .prettierrc
PLAN.md  CLAUDE.md  README.md  CONTRIBUTING.md  PRIVACY.md  LICENSE
docs/decisions.md  docs/publishing.md
.github/workflows/ci.yml
packages/core/
  src/rng.ts  src/types.ts  src/mask.ts  src/index.ts
  src/docs/{cpf,cnpj,rg,cnh,pis,titulo,renavam,certidao}.ts  src/docs/ie/{index.ts,<uf>.ts...}
  src/veiculo/{placa,modelo}.ts  src/financeiro/{cartao,conta}.ts
  src/pessoal/{nome,email,telefone,nascimento,senha}.ts  src/endereco.ts
  src/compostos/{pessoa,empresa}.ts  src/extras.ts
  src/data/{nomes,sobrenomes,ceps,ddd,modelos,empresas}.json
  scripts/build-ceps.ts
  test/*.test.ts
apps/extension/
  wxt.config.ts
  entrypoints/{background.ts, injected.ts (unlisted), popup/, manage/}
  src/detect/{classify.ts,synonyms.ts,collect.ts}  src/fill/fill.ts
  src/history.ts (StorageAdapter + LocalStorageAdapter)  src/messages.ts  src/settings.ts
  locales/{pt_BR,en}.yml
  e2e/*.spec.ts  playwright.config.ts
apps/playground/  {pf.html, pj.html (React), mascaras.html (IMask), spa.html, nomes-ruins.html}
```

## Fases

Gate de toda fase: `pnpm lint && pnpm typecheck && pnpm test` (e `pnpm e2e` a partir da fase 5) passando → commit Conventional Commits → `[x]` no PLAN.md → decisões em `docs/decisions.md`.

### [x] Fase 1 — Setup

`git init` (branch `main`), workspace pnpm, `tsconfig` strict compartilhado, ESLint flat + Prettier, Vitest, WXT com React/Tailwind/i18n gerando um popup "olá", playground Vite vazio, CI (`lint`, `typecheck`, `test`, `build`, `zip` Chrome + Firefox + sources, com upload como artifacts), `CLAUDE.md`, `docs/decisions.md`, `LICENSE` MIT.
**Aceite:** `pnpm i && pnpm lint && pnpm typecheck && pnpm test && pnpm build` passam; `wxt build -b firefox` gera um MV3 com `browser_specific_settings.gecko.id`; o manifest lista apenas `activeTab, scripting, storage, contextMenus`.

### [x] Fase 2 — Core: documentos principais

RNG/seed, helpers de máscara, interface `Generator`. CPF (com UF → 9º dígito pela região fiscal), CNPJ numérico e alfanumérico (DV módulo 11 sobre `ASCII−48`, pesos 5..2,9..2 / 6..2,9..2; opção `numerico|alfanumerico|aleatorio`).
**Aceite:** `12.ABC.345/01DE-35` valida; CPFs/CNPJs conhecidos validam; 10 mil iterações gera→valida = 100%; mutar 1 caractere → inválido; a mesma seed gera a mesma saída; `format` ida e volta.

### [x] Fase 3 — Core: demais geradores + compostos

RG SSP-SP (DV mod 11, "X"), CNH, PIS/PASEP, Título (com UF, regra especial de SP/MG), IE das 27 UFs, RENAVAM, Certidões (matrícula de 32 dígitos, nascimento/casamento/óbito), placa antiga/Mercosul, marca/modelo, cartão (Visa, MC, Amex, Elo, Hipercard, Diners: prefixos, tamanho, Luhn, validade futura, CVV 3/4), conta bancária (BB, Itaú, Bradesco, Caixa, Santander, com DV próprio de cada um), nome (gênero), e-mail derivado, telefone fixo/celular com DDD da UF, nascimento por faixa de idade, sexo, mãe/pai, senha configurável, endereço (dataset ViaCEP), lorem, número, UUID. Compostos `pessoa` (UF única para CPF, título, DDD e endereço) e `empresa` (IE da UF do endereço).
**Aceite:** cada gerador validável passa em 5 mil iterações; fixtures com exemplos oficiais conhecidos por UF de IE e por banco; testes de coerência de `pessoa`/`empresa` (região do CPF ↔ UF, DDD ↔ UF, título ↔ UF, IE ↔ UF); cobertura do core ≥ 90% de linhas.

### [x] Fase 4 — Popup

Geradores avulsos estilo 4devs (seletor de tipo + opções: máscara, UF, tipo de CNPJ, bandeira etc.), botão gerar/copiar, toggle de máscara e o botão "Preencher página" (stub até a fase 5).
**Aceite:** gerar e copiar funcionam em todos os tipos; teste de componente (Vitest + Testing Library) cobrindo gerar/copiar/máscara; build do Firefox OK.

### [x] Fase 5 — Detecção + preenchimento + playground + e2e

Classificador por pontuação (autocomplete > name/id > label/aria > placeholder > type/maxlength/pattern > texto próximo), sinônimos PT/EN, detecção de formato, iframes same-origin, shadow DOM aberto, preenchimento compatível com frameworks, MutationObserver, as 5 páginas do playground e o fluxo completo do background.
**e2e:** Playwright com Chromium carregando a extensão (`launchPersistentContext` + `--load-extension`). Atalhos de extensão não podem ser disparados no Playwright, então um build `MASSA_E2E=1` adiciona `host_permissions: http://localhost/*` (somente nesse build) e o teste chama `fillActiveTab()` pelo service worker.
**Aceite:** as 5 páginas preenchidas com valores válidos para o tipo detectado; na página React, o `<pre data-testid="state">` reflete os valores; as máscaras ficam no formato correto; o formulário que surge depois de um clique é preenchido pelo observer; zero erros de console/pageerror; testes unitários do classificador com uma tabela de ~60 casos de input → tipo.

### [x] Fase 6 — Histórico

`StorageAdapter` + implementação local; registro gravado a cada preenchimento; aba Histórico com busca por qualquer valor (normalizada: só alfanuméricos, então CPF com ou sem máscara casa), filtro por domínio, rótulo editável, favoritar, copiar campo, reusar (fixar/popup), excluir, export/import JSON (validado na importação). Últimos perfis no popup.
**Aceite:** testes unitários do adapter (com mock de `storage`); e2e: preenche → acha pelo CPF colado → reusa → os mesmos valores aparecem no formulário; export → limpar → import restaura tudo.

### [x] Fase 7 — Acionamento e opções

`commands`: preencher formulário (`Ctrl+Shift+F` / `Command+Shift+F`) e preencher o campo focado (atalho sugerido a ser validado contra conflitos de Chrome/Firefox e registrado em decisions; o usuário pode remapear). Menu de contexto em `editable`: "Gerar <tipo> aqui" (submenu), "Preencher formulário", "Marcar este campo como →". Opções: máscara padrão, tipo de CNPJ, UF preferida, faixa de idade, domínios bloqueados, tema claro/escuro/sistema, preencher senhas, observer on/off. Overrides por domínio aplicados na detecção.
**Aceite:** e2e de override (marca campo1 como CPF → recarrega → preenche CPF); domínio bloqueado não é preenchido; unitários das opções com defaults.

### [ ] Fase 8 — Polimento e publicação

i18n EN completo, README PT + seção EN + aviso "Dados fictícios, matematicamente válidos, apenas para testes de software." + GIF (gravado do e2e com vídeo do Playwright + ffmpeg, se disponível; senão, item no checklist), `CONTRIBUTING.md`, `PRIVACY.md`, `docs/publishing.md` (textos da loja, justificativa de cada permissão, lista de screenshots), `pnpm zip` gerando `massa-chrome.zip`, `massa-firefox.zip` e `massa-sources.zip`; `web-ext lint` no build do Firefox.
**Aceite:** CI verde (local: o mesmo script que o CI roda); `web-ext lint` sem erros; tamanho do content script verificado.

## Riscos técnicos

1. **IE das 27 UFs e DV de bancos:** são algoritmos distintos e mal documentados. O teste gera→valida só prova consistência interna, não que o algoritmo está correto. Mitigação: fixtures com exemplos oficiais (SINTEGRA / documentação dos bancos) por UF e por banco.
2. **Bibliotecas de máscara:** algumas reagem só a eventos de teclado. Mitigação: fallback de digitação caractere a caractere, verificado no playground com IMask.
3. **Atalhos:** `Cmd+Shift+F` no Mac e alguns atalhos do Firefox conflitam com o navegador; o Chrome limita a 4 atalhos sugeridos. Mitigação: documentar e permitir remapear em `chrome://extensions/shortcuts` / `about:addons`.
4. **activeTab + iframes:** frames cross-origin ficam fora (por design); os same-origin são acessados via `contentDocument`.
5. **Menu de contexto "aqui":** depende de `document.activeElement` ser o campo clicado com o botão direito (é o comportamento padrão de Chrome e Firefox para inputs). Se falhar, registro no próximo `contextmenu` depois da injeção.
6. **e2e só em Chromium:** o Playwright não carrega extensões no Firefox. O Firefox é validado por `web-ext lint` + build, e o teste manual entra no checklist.
7. **Quota de 10 MB do `storage.local`:** suficiente para ~10 mil perfis; o adapter permite trocar por IndexedDB.
8. **Exatidão do dataset ViaCEP:** depende do serviço no momento da geração do JSON; o script é idempotente e o JSON é revisável no diff.
9. **Data da IN do CNPJ alfanumérico:** a implementação segue o algoritmo oficial; o tipo padrão nas opções é "numérico", e o usuário escolhe outro se quiser.

## Fora do escopo (só a arquitetura fica preparada)

Safari, backend, login/sync (o `StorageAdapter` é o ponto de troca), planos pagos, publicação do core no npm (`private: true` até lá).

## Verificação final

`pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e && pnpm zip`; carregar `.output/chrome-mv3` à mão no Chrome e `.output/firefox-mv3` em `about:debugging`, rodar o playground (`pnpm --filter playground dev`) e preencher as 5 páginas por atalho, popup e menu de contexto; conferir o histórico, a busca por CPF e o reuso.
