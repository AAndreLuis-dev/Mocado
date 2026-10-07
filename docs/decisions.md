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
