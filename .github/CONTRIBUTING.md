# Contribuindo com o Mocado

Obrigado pelo interesse! Bugs e sugestões entram pelas [issues](https://github.com/AAndreLuis-dev/Mocado/issues/new/choose); código entra por pull request.

1. Faça um fork e crie um branch a partir de `main`.
2. Prepare o ambiente (Node 22+, pnpm via corepack):
   ```sh
   corepack enable pnpm
   pnpm install
   pnpm --filter extension exec playwright install chromium   # uma vez, para o e2e
   ```
3. Desenvolva com `pnpm --filter extension dev` e os formulários de `pnpm --filter playground dev` (http://localhost:5174).
4. Antes de abrir o PR, rode `pnpm check` e `pnpm e2e`. O CI roda os mesmos comandos.
5. Abra o PR com título em [Conventional Commits](https://www.conventionalcommits.org/pt-br/) e preencha o checklist.

As regras do projeto (camadas, i18n, permissões, como adicionar um tipo de campo ou reproduzir um formulário que o Mocado preenche mal) estão na seção [Desenvolvimento do README](../README.md#desenvolvimento), e a arquitetura em [Como funciona](../README.md#como-funciona).

O que não entra: permissões novas além de `activeTab`, `scripting`, `storage` e `contextMenus`, requisições de rede, telemetria ou dependências pesadas no script injetado (limite de 25 kB).
