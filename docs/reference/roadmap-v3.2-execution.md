# PROJETO ATLAS | Jaraguá do Sul
## Roadmap v3.2 · retomada técnica e plano de execução

**Data de consolidação:** 07/10/2026  
**Verificação e publicação:** 08/10/2026  
**Status:** versão integral revisada para publicação no repositório `alldevitone-maker/Atlas-Project`  
**Antecessores:** `roadmap_projeto_atlas_v3_jaragua_do_sul.md` e `roadmap_projeto_atlas_v3_1_delta_claude.md`  
**Escopo inicial:** eleição presidencial em Jaraguá do Sul, SC  
**Regra fundamental:** não confundir seção eleitoral, local de votação, bairro ou residência do eleitor.

> O Atlas é uma plataforma cartográfica orientada a contratos, dados auditáveis e módulos de domínio desacoplados. Fonte gera evidência, pipeline gera artefato reproduzível, crosswalk explicita inferências e a interface mostra proveniência.

## 1. Ponto exato de retomada

### Confirmado pelo histórico anterior (não revalidado contra a árvore do repositório recém-criado)

- Baseline legada: `alldevitone-maker/api-lab-faculdade`, preservada sem refatoração destrutiva.
- Build `0.2.0` reportada na conversa anterior, com scaffold React/TypeScript/Vite/MapLibre e 8/8 testes reportados.
- F0–F5 reportadas como concluídas; F6 (módulo Eleições) reportada em andamento.
- A versão legada tem mapa vetorial, inspector, KPIs, comparação e pipeline TSE 2022; há relato de 355 seções conciliadas no protótipo anterior.
- Repositório efetivamente localizado em 08/10/2026: `alldevitone-maker/Atlas-Project`, branch padrão `main`, com permissão de escrita. O repositório contém scaffold 0.2.1, fontes, schemas, documentação e workflows. Este registro não equivale a deploy público validado.

### O que o v3.2 muda

1. Torna explícito o **gate de migração** entre o scaffold histórico e o repositório novo.
2. Define um **vertical slice** testável sem aguardar toda a UX.
3. Consolida contratos de revisão, granularidade, crosswalk, atribuição e comparabilidade.
4. Proíbe contagem eleitoral projetada sobre bairros sem cobertura e método documentados.
5. Torna 2026 configurável e sensível a revisões; não congela rótulos/candidatos no código.
6. Define entregáveis, critérios de aceite e ordem de commits.

## 2. Invariantes e decisões arquiteturais

| Decisão | Norma v3.2 |
|---|---|
| Core genérico | `MapEngine`, `MetricEngine`, `DataLoader`, `Selection`, `URLState` independentes de eleições |
| Domínio | Candidatos, cargos, partidos, turnos, rankings e cálculo de votos em `@atlas/domain-elections` |
| Fonte de verdade | Dado bruto + checksum + registro de transformação + saída derivada versionada |
| Unidade de origem | `sourceGrain`, inicialmente `electoral-section` ou `polling-place` |
| Unidade analítica | `analysisUnit`, ex.: bairro, local de votação, município, sempre explicitada |
| Tradução espacial | `Crosswalk` com fonte, safra, método, confiança e regra de ambiguidade |
| Dataset | `revision` imutável, `supersedes`, `asOf`, `checksum`, `status` |
| Manifest | Config e datasets versionados separadamente, referidos por hashes imutáveis |
| Estado | Filtros, seleção, período, camada e revisão serializáveis em URL |
| Rendering | Mapa único vetorial, zoom/pan, tap/clique; hover apenas opcional |
| Publicação | Static-first, GitHub Pages enquanto suficiente, sem banco/backend prematuro |
| Qualidade | Schema validation, testes unitários, E2E mobile/desktop, acessibilidade e gate no-hardcode |

### Estados do dataset

`draft` -> `provisional` -> `totalized` -> `official` descreve estágio editorial/publicação. `official` só quando realmente sustentado pela fonte. Não inferir oficialidade de uma agregação derivada; metadados devem distinguir `sourceStatus` de `derivedStatus`.

### Identidade temporal

- Períodos, eleições, cargos, candidatos e rótulos saem do registry versionado.
- Nenhum botão deve presumir `2022`, `2026` ou `Comparar` como lista fixa.
- Comparação só é liberada quando `ComparisonPolicy` valida cargo, turno, geografia, vintage, denominador e método.
- Revisões antigas permanecem acessíveis por permalink com `revision=<id>`; ausência de revision segue a última revisão publicada e expõe `asOf`.

## 3. Arquitetura de referência

```text
apps/web
  ├─ AppShell / TopBar / Sidebar / BottomSheet
  ├─ AtlasMap / Inspector / KPIGrid / Legend
  └─ routes + URLState
packages/
  ├─ core/                 # seleção, estado, carregamento, manifest
  ├─ map-engine/           # MapLibre, fontes, camadas, hit-testing
  ├─ metric-engine/        # AST genérico: sum, ratio, diff, coalesce
  ├─ domain-elections/     # turnos, candidatos, votos, apuração
  ├─ contracts/            # TypeScript types + Zod schemas
  └─ ui/                   # componentes reutilizáveis
config/
  ├─ atlas.manifest.json
  ├─ modules/
  ├─ territories/
  └─ themes/
data/
  ├─ raw/                  # preservar hashes; avaliar armazenamento externo para arquivos grandes
  ├─ processed/
  ├─ territories/BR/SC/jaragua-do-sul/
  └─ revisions/
pipelines/
  ├─ ingest_tse.py
  ├─ normalize_locations.py
  ├─ build_crosswalk.py
  ├─ aggregate.py
  └─ validate.py
schemas/
tests/{unit,integration,e2e,fixtures}/
docs/{roadmap,architecture,data-contracts,methodology,ux,stack,evidence,adr}/
.github/workflows/
```

**Stack aprovada:** React, TypeScript, Vite, MapLibre GL JS, Zod, Vitest, Playwright, Python, GeoPandas, DuckDB (pipeline offline, se necessário), GitHub Actions e GitHub Pages. `GeoJSON + JSON` v1; PMTiles/GeoParquet como adapters futuros; DuckDB-WASM adiado até justificativa quantitativa. Estado global por Zustand ou reducer encapsulado; escolha final registrada em ADR.

## 4. Contratos mínimos

### Dataset manifest, esquema ilustrativo

```json
{
  "id": "presidential-2022-round-1-jaragua",
  "schemaVersion": "1.0.0",
  "revision": "sha256:EXAMPLE",
  "supersedes": null,
  "asOf": "2026-10-07T00:00:00Z",
  "sourceGrain": "electoral-section",
  "analysisUnits": ["polling-place", "municipality"],
  "status": "draft",
  "sourceStatus": "official",
  "territoryVintage": "pending-verification",
  "sourceRefs": ["tse-bu-2022"],
  "checksum": "sha256:EXAMPLE",
  "license": "verify-source-terms",
  "methodologyRef": "docs/methodology.md"
}
```

`EXAMPLE` é placeholder inválido para release. `asOf` só pode refletir captura real, nunca data artificial no dataset publicado.

### Crosswalk N:1 inicialmente

```json
{
  "sourceUnitId": "section-key",
  "analysisUnitId": "polling-place-key",
  "method": "official-address|reviewed-alias|spatial-join",
  "confidence": "verified|reviewed|estimated|unmapped",
  "weight": null,
  "territoryVintage": "version-id",
  "evidenceRef": "source-or-review-record"
}
```

Atribuição por bairro só é permitida com crosswalk de local de votação para bairro auditado. Isso localiza **onde se votou**, não onde mora quem votou. Agregações com fonte ambígua expõem contagem de não mapeados; não distribuir votos arbitrariamente entre polígonos. `weight` fica reservado a eventual N:N formal, sujeito a ADR e reconciliação.

### Metric AST

`sum`, `ratio`, `difference`, `coalesce` e eventualmente `rank` sobre campos genéricos; `candidateVotes` e `rankedCandidateShare` existem somente no adaptador eleitoral. Denominador de percentuais explícito (`validVotes`, `totalVotes` etc.), com teste de divisões por zero e arredondamento.

## 5. Roadmap operacional

| Fase | Estado de retomada | Entregável observável | Gate de aceite |
|---|---|---|---|
| F0 Evidências | Reportada pronta; revalidar | catálogo de fontes, hashes e ADR cartográfico | dados rastreáveis |
| F1 Contratos | Reportada pronta; revalidar | Zod + fixtures válidas/inválidas | CI rejeita contrato quebrado |
| F2 Scaffold/CI | Reportada pronta; migrar | app, lint, build, tests, Pages | pipeline verde no novo repo |
| F2.5 Slice | Pendente de prova no novo repo | mapa 2022 turno 1 + clique + KPI | ponta a ponta via config |
| F3 Ingestão 2022 | Reportada pronta; auditar | raw/processed + reconciliação de seção | nenhuma contagem inventada |
| F4 Ingestão 2026 | Reportada pronta no histórico; auditar revisão | snapshots por `revision` | não sobrescrever apuração |
| F5 Core | Reportada pronta; revalidar desacoplamento | Map/Data/Metric/URLState genéricos | fixture não eleitoral sem mudança core |
| **F6 Eleições** | **Em execução** | eleições presidenciais, turnos, KPI, comparador | fonte, denominador e estado visíveis |
| F7 UX responsiva | Próxima | sidebar, inspector, bottom sheet e tema | Android/iOS/desktop, teclado e tap |
| F8 Cartografia avançada | Depois | layer selector, polling places, basemap | atribuição e desempenho |
| F9 Hardening e publicação | Depois | E2E, WCAG 2.2 AA, CSP, orçamento de assets, release | smoke real + rollback |

### F6: backlog prioritário, ordem de implementação

- [ ] `elections.registry.json`: eleições/turnos/candidatos por dataset, nunca por literal de UI.
- [ ] `DatasetResolver`: seleção por `territory + module + period + round + revision`.
- [ ] `ElectionAdapter`: votos, totalização, compare, distribuição de válidos, brancos, nulos, abstenção quando fonte permitir.
- [ ] `MetricDefinition`: exibição de denominador, unidade e erro/ausência de dado.
- [ ] `Inspector`: recorte + nome da unidade + fontes + `sourceGrain` + `analysisUnit` + confiança.
- [ ] `ElectionLegend`: cores vinculadas à entidade do dataset/tema, sem supor partido/candidato universal.
- [ ] `ComparisonPolicy`: bloquear comparação não equivalente e explicar o motivo na UI.
- [ ] `revision`: selector e banner `asOf`, permalink estável.
- [ ] `fixture-non-election`: métrica fictícia numérica, mapa, KPI e URL funcionando sem edição do core.
- [ ] `reconciliation`: somas por local/seção e município batem com a extração-base e relatam discrepâncias.

## 6. UX e linguagem cartográfica

Desktop: sidebar retrátil de módulos/períodos, mapa central com toolbar e overlays discretos, KPIs e inspector contextual. Mobile: mapa prioritário, ações por tap, filtros em bottom sheet, controles com área de toque adequada, sem dependência de hover. Dark/light mode por design tokens; alto contraste e teclado acessível.

**Sem mapa enganoso:** preencher bairro por intensidade só depois de auditoria espacial. Caso não haja geometria oficial nem correspondência suficiente, exibir locais de votação como camada primária e agregações por município, com aviso claro da limitação. Azul/vermelho são mapeamentos temáticos configurados por eleição, nunca semântica rígida no motor.

## 7. Plano imediato de Git e releases

1. **Gate A: confirmar `owner/repo`, branch default, permissões e árvore de arquivos**. Repositório criado não significa aplicação publicada.
2. **Commit 01:** `docs: add atlas roadmap v3.2 and ADR baseline`.
3. **Commit 02:** `chore: migrate validated scaffold and CI` (apenas se arquivos ainda ausentes).
4. **Commit 03:** `feat(contracts): dataset revisions crosswalk comparison policy`.
5. **Commit 04:** `feat(elections): config-driven presidential vertical slice`.
6. **Commit 05:** `test: synthetic non-election fixture and reconciliation`.
7. **Commit 06:** `feat(ui): responsive election inspector and provenance`.
8. PR protegido para `main` com build, lint, unit, E2E, schemas e data audit; deploy apenas após aprovação dos gates.

Comandos locais sugeridos após clonar o repositório correto:

```bash
npm ci
npm run lint
npm run test -- --run
npm run build
```

Se os scripts ainda não existirem, criar `package.json` correspondente antes de executar. Não alegar teste concluído até obter log e SHA de execução.

## 8. Qualidade, segurança e governança de dados

- Checksum SHA-256 do bruto e do artefato exportado; ingestão idempotente.
- `CHANGELOG.json` por dataset, mais `CHANGELOG.md` gerado; `supersedes` liga revisões.
- Licença, origem, data de coleta, versão territorial e regra de tratamento documentadas.
- Dados eleitorais publicados por seção não equivalem a voto individual; não inferir preferência de moradores de determinado bairro.
- `no-hardcode` por lint AST contextual e allowlist revisada por PR.
- Não embutir tokens de APIs, senhas, cookies ou credenciais na interface ou Git.
- Contratos e fixtures sem `eval` ou execução arbitrária de fórmulas.
- E2E com viewport desktop e mobile; testes de clique/tap, navegação por teclado, reset e permalink.
- Política de atribuição OSM, licença de tiles e licença de ortofoto municipal checadas antes de servir em produção.
- Fail-closed: dado sem revisão ou fonte não entra como `official`.

## 9. Evidências e fontes: catálogo preservado

### Legado / baseline

- API Lab GitHub: https://github.com/alldevitone-maker/api-lab-faculdade
- Atlas legado: https://alldevitone-maker.github.io/api-lab-faculdade/jaragua-atlas/
- Pull request #6: https://github.com/alldevitone-maker/api-lab-faculdade/pull/6
- Workflow legado: https://github.com/alldevitone-maker/api-lab-faculdade/actions/runs/37598037149
- Commit baseline: https://github.com/alldevitone-maker/api-lab-faculdade/commit/da595c03d2ecb28645c23b5948d8a1c362810e94

### PMJS / GeoJaraguá

- GeoMapView: https://sistemas.jaraguadosul.sc.gov.br/index.php?class=GeoMapView
- GeoWelcomeView: https://sistemas.jaraguadosul.sc.gov.br/index.php?class=GeoWelcomeView
- Orientação municipal de acesso público: https://www.jaraguadosul.sc.gov.br/educacao/zoneamento-escolar
- Portal de acesso aos sistemas PMJS: https://www.jaraguadosul.sc.gov.br/servicos/criacao-de-conta-para-acesso-aos-sistemas-internos-pmjs
- Governança TI municipal / GeoPortal 2: https://wordpress.jaraguadosul.sc.gov.br/wp-content/plugins/pmjs-paginas/downloads/29756/Gestao-e-Governanca-de-Tecnologia-da-Informacao.pdf
- Relato comunitário de ortofotos e geoprocessamento: https://www.openstreetmap.org/user/geomir/diary/399145
- Endpoint descrito de ortomosaico 2020: `https://www.jaraguadosul.sc.gov.br/geo/ortomosaico2020/{z}/{x}/{y}.png`
- OSM Wiki municipal: https://wiki.openstreetmap.org/wiki/Jaragu%C3%A1_do_Sul
- OSM Wiki / Prefeitura: https://wiki.openstreetmap.org/wiki/Brazil/SC/Jaragu%C3%A1_do_Sul/Prefeitura

**Matriz de certeza:** GeoMapView, entrada `index.php` e documentação municipal do geoportal estão registradas no v3; `PHP entry point` é evidência da URL. **Não há confirmação** do framework do portal (Leaflet, OpenLayers, MapLibre, Adianti), banco PostGIS nem servidor GeoServer. Não atribuir ao PMJS a stack escolhida para o Atlas. Contagem de 38 bairros e 15 localidades rurais no relato OSM é informação comunitária, não malha legal municipal verificada.

### TSE / IBGE / licenças

- BU 2022 TSE: https://dadosabertos.tse.jus.br/dataset/resultados-2022-boletim-de-urna
- Calendário eleitoral 2026: https://www.tse.jus.br/eleicoes/eleicoes-2026/calendario-eleitoral
- Resolução TSE 23.751/2026: https://www.tse.jus.br/legislacao/compilada/res/2026/resolucao-no-23-751-de-26-de-fevereiro-de-2026
- Datas eleitorais 2026: https://www.tse.jus.br/comunicacao/noticias/2026/Marco/eleicoes-2026-confira-as-principais-datas-do-calendario-eleitoral
- IBGE divisões intramunicipais: https://www.ibge.gov.br/geociencias/organizacao-do-territorio/estrutura-territorial/26565malhas-de-setores-censitarios-divisoes-intramunicipais.html
- Licença OSM: https://www.openstreetmap.org/copyright
- Uso de tiles OSM: https://operations.osmfoundation.org/policies/tiles/

## 10. ADRs iniciais

- `ADR-001`: Core genérico independente do domínio.
- `ADR-002`: `sourceGrain`, `analysisUnit` e crosswalk N:1 inicial.
- `ADR-003`: Hierarquia de geometria: cadastro/lei PMJS > IBGE > OSM de apoio, após checagem de safra/licença.
- `ADR-004`: React/Vite/MapLibre e static-first.
- `ADR-005`: Revisões imutáveis, checksums e permalinks.
- `ADR-006`: Regra de comparabilidade entre datasets e períodos.
- `ADR-007`: Limiar de confiabilidade decidido por distribuição, não por número arbitrário.
- `ADR-008`: Política de atribuição e uso de basemaps/ortofoto.

## 11. Definition of Done para v0.3.0

- [ ] Novo GitHub repo verificado com SHA de `main`.
- [ ] App compila e CI executa sobre o SHA da release.
- [ ] Território Jaraguá renderiza como mapa vetorial único.
- [ ] Dataset 2022 turno 1 é rastreável até origem e revisão.
- [ ] Clique/tap abre inspector e recalcula um KPI correto.
- [ ] Navegação via registry e URL sem listas fixas de anos/candidatos.
- [ ] Dataset 2026, se apresentado, exibe estado e data de atualização.
- [ ] Comparação incompatível é bloqueada com motivo explícito.
- [ ] Fixture não eleitoral passa sem alterar o core.
- [ ] Sumários municipais reconciliados e cobertura territorial visível.
- [ ] Testes e build aprovados, acessibilidade básica validada e deploy verificável.

## 12. Próximo passo único

**Executar Gate A e F6:** identificar o repositório recém-criado por nome completo; inspecionar `main`; subir documentação/contratos ausentes por PR; finalizar slice presidencial com revisão e inspector. Não confundir o histórico de testes do scaffold antigo com teste do novo repositório.

---

**Nota de auditabilidade:** as fontes acima foram resgatadas dos documentos v3 e v3.1. Sua presença neste catálogo não equivale a revalidação online de cada URL, licença ou endpoint em 07/10/2026. O estado de execução recuperado provém do histórico da conversa e precisa ser confirmado no GitHub recém-criado.

## 12. Auditoria de retomada em 08/10/2026 (GitHub)

- Repositório efetivo: https://github.com/alldevitone-maker/Atlas-Project
- Branch padrão: `main`.
- Head verificado antes deste documento: `148654f7a6ae3ce79b056a11cc40e84a2f86433e`.
- Roadmap v3 integral: `docs/reference/roadmap-v3-full.md`.
- Delta v3.1: `docs/reference/roadmap-v3.1-review-delta.md`.
- Resumo operacional v3.2: `docs/roadmap.md` (este arquivo integral complementa o resumo).
- Scaffold Web presente em `apps/web`, versão declarada na raiz `0.2.1`; bundles de produção e publicação web não comprovados por esta auditoria.
- Há workflow CI e pipeline de captura TSE; os commits mais recentes integram manifests/snapshots 2026. Validar qualidade, execução e origem dos artefatos antes de declará-los produção.
- Próximo gate real: executar CI no novo head, validar snapshot TSE 2026 contra totalização e construir o app React; depois implementar comparador sob `ComparisonPolicy`.

### Critérios de promoção para release

1. `npm run verify:foundation` verde no GitHub Actions.
2. `apps/web` build concluído em CI com dependências travadas e artefato publicado.
3. Prova independente da origem e reconciliação do dataset de 2026.
4. Crosswalk de bairro rotulado `prototype` até haver correspondência auditada; não classificar por domicílio do eleitor.
5. Testes de comparação, data revisions e E2E mobile/desktop executados; não marcar gates como PASS sem evidência.
