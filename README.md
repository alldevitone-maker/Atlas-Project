# Projeto Atlas · Jaraguá do Sul

Fundação do novo Atlas municipal independente do `api-lab-faculdade`.

## Estado

**Fase atual:** Build 0.2.1 · contratos, core runtime, pipelines normalizados e scaffold web.  
**Território inicial:** Jaraguá do Sul / SC.  
**Módulo funcional inicial:** Eleições presidenciais.  
**Baseline legado:** o Atlas publicado no `api-lab-faculdade` permanece intacto até a nova versão superar os testes de regressão.

## Regra central

> A fonte determina o dado. O contrato determina como ele entra. O estado determina o que o usuário vê. O motor nunca determina o significado.

## Stack inicial proposta

- TypeScript strict
- React
- Vite
- MapLibre GL JS
- Zod
- Vitest
- Playwright
- Python para ETL
- GitHub Actions
- GitHub Pages inicialmente
- GeoJSON + JSON na v1
- PMTiles / GeoParquet / DuckDB-WASM apenas como adapters futuros

## Próximo marco

Implementar e validar os contratos:
`Territory`, `TerritoryUnit`, `Module`, `Dataset`, `Candidate`,
`Crosswalk`, `Metric`, `ComparisonPolicy`, `Basemap` e `Attribution`.

Depois disso, executar um **slice vertical 2022 / 1º turno** ponta a ponta.

## Baseline imutável

- Atlas legado: https://alldevitone-maker.github.io/api-lab-faculdade/jaragua-atlas/
- Commit de referência: https://github.com/alldevitone-maker/api-lab-faculdade/commit/da595c03d2ecb28645c23b5948d8a1c362810e94

O repositório acadêmico permanece intocado durante a migração.

## Bootstrap 0.2.1

The repository bootstrap intentionally commits normalized fixtures and a simplified presentation geometry instead of duplicating the complete legacy application bundle.

```bash
npm install
npm run verify:foundation
```

The final F3/F4 pipelines will ingest primary official sources and replace bootstrap fixtures through immutable dataset revisions.
