## O que muda

<!-- Uma ou duas frases. Se fecha uma issue: "Closes #123". -->

## Como testar

<!-- Página do playground, site público ou passos para reproduzir. -->

## Checklist

- [ ] `pnpm check` passa localmente (lint, typecheck, testes com cobertura, build)
- [ ] `pnpm e2e` passa, se mexeu em detecção, preenchimento ou UI
- [ ] Testes novos cobrem a mudança (gerador com dígito verificador: teste gera→valida + exemplo oficial)
- [ ] Textos de interface via `t(...)`, com a chave em `locales/pt_BR.yml` e `locales/en.yml`
- [ ] Nenhuma permissão nova, requisição de rede ou telemetria
- [ ] Título do PR em [Conventional Commits](https://www.conventionalcommits.org/pt-br/) (`feat(core): …`, `fix(extension): …`)
