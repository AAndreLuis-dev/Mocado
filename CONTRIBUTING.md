# Contribuindo

Obrigado pelo interesse! O Mocado é um monorepo pnpm com TypeScript strict em tudo.

## Ambiente

```sh
corepack enable pnpm
pnpm install
pnpm --filter extension exec playwright install chromium   # para o e2e
```

## Antes de abrir um PR

```sh
pnpm check   # lint (ESLint + Prettier), typecheck, testes unitários, build
pnpm e2e     # Playwright carregando a extensão no Chromium
```

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/pt-br/) (`feat(core): …`, `fix(extension): …`, `docs: …`).
- **Core (`packages/core`):** nada de APIs de navegador (o tsconfig nem inclui a lib DOM). Todo gerador com dígito verificador precisa de um teste gera→valida com milhares de iterações e de pelo menos um exemplo oficial/real conhecido. `pnpm test` exige cobertura mínima de 90% de linhas.
- **Script injetado (`apps/extension/entrypoints/injected.ts`):** TS puro, sem React e sem o core (só tipos). O build falha se ele passar de 25 kB.
- **Textos de UI:** sempre via `i18n.t(...)`, com a chave em `locales/pt_BR.yml` **e** `locales/en.yml` (um teste confere a paridade).
- **Permissões:** só `activeTab`, `scripting`, `storage` e `contextMenus`. Não adicione host permissions fixas, requisições de rede nem telemetria.
- **Novo campo detectável:** adicione o tipo em `FIELD_TYPES` (core), sinônimos em `apps/extension/src/detect/synonyms.ts`, casos em `classify.test.ts` e o rótulo `field.<tipo>` nos dois locales.
- **Formulário que o Mocado não preenche bem?** Adicione uma página em `apps/playground` e um caso no e2e.

Decisões técnicas relevantes ficam em `docs/decisions.md`.
