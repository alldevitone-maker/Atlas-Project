# Architecture

## Camadas

```text
Config Registry
      ↓
App State ↔ URL Router
      ↓
Dataset Resolver → Data Loader
      ↓
Layer Manager → Map Engine
      ↓
Interaction Manager
      ↓
Metric Registry → KPI Engine → Slots / Inspector
```

## Fronteiras de domínio

O core não pode importar `domain-elections`.

Dependência permitida:

```text
domain-elections → contracts/core
core             ✗→ domain-elections
```

## State

O estado deve ser serializável e validável por schema.

Campos conceituais:

- territoryId
- moduleId
- domainId
- datasetRevision
- comparisonRevision
- metricId
- selectedFeatureId
- basemapId
- labelsVisible
- panelState
- theme
- locale

Nenhum valor concreto de Jaraguá ou eleição deve ser default dentro do package central.
