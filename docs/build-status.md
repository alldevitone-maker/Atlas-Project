# Build status · v3.2 / build 0.2.0

**Estado geral:** GREEN para core/contratos/pipelines/scaffold.  
**Data:** 07/10/2026

## F0 · Baseline e evidências

Concluído para o artefato legado:
- snapshot do deploy consolidado capturado;
- SHA-256 do baseline registrado;
- `api-lab-faculdade` permanece intocado.

Pendente:
- arquivar diretamente os brutos oficiais TSE 2022/2026 e hashes oficiais, sem depender do artefato legado.

## F1 · Contratos e metodologia

Fundação concluída:
- Territory;
- Module;
- Domain;
- Dataset;
- Candidate;
- Crosswalk;
- Metric;
- ComparisonPolicy;
- Basemap;
- Attribution.

Validação:
- 10 fixtures válidas: PASS;
- 2 fixtures inválidas: rejeitadas como esperado.

## F2 · Core e CI

Implementado e verificado:
- Registry;
- AtlasStore;
- URL Router;
- MetricEngine genérico;
- Comparison evaluator;
- DataLoader com adapters JSON/GeoJSON;
- MapEngine por porta genérica;
- LayerManager;
- InteractionManager;
- I18n;
- SlotRegistry;
- AtlasRuntime;
- domínio eleitoral isolado em `packages/domain-elections`;
- gate no-hardcode;
- synthetic non-election module.

**Core tests:** 8/8 PASS.

## F2.5 · Slice vertical

Continua válido como prova de contrato:
- mapa;
- dataset;
- interação;
- KPI;
- sidebar;
- painel responsivo.

Resultado do join nominal de desenvolvimento:
- 2022: 29/37 geometrias por igualdade normalizada de rótulo;
- 2026: 31/37 geometrias.

Conclusão: o join nominal serve para validar arquitetura, mas não pode ser promovido a crosswalk de produção.

## F3 · Pipeline 2022

Artefatos intermediários reproduzíveis a partir do baseline legado:
- 1º turno: `1b7f4f116ed7dc9900e7b91fca9d95af550a72da9525fd1349e0413c9d91456b`;
- 2º turno: `e45a9bef90a501945533663d2d2ab7c5a4756e268e558fc959eb20edab431be5`.

Pendente para fechamento de produção:
- reingestão a partir do bruto oficial TSE arquivado pelo novo pipeline.

## F4 · Pipeline 2026

Snapshot intermediário normalizado:
- checksum: `6f965e3f3c00ade51ceeb50dd5efc17315d852c9ae7a7d6de67d4eea90853c3e`;
- estado conservador: `totalized`;
- catalog de candidaturas separado;
- revision imutável no descriptor.

Pendente:
- bruto TSE oficial independente;
- ciclo de revisões subsequentes;
- segundo turno quando aplicável.

## F5 · Core runtime

**Fundação concluída.**

Todos os componentes headless planejados para o core inicial existem e compilam em TypeScript strict.

## F6 · Domínio Eleições

**Iniciado.**

Já existe:
- pacote eleitoral isolado;
- ranking e margem top-2 fora do MetricEngine;
- datasets 2022/2026 normalizados;
- registry web dirigido por configuração.

Ainda falta:
- Comparison UI;
- catálogo oficial completo de candidaturas por período;
- crosswalk final;
- integração final com o pipeline bruto oficial.

## F7 · UX responsiva

**Scaffold React criado, bundle ainda não executado.**

`apps/web` contém:
- React shell;
- Vite config;
- MapLibre component;
- sidebar;
- seletor de período gerado pelo registry;
- status/revision/proveniência;
- mapa;
- bottom sheet;
- layout mobile/desktop;
- i18n via catálogo JSON.

O ambiente atual não alcança `registry.npmjs.org`, portanto não há `node_modules`, `package-lock.json` nem bundle Vite ainda. As versões selecionadas estão documentadas em `docs/dependency-snapshot.md`.

## F8 · Hardening

Não concluído.

Playwright Python está instalado, porém o Chromium do ambiente bloqueia acesso a localhost com `ERR_BLOCKED_BY_ADMINISTRATOR`; por isso não registramos E2E como PASS nesta build.

Ainda pendentes:
- bundle React real;
- Playwright no CI do futuro repositório;
- axe/a11y automatizado;
- CSP final;
- visual regression;
- budgets de performance;
- auditoria de licenças.

## Verificação desta build

```text
TypeScript strict (core)       PASS
JSON Schema                    PASS (10 válidos / 2 inválidos rejeitados)
No-hardcode gate               PASS
Pipeline 2022                  PASS (baseline legado)
Pipeline 2026                  PASS (baseline legado)
Dataset descriptors            PASS (3)
Web scaffold audit             PASS (3 datasets)
Core tests                     PASS (8/8)
React/Vite bundle              PENDING (registry npm indisponível)
Browser E2E                    PENDING (localhost bloqueado pelo ambiente)
```
