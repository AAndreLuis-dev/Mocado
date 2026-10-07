# Publicação: checklist

## 1. Gerar os pacotes

```sh
pnpm install --frozen-lockfile
pnpm check && pnpm e2e
pnpm --filter extension lint:firefox   # web-ext lint: precisa dar 0 erros
pnpm zip
```

Saída em `apps/extension/.output/`:

| Arquivo             | Para                                                                          |
| ------------------- | ----------------------------------------------------------------------------- |
| `massa-chrome.zip`  | Chrome Web Store, Edge Add-ons e Opera Add-ons (Brave usa a Chrome Web Store) |
| `massa-firefox.zip` | Firefox Add-ons (AMO)                                                         |
| `massa-sources.zip` | AMO: código-fonte do monorepo inteiro (o bundle é minificado, não ofuscado)   |

O CI (GitHub Actions) gera os mesmos ZIPs como artifact `massa-zips` em cada push.

- [ ] Versão atualizada em `apps/extension/package.json` (é ela que vai para o manifest)
- [ ] `pnpm check` e `pnpm e2e` verdes
- [ ] `web-ext lint` com 0 erros (avisos conhecidos: `innerHTML` interno do react-dom e `data_collection_permissions` sem suporte em versões antigas do Firefox Android)
- [ ] Teste manual no Firefox: `about:debugging` → _Carregar extensão temporária_ → `apps/extension/.output/firefox-mv3/manifest.json` → preencher as 5 páginas do playground (`pnpm --filter playground dev`) por atalho, popup e menu de contexto
- [ ] Teste manual no Chrome: `chrome://extensions` → modo desenvolvedor → _Carregar sem compactação_ → `apps/extension/.output/chrome-mv3`

## 2. Textos da loja

**Nome:** Massa: dados de teste brasileiros

**Resumo curto (≤ 132 caracteres):**

> Gera e preenche CPF, CNPJ, endereço e mais em formulários, com histórico pesquisável. Tudo local. Só para testes.

**Descrição:**

> O Massa preenche formulários com dados de teste brasileiros válidos, com um clique ou com Ctrl+Shift+F, e guarda um histórico para você saber qual CPF foi usado em qual cadastro.
>
> • Detecta os campos automaticamente (CPF, CNPJ, nome, e-mail, telefone, CEP, endereço, cartão…), mesmo com nomes ruins, só pelo rótulo ou placeholder.
> • Gera dados coerentes: pessoa com a mesma UF no CPF, título, DDD e endereço real; empresa com IE da UF.
> • CNPJ numérico e alfanumérico (novo formato da Receita), IE das 27 UFs, CNH, PIS, RENAVAM, certidões, placas Mercosul, cartões com Luhn, contas bancárias com DV.
> • Funciona com React, Vue, Angular e campos com máscara.
> • Histórico pesquisável: cole um CPF e veja onde foi usado; rotule, favorite, reuse e exporte em JSON.
> • Menu de contexto: "Gerar CPF aqui", "Marcar este campo como…".
> • Geradores avulsos com botão copiar, no estilo 4devs.
>
> Privacidade: nenhuma requisição de rede, nenhuma telemetria. Tudo é gerado e guardado no seu navegador.
>
> Dados fictícios, matematicamente válidos, apenas para testes de software.

**English short description:**

> Fills forms with valid Brazilian test data (CPF, CNPJ, address…) and keeps a searchable history. 100% local. Testing only.

**Categoria:** Ferramentas para desenvolvedores (Developer Tools).

## 3. Justificativa das permissões

| Permissão      | Justificativa (texto para o formulário da loja)                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `activeTab`    | Acessa a aba atual somente após uma ação explícita do usuário (atalho, item do menu de contexto ou botão do popup) para preencher o formulário dela. Não há acesso a outras abas nem em segundo plano. |
| `scripting`    | Injeta, sob demanda, o script que detecta os campos e escreve os valores gerados na aba em que o usuário acionou a extensão.                                                                           |
| `storage`      | Guarda localmente o histórico de perfis gerados, as preferências e as correções de tipo de campo por domínio. Nada é sincronizado nem enviado.                                                         |
| `contextMenus` | Oferece "Preencher formulário", "Gerar aqui" (por tipo) e "Marcar este campo como" no botão direito sobre campos editáveis.                                                                            |

Não há host permissions nem `<all_urls>`.

**Chrome: propósito único:** "Gerar dados de teste brasileiros e preenchê-los em formulários web, mantendo um histórico local dos dados usados."

**Chrome: práticas de privacidade:** não coleta nenhum tipo de dado do usuário. Marque "Não vendo nem transfiro dados…" e as três declarações. **Código remoto:** não (todo o JS vem no pacote).

**Firefox:** `data_collection_permissions.required = ["none"]` já está no manifest. Na AMO, envie `massa-sources.zip` e cole as instruções de build abaixo.

### Instruções de build para revisores da AMO

```
Requisitos: Node.js 22+ (testado no 24), pnpm 12 (via corepack).
corepack enable pnpm
pnpm install --frozen-lockfile
pnpm --filter extension exec wxt build -b firefox --mv3
Saída: apps/extension/.output/firefox-mv3 (idêntica ao massa-firefox.zip)
O código é minificado pelo Vite/Rolldown, nunca ofuscado.
```

## 4. Imagens

- [ ] **Ícone 128×128:** `apps/extension/public/icon/128.png` (fonte em `assets/icon.svg`; regenere com `pnpm --filter extension icons`)
- [ ] **Screenshots 1280×800:** `pnpm --filter extension demo` grava os quadros em `apps/extension/.output/demo/*.png`. Sugeridos: formulário React preenchido, máscaras, cadastro PF, histórico com busca por CPF. Inclua também o popup (abra-o e capture manualmente).
- [ ] **GIF do README:** `docs/demo.gif` (gerado pelo mesmo comando)
- [ ] **Tile promocional 440×280 (Chrome, opcional):** ícone + "Massa: dados de teste brasileiros"

## 5. Depois de publicar

- [ ] Atualizar o link da loja no README
- [ ] Criar a tag `vX.Y.Z` e um release com os ZIPs do CI
