# Data Contracts

Contratos obrigatórios:

- Territory
- TerritoryUnit
- Module
- Dataset
- Candidate
- Crosswalk
- Metric
- ComparisonPolicy
- Basemap
- Attribution

## Dataset

Deve incluir no mínimo:

- id
- revision
- supersedes
- moduleId
- periodId
- status
- asOf
- sourceGrain
- analysisUnit
- territoryId
- territoryVintage
- crosswalkId
- format
- uri
- schemaRef
- provenance
- quality
- checksum

## Crosswalk

V1: N:1 por associação, com `confidence`, `method` e `reviewed`.

O schema não deve impedir evolução futura para pesos/N:N.

## ComparisonPolicy

Contrato separado de `Metric` e `Dataset`.

Responsável por decidir:

- compatibilidade territorial
- compatibilidade de granularidade
- delta absoluto permitido
- delta percentual permitido
- necessidade de agregação comum
- mensagens metodológicas
