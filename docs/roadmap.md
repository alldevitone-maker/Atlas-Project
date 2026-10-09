# Roadmap v3.2 · Projeto Atlas Jaraguá do Sul

> **Documento canônico integral:** [Roadmap v3.2 — retomada, auditoria e plano de execução](./reference/roadmap-v3.2-execution.md). Este arquivo é um índice/resumo. As versões históricas estão em [v3](./reference/roadmap-v3-full.md) e [v3.1](./reference/roadmap-v3.1-review-delta.md). Atualizado em 08/10/2026.

[Cores de candidatos: etapas, herança e critérios de promoção](roadmap-candidate-colors.md).

## Decisões aprovadas

1. O projeto nasce fora do repositório acadêmico.
2. O Atlas consolidado atual permanece congelado como baseline.
3. Contratos de dados precedem o core.
4. `MapEngine` não conhece domínio.
5. Eleições presidenciais são o único módulo funcional inicial.
6. `sourceGrain` eleitoral preserva seção/local de votação.
7. `analysisUnit` pode ser local de votação ou bairro.
8. Bairro é derivado por `Crosswalk`, nunca substituto silencioso da fonte TSE.
9. Crosswalk v1 será N:1, com schema preparado para evolução.
10. Geometrias possuem `territoryVintage`.
11. Cada ingestão de dataset gera `revision` imutável e `checksum`.
12. `Dataset.status`: `draft | provisional | totalized | official`.
13. URL/permalink faz parte do core.
14. Candidatos, números, partidos, anos e rótulos não existem hardcoded no runtime.
15. `MetricEngine` é genérico.
16. Conceitos eleitorais ficam em `@atlas/domain-elections`.
17. `ComparisonPolicy` é contrato separado.
18. Gate anti-hardcode usa AST + allowlist versionada.
19. Teste de período sintético é obrigatório.
20. Teste de módulo sintético não eleitoral é obrigatório.
21. Desktop usa hover como melhoria e clique como seleção persistente.
22. Mobile usa tap + bottom sheet.
23. UI usa slots configuráveis.
24. WCAG 2.2 AA.
25. GeoJSON/JSON primeiro; PMTiles/GeoParquet/DuckDB apenas quando medição justificar.

## Fases

### F0 · Baseline e evidências
- snapshot do Atlas legado
- inventário de fontes/licenças
- performance baseline
- arquivar brutos TSE com checksum

**Aceite:** nenhuma alteração no legado; fontes classificadas.

### F1 · Contratos e metodologia
- schemas reais
- fonte oficial da malha
- Crosswalk
- ComparisonPolicy
- regras de proveniência
- revisão imutável

**Aceite:** exemplos válidos/inválidos passam/falham automaticamente.

### F2 · Repositório e CI
- monorepo
- TypeScript strict
- Vite/Vitest
- schema validation
- no-hardcode AST + allowlist
- fixture sintética

**Aceite:** CI verde sem domínio no core.

### F2.5 · Slice vertical
- 2022, 1º turno
- 1 mapa
- 1 interação
- 1 KPI
- tudo por config

**Aceite:** ponta a ponta antes de expandir arquitetura.

### F3 · Pipeline 2022
### F4 · Pipeline 2026
### F5 · Core runtime
### F6 · Módulo Eleições
### F7 · UX responsiva
### F8 · Hardening e lançamento
### F9 · Extensibilidade futura

## Decisões ainda abertas

- fonte oficial definitiva da malha municipal de bairros;
- threshold de confiabilidade estatística;
- store: Zustand, nanostores ou reducer próprio;
- política exata de evolução N:N do Crosswalk;
- budget de performance medido;
- provider final de basemap/tiles em produção.
