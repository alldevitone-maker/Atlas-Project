# Projeto Atlas · Jaraguá do Sul

Fundação do novo Atlas municipal independente do `api-lab-faculdade`.

## Documentação principal

- [Roadmap v3.2 completo: execução, fontes, contratos e gates](docs/reference/roadmap-v3.2-execution.md)
- [Resumo do roadmap v3.2](docs/roadmap.md)
- [Histórico v3](docs/reference/roadmap-v3-full.md) e [revisão v3.1](docs/reference/roadmap-v3.1-review-delta.md)
- [Build status (último inventário)](docs/build-status.md)

**Auditoria de 08/10/2026:** o monorepo está no GitHub e o CI da fundação passou no commit de publicação do roadmap. O frontend React/Vite passou no [web-build CI em 08/10/2026](https://github.com/alldevitone-maker/Atlas-Project/actions/runs/37755534091) e gerou o artefato `atlas-web-dist`. GitHub Pages não estava habilitado na auditoria: publicar código ou artefato não equivale a URL do produto em produção.

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

Confirmar o build do frontend no CI, conferir dataset/revisão e avançar o módulo Eleições (F6) com `ComparisonPolicy` e proveniência. Os contratos, fixtures e o slice 2022 já existem como implementação de fundação, mas o join territorial é protótipo e não deve ser apresentado como resultado oficial por bairro.

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
