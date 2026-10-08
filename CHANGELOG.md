## 0.2.2 — 2026-10-08

Extração de BU vinculada à fonte, revisões imutáveis, integração do core e filtros/inspector/temas. Gates de contratos, integridade, AST, orçamento de assets e E2E Chromium/WebKit. Pendências científicas e de release estão no [relatório](docs/implementation-roadmap-2026-10-08.md); v0.3.0 não declarada concluída.

# Changelog

## 0.2.1 · Repository bootstrap

- Prepared the standalone GitHub repository bootstrap.
- CI now installs the pinned root TypeScript compiler before `npm run verify`.
- Legacy duplicated vendor bundles are omitted from Git history while the immutable upstream baseline commit remains referenced.
- No changes were made to `api-lab-faculdade`.

## 0.2.0 · 07/10/2026

### Core
- DataLoader genérico com adapters JSON e GeoJSON.
- MapEngine baseado em `MapPort`, sem conhecimento de domínio.
- LayerManager.
- InteractionManager.
- i18n mínimo.
- SlotRegistry para painéis configuráveis.
- AtlasRuntime para registry, state, permalink, resolução e load de dataset.
- Teste de revisão imutável em permalink.

### Web
- Scaffold React + Vite criado em `apps/web`.
- Dependências fixadas em snapshot para React, Vite, MapLibre, Zod e Vitest.
- Registry web dirigido por JSON.
- Períodos vêm do registry, não do source runtime.
- Estado/revisão/proveniência expostos no shell.
- Mapa MapLibre encapsulado em componente React.
- Desktop e mobile previstos por CSS responsivo e bottom sheet.
- Fixture de desenvolvimento usa crosswalk nominal provisório e declara isso na UI.

### Qualidade
- Core: 8 testes passando.
- TypeScript strict: PASS.
- JSON Schemas: PASS.
- No-hardcode: PASS.
- 3 descriptors de dataset: PASS.
- Web scaffold audit: PASS.

### Pendências conhecidas
- `npm install`/Vite build bloqueado no ambiente atual por falta de acesso ao registry npm.
- Playwright/Chromium local bloqueia localhost por política do ambiente; não é falha do app.
- Crosswalk nominal não é aceitável como metodologia territorial final.
- Brutos TSE 2022/2026 ainda precisam ser arquivados independentemente do artefato legado.
