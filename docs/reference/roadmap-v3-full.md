# Projeto Atlas · Jaraguá do Sul
## Roadmap v3 — Arquitetura, dados, UX, SIG e plano de migração

**Data:** 07/10/2026  
**Status:** proposta de arquitetura para revisão externa  
**Território inicial:** Jaraguá do Sul, Santa Catarina, Brasil  
**Módulo funcional inicial:** Eleições presidenciais  
**Baseline preservada:** o Atlas já publicado dentro de `api-lab-faculdade` permanece intacto durante a migração.  
**Objetivo deste documento:** consolidar tudo que foi discutido, a revisão v2, a análise do Atlas atual, referências do GeoJaraguá/PMJS e a stack técnica proposta, deixando explícito o que é confirmado, proposto, inferido e ainda não decidido.

---

# 0. TL;DR para o revisor

A v3 transforma a ideia de “mapa eleitoral” em uma plataforma municipal de Atlas com:

- um único `MapEngine` sem conhecimento de domínio;
- contratos de dados antes do core;
- dados eleitorais sem candidatos, anos, partidos ou rótulos hardcoded;
- território versionado;
- resultado eleitoral canônico preservado em granularidade de seção/local de votação;
- bairro como unidade analítica derivada por `crosswalk`, nunca como substituto silencioso da fonte TSE;
- estado do dataset (`draft`, `provisional`, `totalized`, `official`);
- fonte, data, licença, checksum, versão territorial e método obrigatórios;
- permalink como parte do core;
- sidebar retrátil, topbar global, slots configuráveis e bottom sheet mobile;
- `hover` apenas como aprimoramento desktop; toda função essencial funciona por clique/tap;
- Eleições → Presidenciais como único domínio funcional inicial;
- módulos futuros registrados como `coming-soon`, sem lógica própria;
- TypeScript + React + Vite + MapLibre + Zod + Vitest + Playwright;
- GeoJSON/JSON na v1;
- adapters preparados para PMTiles, GeoParquet e DuckDB-WASM somente quando a escala justificar;
- pipelines Python + GitHub Actions;
- WCAG 2.2 AA, CSP, política de licença e controle de atribuição;
- CI com testes de contrato e teste de “período sintético” para provar ausência de hardcode.

A ideia central:

> **A fonte determina o dado. O contrato determina como ele entra. O estado determina o que o usuário vê. O motor nunca determina o significado.**

---

# 1. Origem e baseline atual

O Atlas nasceu dentro do repositório acadêmico:

- Repositório atual:  
  https://github.com/alldevitone-maker/api-lab-faculdade
- Atlas publicado:  
  https://alldevitone-maker.github.io/api-lab-faculdade/jaragua-atlas/
- PR que consolidou a ingestão TSE 2022:  
  https://github.com/alldevitone-maker/api-lab-faculdade/pull/6
- Commit consolidado no `main`:  
  https://github.com/alldevitone-maker/api-lab-faculdade/commit/da595c03d2ecb28645c23b5948d8a1c362810e94
- Workflow/deploy validado:  
  https://github.com/alldevitone-maker/api-lab-faculdade/actions/runs/37598037149

Estado técnico já validado no protótipo consolidado:

- mapa vetorial único com MapLibre;
- geometrias IBGE;
- dados 2022 derivados de boletins de urna + locais de votação;
- comparação 2022 ↔ 2026;
- busca territorial;
- inspector;
- KPIs;
- Playwright E2E;
- GitHub Actions;
- GitHub Pages;
- build reprodutível;
- 2022 com 355 seções reconciliadas e cobertura de associação reportada no pipeline legado.

**Regra da migração:** o repositório acadêmico não é refatorado durante a fundação do novo Atlas. Ele vira baseline visual, numérica e metodológica de regressão.

---

# 2. Escopo do novo Projeto Atlas

O novo repositório deve representar um produto independente da faculdade.

Estrutura conceitual humana:

```text
Projeto-Atlas/
└── Santa-Catarina/
    └── Jaragua-do-Sul/
        ├── eleicoes/
        ├── acidentes/              # futuro / coming-soon
        ├── crimes/                 # futuro / coming-soon
        ├── densidade-demografica/  # futuro / coming-soon
        └── ...
```

Porém, **a presença de uma pasta nunca será usada pelo runtime como registro de módulo**.

A estrutura física pode existir para organização, inclusive com `.gitkeep`, mas o software descobre módulos exclusivamente por configuração validada.

Na v1:

```text
Eleições
└── Presidenciais
    ├── 2022
    ├── 2026
    └── Comparar
```

Outros cargos eleitorais e temas municipais permanecem desativados.

---

# 3. O que mudou do Roadmap v2 para o v3

A revisão v2 detectou corretamente:

1. hardcode eleitoral dentro do próprio documento;
2. ausência de contrato formal de dados;
3. unidade territorial ambígua;
4. estado provisório/oficial de 2026 não modelado;
5. stack não definida;
6. permalink tratado tarde demais;
7. KPI Engine insuficientemente genérico;
8. rigor cartográfico não especificado;
9. privacidade/sigilo em agregações pequenas;
10. acessibilidade sem meta verificável;
11. painel inferior rígido demais;
12. falta de critérios de aceite, ADRs e política de licenças.

A v3 mantém essas correções e acrescenta:

- modelo explícito `sourceGrain` x `analysisUnit`;
- contrato de `Crosswalk`;
- contrato de `Candidate`;
- fórmulas declarativas sem `eval`;
- slots de UI;
- data provenance mais forte;
- URL state schema;
- matriz de evidência das tecnologias do GeoJaraguá;
- separação entre tecnologia **confirmada**, **inferida** e **não verificada** no sistema da Prefeitura;
- estratégia de migração incremental do protótipo;
- escada de formatos: GeoJSON/JSON primeiro, PMTiles/GeoParquet depois;
- critérios de aceitação técnicos e metodológicos por fase;
- riscos operacionais e reputacionais.

---

# 4. Princípios arquiteturais

## 4.1 Config-as-data

O comportamento do Atlas deve vir de configuração versionada e validada.

O código implementa mecanismos.  
A configuração define domínio.  
Os datasets carregam fatos.

```text
Código
├── MapEngine
├── Router
├── State
├── DataLoader
├── MetricEngine
├── InteractionEngine
└── UI Shell

Config
├── território
├── módulos
├── períodos
├── cargos
├── métricas
├── layouts
├── textos
└── tema

Dados
├── geometria
├── eleição
├── crosswalk
└── metadados/proveniência
```

## 4.2 Contrato antes de código

Nenhum novo dataset entra no Atlas sem esquema validável.

Contratos mínimos:

- `Territory`
- `TerritoryUnit`
- `Module`
- `Election`
- `Candidate`
- `Dataset`
- `Crosswalk`
- `Metric`
- `PanelSlot`
- `Basemap`
- `SourceAttribution`

## 4.3 Reprodutibilidade

Dado publicado deve ser reproduzível a partir de fonte bruta e pipeline versionado.

## 4.4 Estado serializável

Qualquer vista relevante deve ser reproduzível pela URL.

## 4.5 Domínio fora do motor

`MapEngine` não conhece:

- presidente;
- candidato;
- partido;
- ano eleitoral;
- acidente;
- crime;
- densidade;
- bairro específico.

Ele conhece apenas:

- source;
- geometry;
- layer;
- style;
- interaction;
- selection;
- camera;
- legend;
- feature state.

## 4.6 Estático primeiro

Nenhum backend será criado sem necessidade comprovada.

---

# 5. Arquitetura lógica

```text
                    ┌──────────────────────┐
                    │  Config Registry     │
                    │ validado por schema  │
                    └──────────┬───────────┘
                               │
                 ┌─────────────▼─────────────┐
                 │       App State           │
                 │   serializável na URL     │
                 └───────┬───────────┬───────┘
                         │           │
               ┌─────────▼───┐   ┌──▼─────────────┐
               │ URL Router  │   │ DatasetResolver│
               └─────────────┘   └──┬─────────────┘
                                    │
                              ┌─────▼──────┐
                              │ DataLoader │
                              └─────┬──────┘
                                    │
                  ┌─────────────────┼──────────────────┐
                  │                 │                  │
           ┌──────▼───────┐  ┌─────▼────────┐  ┌─────▼──────┐
           │ LayerManager │  │ MetricEngine │  │ Provenance │
           └──────┬───────┘  └─────┬────────┘  └────────────┘
                  │                │
           ┌──────▼───────┐  ┌────▼─────────┐
           │  MapEngine   │  │ KPI / Panels │
           └──────┬───────┘  └──────────────┘
                  │
         ┌────────▼───────────┐
         │ InteractionManager │
         │ hover/tap/select   │
         └────────────────────┘
```

---

# 6. Modelo territorial: decisão v3

A pergunta “bairro ou local de votação?” não deve ter resposta binária.

## 6.1 Granularidade canônica da fonte

Para eleições:

```text
sourceGrain
└── seção eleitoral
    └── local de votação
```

O TSE fornece resultado em granularidade eleitoral, não residencial.

## 6.2 Unidade de análise

O Atlas pode apresentar:

```text
analysisUnit
├── polling-place
└── neighborhood
```

### `polling-place`
Mais fiel à origem TSE.

### `neighborhood`
Mais legível para análise territorial, mas derivado de `crosswalk`.

## 6.3 Regra de honestidade

Nunca escrever:

> “moradores deste bairro votaram X”

Preferir:

> “resultado agregado dos locais/seções associados territorialmente a esta área”

ou, quando o bairro vier do cadastro do local de votação:

> “bairro/localidade do local de votação cadastrado no TSE”

## 6.4 Crosswalk versionado

Contrato sugerido:

```json
{
  "id": "<crosswalk-id>",
  "version": "<semver>",
  "sourceUnit": "section | polling-place",
  "targetUnit": "neighborhood",
  "territoryVintage": "<territory-version>",
  "method": "official-field | geocode | spatial-join | reviewed-alias",
  "coverage": {
    "matched": 0,
    "total": 0,
    "pct": 0
  },
  "exceptionsUri": "<path>",
  "generatedAt": "<iso-date>",
  "checksum": "<sha256>"
}
```

Cada associação pode registrar:

```json
{
  "sourceId": "<id>",
  "targetId": "<id>",
  "method": "spatial-join",
  "confidence": 0.0,
  "reviewed": false
}
```

**Não assumir que bairro eleitoral = bairro de residência.**

---

# 7. Safra territorial

Geometrias mudam.

Cada geometria precisa de versão/safra:

```json
{
  "id": "<territory-id>",
  "labelKey": "territories.jaraguaDoSul",
  "country": "BR",
  "state": "SC",
  "officialCode": "<official-code>",
  "units": [
    {
      "id": "neighborhoods",
      "vintage": "<version>",
      "source": "<source-id>",
      "license": "<license-id>",
      "uri": "<dataset-uri>"
    }
  ]
}
```

Comparação entre eleições só é classificada como diretamente comparável quando as unidades e safras forem compatíveis ou quando houver uma transformação comum documentada.

---

# 8. Contrato de dataset

```json
{
  "id": "<dataset-id>",
  "moduleId": "<module-id>",
  "domain": "<domain-id>",
  "periodId": "<period-id>",
  "roundId": "<round-id>",
  "status": "draft | provisional | totalized | official",
  "asOf": "<iso-date-time>",
  "publishedAt": "<iso-date-time>",
  "sourceGrain": "<source-grain>",
  "analysisUnit": "<analysis-unit>",
  "territoryId": "<territory-id>",
  "territoryVintage": "<version>",
  "crosswalkId": "<crosswalk-id>",
  "format": "json | geojson | flatgeobuf | pmtiles | geoparquet",
  "uri": "<relative-or-absolute-uri>",
  "schemaRef": "<schema-id>",
  "provenance": {
    "sourceId": "<source-id>",
    "sourceUrl": "<url>",
    "collectedAt": "<iso-date-time>",
    "license": "<license>",
    "methodDoc": "<url-or-path>"
  },
  "quality": {
    "coveragePct": 0,
    "reconciled": false,
    "notes": []
  },
  "checksum": "<sha256>"
}
```

---

# 9. Estado do dado eleitoral

Em 2026, a interface precisa distinguir claramente:

- rascunho;
- provisório;
- totalizado;
- oficial.

O calendário oficial do TSE define:

- 1º turno: **04/10/2026**
- eventual 2º turno: **25/10/2026**

Fontes:

- Calendário eleitoral 2026:  
  https://www.tse.jus.br/eleicoes/eleicoes-2026/calendario-eleitoral
- Resolução TSE nº 23.751/2026:  
  https://www.tse.jus.br/legislacao/compilada/res/2026/resolucao-no-23-751-de-26-de-fevereiro-de-2026
- Página explicativa do TSE:  
  https://www.tse.jus.br/comunicacao/noticias/2026/Marco/eleicoes-2026-confira-as-principais-datas-do-calendario-eleitoral

A UI deve exibir permanentemente:

```text
Fonte
Estado do dado
Atualizado em
Cobertura
```

Exemplo conceitual, nunca hardcoded:

```text
TSE · provisório
Atualizado em DD/MM/AAAA HH:mm
Cobertura: XX,XX%
```

---

# 10. Candidaturas: zero hardcode

O core não contém candidato, partido, número de urna ou cor política.

Contrato:

```json
{
  "id": "<candidate-id>",
  "officialName": "<official-name>",
  "ballotNumber": "<official-number>",
  "partyId": "<party-id>",
  "display": {
    "shortLabelKey": "<i18n-key>",
    "fullLabelKey": "<i18n-key>"
  }
}
```

O dataset eleitoral referencia candidaturas.

A UI gera cards, barras e KPIs a partir do dataset.

---

# 11. Metric Engine

Evitar funções específicas como:

```js
getBolsonaroShare()
getLulaShare()
get2022Margin()
```

Evitar também expressão textual arbitrária executada com `eval`.

Usar AST declarativa segura:

```json
{
  "id": "candidate-share",
  "labelKey": "metrics.candidateShare",
  "expression": {
    "op": "ratio",
    "numerator": {"field": "candidateVotes"},
    "denominator": {"field": "validVotes"}
  },
  "format": "percent",
  "classification": {
    "method": "quantile"
  }
}
```

Margem:

```json
{
  "id": "top-two-margin",
  "labelKey": "metrics.topTwoMargin",
  "expression": {
    "op": "difference",
    "left": {"metric": "rankedCandidateShare", "rank": 1},
    "right": {"metric": "rankedCandidateShare", "rank": 2}
  },
  "format": "percentage-points",
  "palette": {
    "type": "diverging",
    "center": 0
  }
}
```

---

# 12. Registry de módulos

```json
{
  "modules": [
    {
      "id": "<elections-module-id>",
      "labelKey": "modules.elections",
      "status": "active",
      "children": [
        {
          "id": "<presidential-domain-id>",
          "labelKey": "domains.presidential",
          "status": "active",
          "datasets": ["<dataset-id-1>", "<dataset-id-2>"]
        }
      ]
    },
    {
      "id": "<future-module-id>",
      "labelKey": "modules.future",
      "status": "coming-soon"
    }
  ]
}
```

A sidebar renderiza isso.

Não usar:

```js
if (module === 'eleicoes') { ... }
if (module === 'acidentes') { ... }
```

Usar:

```text
selected module
→ registry lookup
→ status check
→ dataset resolver
→ renderer contract
```

---

# 13. Gate de “zero hardcode”

Não usar apenas `grep`.

## 13.1 AST/lint

Bloquear nos packages de runtime:

- IDs territoriais concretos;
- nomes de candidatos;
- números de urna;
- nomes de partidos;
- anos eleitorais;
- strings de UI fora de i18n;
- caminhos diretos de dataset.

## 13.2 Contract test

Adicionar um período sintético apenas por configuração.

Aceite:

- menu aparece;
- URL serializa;
- dataset resolve;
- mapa carrega;
- legenda aparece;
- KPIs aparecem;
- comparação aceita/rejeita conforme regra;
- nenhum arquivo do core foi alterado.

Esse teste prova desacoplamento muito melhor que busca textual.

---

# 14. URL e permalink

Permalink faz parte do core.

Exemplo semântico:

```text
?territory=<id>
&module=<id>
&domain=<id>
&period=<id>
&round=<id>
&metric=<id>
&feature=<id>
&basemap=<id>
```

O Router:

1. lê;
2. valida contra schemas;
3. resolve IDs no registry;
4. rejeita combinações inválidas;
5. atualiza App State;
6. sincroniza alterações de volta para a URL.

Nenhum valor é aceito sem validação.

---

# 15. Shell de UX

```text
┌──────────────────────────────────────────────────────────────┐
│ TOPBAR GLOBAL                                                │
│ território | busca | mapa-base | labels | tema | fontes     │
├────────────────┬─────────────────────────────────────────────┤
│ SIDEBAR        │                                             │
│ retrátil       │                MAPA                         │
│                │                                             │
│ módulos        │                                             │
│ └ submenus     │                                             │
│                │                                             │
├────────────────┴─────────────────────────────────────────────┤
│ SLOT INFERIOR / KPIs / COMPARAÇÃO / SÉRIE                   │
└──────────────────────────────────────────────────────────────┘
```

Painéis não são fixos por domínio.

Slots:

```text
layout.slots
├── topbar
├── sidebar
├── mapOverlay
├── inspector
├── bottomPanel
└── mobileSheet
```

O shell decide layout.  
O módulo pede conteúdo.

---

# 16. Sidebar

Desktop:

- recolhida/expandida;
- mantém mapa utilizável;
- animação curta;
- estado persistente opcional.

Árvore inicial:

```text
Eleições
└── Presidenciais
    ├── <período vindo do registry>
    ├── <período vindo do registry>
    └── Comparar
```

Períodos futuros podem aparecer desabilitados.

Módulos `coming-soon`:

- continuam clicáveis apenas para feedback;
- não alteram dataset;
- exibem mensagem discreta;
- texto vem de i18n, não de literal no código.

---

# 17. Topbar

Somente controles globais:

- nome/localização do Atlas;
- busca territorial;
- mapa-base;
- ligar/desligar labels;
- tema claro/escuro;
- centralizar;
- compartilhar/permalink;
- metodologia/fontes;
- ajuda;
- status global do dado quando necessário.

Não colocar controles específicos de eleições na topbar.

---

# 18. Desktop: hover e seleção

## Hover

`pointermove` sobre feature:

- nome da unidade;
- dataset/período ativo;
- principal indicador;
- resumo curto;
- selo de estado do dado.

Não deve abrir painel pesado.

## Click

Fixa a feature e alimenta:

- inspector;
- KPIs;
- comparação;
- URL;
- seleção visual.

---

# 19. Mobile: substituir hover por tap

Mobile não depende de hover.

Primeiro tap:

- seleciona área;
- exibe resumo compacto;
- destaca feature;
- sincroniza URL.

Bottom sheet:

```text
collapsed
half
expanded
```

Sempre preservar área útil do mapa.

Controles primários do período devem ficar evidentes, mas **gerados dinamicamente pelo registry**.

---

# 20. KPIs

O painel não contém nomes fixos de candidaturas.

Categorias genéricas:

- votos válidos;
- comparecimento;
- abstenção;
- candidatura mais votada;
- segunda candidatura;
- margem;
- brancos;
- nulos;
- cobertura do dataset;
- qualidade/crosswalk quando relevante.

O módulo entrega a lista de KPI definitions.

---

# 21. Cartografia

## 21.1 Votos

Mapa eleitoral prioriza proporções/share, não contagem bruta.

## 21.2 Margem

Escala divergente centrada em zero.

## 21.3 Classes

Método declarado no `Metric`:

- quantile;
- Jenks;
- manual;
- continuous.

## 21.4 Sem dados

Cor/texture semanticamente distinta.

## 21.5 Poucos votos

Aplicar política de supressão definida por metodologia.

## 21.6 Informação nunca apenas por cor

Legenda textual, tooltip e tabela acessível.

---

# 22. Privacidade, sigilo e inferência

Não há dados pessoais de eleitores no Atlas.

Mesmo assim, granularidade pequena pode produzir inferências indesejadas.

Política:

- tamanho mínimo configurável;
- supressão;
- sem tentativa de inferir voto individual;
- sem perfil demográfico individual;
- nota contra falácia ecológica;
- nenhum cruzamento futuro deve permitir reidentificação.

---

# 23. Acessibilidade

Meta:

**WCAG 2.2 AA**

Fonte:

https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/

Requisitos:

- navegação completa por teclado;
- foco visível;
- ARIA adequada;
- contraste;
- alvo de toque;
- alternativa tabular;
- resumo textual da seleção;
- paletas compatíveis com daltonismo;
- nunca depender exclusivamente de cor;
- drawer e bottom sheet acessíveis;
- reduz motion quando solicitado.

---

# 24. Map Engine

Responsabilidades:

```text
MapEngine
├── camera
├── sources
├── layers
├── feature-state
├── hit-testing
├── selection
├── events
├── basemap
└── attribution
```

Não contém:

```text
ElectionEngine
CandidateEngine
AccidentEngine
CrimeEngine
```

---

# 25. Basemaps

Contrato:

```json
{
  "id": "<basemap-id>",
  "type": "style | xyz | raster | pmtiles",
  "labelKey": "<i18n-key>",
  "uri": "<uri>",
  "attributionIds": ["<source-id>"],
  "minZoom": 0,
  "maxZoom": 0
}
```

Providers podem ser trocados sem alterar módulo eleitoral.

---

# 26. GeoJaraguá / PMJS — reconhecimento técnico

Site enviado para referência:

https://sistemas.jaraguadosul.sc.gov.br/index.php?class=GeoMapView

Acesso inicial público:

https://sistemas.jaraguadosul.sc.gov.br/index.php?class=GeoWelcomeView

## 26.1 O que é confirmado

### Sistema municipal interno

A própria Prefeitura informa que `sistemas.jaraguadosul.sc.gov.br` reúne sistemas desenvolvidos internamente pela TI municipal, incluindo Geoportal.

Fonte oficial:

https://www.jaraguadosul.sc.gov.br/servicos/criacao-de-conta-para-acesso-aos-sistemas-internos-pmjs

### Acesso anônimo/público ao Geoportal

A página oficial de zoneamento escolar orienta:

1. abrir o Geoportal;
2. “Acessar Geo”;
3. “Entrar como Anônimo”;
4. pesquisar endereço;
5. consultar o imóvel.

Fonte:

https://www.jaraguadosul.sc.gov.br/educacao/zoneamento-escolar

### OSM no ecossistema municipal

Há documentação comunitária específica do uso de OpenStreetMap pela Prefeitura de Jaraguá do Sul:

https://wiki.openstreetmap.org/wiki/Brazil/SC/Jaragu%C3%A1_do_Sul/Prefeitura

Página municipal no OSM Wiki:

https://wiki.openstreetmap.org/wiki/Jaragu%C3%A1_do_Sul

### Ortomosaico 2020 via TMS/XYZ

Registro do setor de geoprocessamento da Prefeitura no OSM informa o endpoint:

```text
https://www.jaraguadosul.sc.gov.br/geo/ortomosaico2020/{z}/{x}/{y}.png
```

Fonte:

https://www.openstreetmap.org/user/geomir/diary/399145

Esse registro também relata trabalho municipal de atualização de edificações e o uso do mosaico no ecossistema OSM.

### 38 bairros e 15 localidades rurais

A mesma fonte registra 38 bairros e 15 localidades rurais no trabalho municipal de mapeamento.

Fonte:

https://www.openstreetmap.org/user/geomir/diary/399145

**Atenção:** para uso como dado oficial atual no Atlas, essa contagem deve ser reconfirmada contra fonte territorial municipal/IBGE da versão usada no dataset.

### GeoPortal 2 e integração municipal

Documento oficial de Gestão e Governança de TI da Prefeitura menciona o GeoPortal 2 no contexto de plataformas e integração de sistemas municipais.

Fonte:

https://wordpress.jaraguadosul.sc.gov.br/wp-content/plugins/pmjs-paginas/downloads/29756/Gestao-e-Governanca-de-Tecnologia-da-Informacao.pdf

## 26.2 O que a URL confirma tecnicamente

O endpoint público usa:

```text
index.php?class=GeoMapView
```

Logo, existe um **entry point PHP** no servidor.

Isso **não é suficiente** para afirmar qual framework PHP é usado.

## 26.3 O que NÃO foi confirmado

Não foi possível obter, pelo crawler usado nesta análise, o bundle/source do GeoMapView com confiabilidade suficiente para afirmar:

- Leaflet;
- OpenLayers;
- Mapbox;
- MapLibre;
- Adianti;
- framework PHP específico;
- banco de dados;
- servidor GIS;
- backend espacial.

A UI visual se parece com soluções GIS web tradicionais, mas **aparência não é prova de tecnologia**.

### Regra do v3

Não copiar ou reproduzir código do GeoJaraguá.

Usar o sistema apenas como referência funcional:

- mapa multifinalitário;
- camadas;
- inspeção;
- pesquisa;
- ortofoto;
- território;
- navegação municipal.

---

# 27. Lições de UX do GeoJaraguá observadas

A referência visual enviada mostra:

- mapa como elemento dominante;
- contornos territoriais fortes;
- múltiplas áreas vetoriais;
- toolbar vertical;
- zoom;
- inspeção;
- ferramenta de medição;
- manipulação/consulta;
- painel inferior;
- alternância de função sem sair do mapa.

No Projeto Atlas:

**manter**
- mapa dominante;
- território legível;
- múltiplas camadas;
- consulta por feature;
- mapa-base intercambiável.

**melhorar**
- sidebar consistente;
- topbar;
- bottom sheet mobile;
- hierarchy disclosure;
- KPIs;
- permalink;
- acessibilidade;
- proveniência;
- estado do dado;
- design tokens;
- responsividade.

---

# 28. Fontes cartográficas e licenças

## OpenStreetMap

Copyright/licença:

https://www.openstreetmap.org/copyright

Tile Usage Policy:

https://operations.osmfoundation.org/policies/tiles/

Implicações:

- dados OSM requerem atribuição;
- OSM usa ODbL;
- os tiles públicos do OSM não são um CDN gratuito ilimitado;
- basemap deve ser provider-configurable;
- produção de maior escala deve usar serviço adequado ou tiles próprios/licenciados.

## Ortofoto municipal

A existência técnica do endpoint TMS/XYZ foi registrada.

Antes de uso em produção no Atlas:

- confirmar licença;
- confirmar autorização de redistribuição/exibição;
- confirmar requisitos de atribuição;
- confirmar estabilidade do endpoint;
- não assumir que disponibilidade pública equivale a licença irrestrita.

---

# 29. IBGE

Malhas oficiais:

https://www.ibge.gov.br/geociencias/organizacao-do-territorio/estrutura-territorial/26565malhas-de-setores-censitarios-divisoes-intramunicipais.html

O IBGE disponibiliza:

- setores censitários;
- distritos;
- subdistritos;
- bairros;
- SHP;
- GPKG;
- KML;
- dicionários;
- material de comparabilidade entre malhas.

Consequência arquitetural:

`territoryVintage` é obrigatório.

---

# 30. TSE

## Boletim de Urna 2022

Dataset oficial:

https://dadosabertos.tse.jus.br/dataset/resultados-2022-boletim-de-urna

Inclui 1º e 2º turno por UF e hashes.

## 2026

Calendário:

https://www.tse.jus.br/eleicoes/eleicoes-2026/calendario-eleitoral

Resolução geral:

https://www.tse.jus.br/legislacao/compilada/res/2026/resolucao-no-23-751-de-26-de-fevereiro-de-2026

O pipeline do Atlas deve tratar TSE como fonte eleitoral primária.

---

# 31. Stack proposta v3

Status: **proposta para ADR**, não “verdade definitiva”.

## 31.1 Linguagem

**TypeScript strict**

Docs:

https://www.typescriptlang.org/docs/

Motivos:

- contratos;
- refatoração;
- interfaces;
- discriminated unions;
- melhor integração com schema validation.

## 31.2 UI

**React**

Docs:

https://react.dev/

Motivos:

- componentes;
- ecossistema;
- maturidade;
- composição de slots;
- integração ampla;
- facilidade para testes.

Observação:

React é biblioteca, não arquitetura. O core deve evitar dependência desnecessária da UI.

## 31.3 Build

**Vite**

Docs:

https://vite.dev/guide/

Motivos:

- dev server rápido;
- ESM;
- build estático;
- integração direta com MapLibre;
- pipeline simples.

## 31.4 Mapa

**MapLibre GL JS**

Docs:

https://maplibre.org/maplibre-gl-js/docs/

Map API:

https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/

Motivos:

- open source;
- TypeScript;
- WebGL;
- vector tiles;
- raster;
- events;
- feature state;
- popups;
- controles;
- estilos declarativos;
- já usado no protótipo atual.

## 31.5 Schema validation

**Zod**

Docs:

https://zod.dev/

Motivos:

- TypeScript-first;
- runtime validation;
- inferência estática;
- JSON Schema interoperability.

## 31.6 Testes unitários

**Vitest**

Docs:

https://vitest.dev/guide/

Motivos:

- alinhado ao Vite;
- configuração compartilhada;
- rápido;
- adequado para registry/resolver/metrics/contracts.

## 31.7 E2E

**Playwright**

Docs:

https://playwright.dev/docs/browsers

Motivos:

- Chromium;
- Firefox;
- WebKit;
- emulação mobile;
- CI;
- fluxos desktop/mobile.

## 31.8 Pipeline de dados

**Python**

Bibliotecas candidatas:

- pandas;
- geopandas;
- pyarrow;
- shapely;
- duckdb;
- pyshp quando necessário.

Uso:

- ingestão;
- checksums;
- normalização;
- crosswalk;
- reconciliação;
- publicação.

## 31.9 CI/CD

**GitHub Actions**

Docs:

https://docs.github.com/en/actions/get-started/quickstart

## 31.10 Hosting inicial

**GitHub Pages**

Docs:

https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

Limites:

https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

Adequado para v1 estática.

---

# 32. Formatos de dados: decisão de escala

## V1

Usar:

```text
GeoJSON
JSON
```

Motivo:

Jaraguá do Sul tem escala municipal. Simplicidade, auditabilidade e velocidade de desenvolvimento vencem over-engineering.

O contrato abstrai o formato.

## Futuro: PMTiles

Docs:

https://docs.protomaps.com/pmtiles/

Repositório:

https://github.com/protomaps/PMTiles

PMTiles é um arquivo único para pirâmides de tiles, lido por HTTP Range Requests e adequado a armazenamento estático.

Uso futuro:

- grande quantidade de features;
- maior número de camadas;
- expansão territorial;
- tiles vetoriais;
- evitar tile server dedicado.

## Futuro: GeoParquet

Site/spec:

https://geoparquet.org/

Spec 1.1:

https://geoparquet.org/releases/v1.1.0/

Uso futuro:

- datasets analíticos grandes;
- coluna;
- interoperabilidade geoespacial;
- leitura por engines analíticas.

## Futuro: DuckDB-WASM

Docs:

https://duckdb.org/docs/current/clients/wasm/extensions

Pode executar consultas analíticas no browser e possui extensões para Parquet e spatial.

**Não colocar DuckDB-WASM na primeira versão sem necessidade real.**

## Referência de escala

CarbonPlan Open Climate Risk:

https://docs.carbonplan.org/ocr/en/latest/access-data.html

Exemplo de dataset vetorial publicado em GeoParquet e dados regionais em CSV/GeoJSON.

MapLibre/Martin também está evoluindo integração com DuckDB/GeoParquet:

https://maplibre.org/roadmap/martin-tile-server/data-duckdb/

---

# 33. Estado global

Modelo conceitual:

```ts
type AtlasState = {
  territoryId: string
  moduleId: string
  domainId?: string
  datasetId?: string
  comparisonDatasetId?: string
  metricId?: string
  selectedFeatureId?: string
  basemapId: string
  labelsVisible: boolean
  panelState: string
  theme: string
  locale: string
}
```

Valores concretos entram por config/runtime, não são defaults de domínio no package central.

---

# 34. Estrutura de repositório proposta

```text
projeto-atlas/
│
├── apps/
│   └── web/
│
├── packages/
│   ├── contracts/
│   ├── registry/
│   ├── state/
│   ├── router/
│   ├── data-loader/
│   ├── map-engine/
│   ├── metrics/
│   ├── ui-shell/
│   └── i18n/
│
├── config/
│   ├── atlas/
│   └── territories/
│       └── br/
│           └── sc/
│               └── jaragua-do-sul/
│                   ├── territory.json
│                   ├── modules.json
│                   ├── basemaps.json
│                   └── layouts.json
│
├── data/
│   └── territories/
│       └── br/
│           └── sc/
│               └── jaragua-do-sul/
│                   ├── geography/
│                   └── elections/
│
├── pipelines/
│   ├── elections/
│   ├── geography/
│   └── shared/
│
├── schemas/
│
├── tests/
│   ├── contract/
│   ├── e2e/
│   ├── visual/
│   └── accessibility/
│
├── docs/
│   ├── architecture/
│   ├── methodology/
│   ├── sources/
│   └── adr/
│
└── .github/
    └── workflows/
```

A organização humana “Santa Catarina / Jaraguá do Sul” é mantida semanticamente dentro de `config` e `data`, sem o runtime depender de paths fixos.

---

# 35. Migração do Atlas atual

## Etapa A — congelar baseline

Não alterar `api-lab-faculdade`.

Registrar:

- commit;
- screenshots;
- números;
- E2E;
- checksums;
- comportamento mobile/desktop.

## Etapa B — criar repositório independente

Somente scaffold.

Sem migração de código na primeira alteração.

## Etapa C — contratos

Implementar schemas antes de copiar domínio.

## Etapa D — portar pipeline 2022

Produzir dataset conforme novo contrato.

Comparar output com baseline consolidada.

## Etapa E — portar 2026

Preservar estado/proveniência/data.

## Etapa F — implementar core

Sem UI eleitoral específica.

## Etapa G — módulo Eleições

Conectar config + datasets.

## Etapa H — UX final

Sidebar, topbar, slots, hover/tap, KPIs, inspector.

---

# 36. Fases v3 e critérios de aceite

## Fase 0 — Evidência e baseline

Entregas:

- snapshot do Atlas atual;
- inventário de dados;
- inventário de licenças;
- baseline de performance;
- lista de fontes;
- relatório do GeoJaraguá.

Aceite:

- nenhuma fonte sem classificação;
- nenhuma alteração no Atlas atual.

## Fase 1 — Contratos e metodologia

Entregas:

- schemas de Territory;
- Module;
- Dataset;
- Candidate;
- Crosswalk;
- Metric;
- Basemap;
- Attribution.

Aceite:

- exemplos válidos e inválidos;
- validação automática;
- método de crosswalk documentado.

## Fase 2 — Repositório e CI

Entregas:

- monorepo;
- TypeScript strict;
- Vite;
- Vitest;
- schema validation;
- no-hardcode AST;
- synthetic-period test.

Aceite:

- CI verde;
- runtime sem literais de domínio.

## Fase 3 — Pipeline 2022

Entregas:

- ingestão oficial;
- checksum;
- reconciliação;
- crosswalk;
- relatório de exceções;
- metadados.

Aceite:

- totais reconciliados;
- cobertura registrada;
- output reproduzível.

## Fase 4 — Pipeline 2026

Entregas:

- status de dataset;
- `asOf`;
- cobertura;
- preparação para 2º turno;
- rerun idempotente.

Aceite:

- dados provisórios não aparecem como oficiais;
- atualização não exige mudança no core.

## Fase 5 — Core runtime

Entregas:

- state;
- router/permalink;
- registry;
- resolver;
- loader;
- metrics;
- MapEngine;
- layer manager;
- interaction manager.

Aceite:

- período sintético funciona apenas via config.

## Fase 6 — Módulo Eleições

Entregas:

- presidencial;
- períodos;
- rounds;
- comparação;
- candidaturas dinâmicas;
- KPIs declarativos.

Aceite:

- nenhuma candidatura no source runtime;
- números batem com datasets validados.

## Fase 7 — Desktop UX

Entregas:

- topbar;
- sidebar;
- hover;
- click;
- slots;
- busca;
- permalink;
- legend;
- source badge.

Aceite:

- teclado;
- WCAG crítica zero;
- mapa não perde área excessiva.

## Fase 8 — Mobile UX

Entregas:

- drawer;
- tap;
- bottom sheet;
- períodos dinâmicos;
- safe areas;
- portrait/landscape.

Aceite:

- Playwright mobile;
- mapa sempre utilizável;
- nenhuma função essencial depende de hover.

## Fase 9 — Hardening

Entregas:

- CSP;
- dependencies audit;
- visual regression;
- a11y;
- performance;
- licenses;
- docs públicas.

Aceite:

- checklist de lançamento.

## Fase 10 — Extensibilidade

Somente depois do módulo eleitoral estabilizado.

Outros módulos permanecem `coming-soon`.

---

# 37. CI obrigatório

```text
lint
typecheck
unit-tests
schema-validation
dataset-validation
crosswalk-validation
reconciliation
no-hardcode-ast
synthetic-period-contract-test
build
playwright-desktop
playwright-mobile
accessibility
visual-regression
pages-artifact
deploy
```

---

# 38. Segurança

Frontend público e estático.

Requisitos:

- CSP;
- dependências pinadas/lockfile;
- nenhum segredo no frontend;
- dados read-only;
- nenhuma credencial;
- nada de endpoint administrativo;
- sanitização de HTML;
- validação de config;
- sem `eval`;
- SRI/CDN ou dependência vendorizada/buildada quando aplicável.

MapLibre possui documentação específica para CSP:

https://maplibre.org/maplibre-gl-js/docs/

---

# 39. Performance

Primeiro medir baseline.

Orçamento inicial **provisório**, sujeito a ADR após medição:

- shell carregável em rede móvel comum;
- mapa interativo em poucos segundos em Android intermediário;
- evitar carregar datasets não ativos;
- lazy-load de módulos;
- request cancellation;
- cache;
- geometry simplification por zoom;
- adapters para tile/archive quando GeoJSON deixar de ser adequado.

Não otimizar para escala nacional na v1.

---

# 40. Observabilidade

Sem tracking individual.

Permitido:

- erros JS anonimizados;
- métricas agregadas de performance;
- versão do app;
- versão do dataset;
- contagem agregada de falhas de loader.

Não coletar:

- identidade;
- localização precisa desnecessária;
- perfil eleitoral;
- histórico de navegação individual.

---

# 41. i18n

Nenhuma string de UI solta nos packages.

```text
locales/
├── pt-BR.json
└── en.json   # preparado, não precisa estar completo na v1
```

IDs de domínio são estáveis.

Labels vêm de catálogo/config.

---

# 42. Design tokens

```text
tokens
├── colors
├── typography
├── spacing
├── radius
├── elevation
├── motion
└── breakpoints
```

Paletas eleitorais não devem ser definidas pelo partido dentro do core.

O módulo/dataset fornece semântica e o tema resolve apresentação.

---

# 43. Coming-soon

Módulos futuros devem existir no registry apenas se fizer sentido para roadmap visual.

Exemplo:

```json
{
  "id": "<module-id>",
  "status": "coming-soon",
  "labelKey": "<label-key>"
}
```

Nenhuma pasta de dados é necessária até haver contrato e fonte.

Se for desejado scaffold físico, usar `.gitkeep`; isso é organização, não descoberta de runtime.

---

# 44. ADRs iniciais

Criar:

```text
ADR-001 Repository architecture
ADR-002 React vs Svelte
ADR-003 MapLibre
ADR-004 Territory model
ADR-005 Election source grain
ADR-006 Crosswalk method
ADR-007 GeoJSON-first
ADR-008 PMTiles escalation
ADR-009 Dataset lifecycle
ADR-010 URL state
ADR-011 Accessibility
ADR-012 Privacy and suppression
ADR-013 Basemap/licensing
ADR-014 Hosting
```

---

# 45. Riscos

| Risco | Impacto | Mitigação |
|---|---:|---|
| Dados 2026 mudarem | alto | status + asOf + pipeline rerunnable |
| Crosswalk errado | alto | cobertura + exceções + confidence + auditoria |
| Geometria mudar | alto | territoryVintage |
| Rótulo político enviesado | alto | nomes oficiais da fonte |
| Hardcode voltar | alto | lint AST + synthetic test |
| Ortofoto sem licença clara | alto | não publicar até licença validada |
| OSM tile abuse | médio | provider configurável |
| Over-engineering | alto | GeoJSON-first |
| Mobile perder mapa para painéis | médio | slots + bottom sheet states |
| Pequena seção permitir inferência | alto | supressão |
| Framework acoplar o core | médio | packages separados |
| Comparação metodologicamente inválida | alto | comparison policy |

---

# 46. Perguntas para o próximo revisor

1. O modelo dual `sourceGrain = seção/local` e `analysisUnit = bairro/local de votação` resolve corretamente a tensão entre fidelidade TSE e legibilidade?
2. O `Crosswalk` precisa modelar relação N:N explicitamente desde a v1?
3. A regra de comparabilidade deve viver no `Metric`, no `Dataset` ou em um `ComparisonPolicy` separado?
4. React + Vite é a melhor escolha para este shell ou Svelte reduziria complexidade sem prejudicar ecossistema?
5. Devemos usar Zustand/nanostores, ou uma store própria com reducer seria suficiente?
6. GeoJSON + JSON é a escolha correta para v1?
7. PMTiles deve existir apenas como adapter futuro ou já entrar no contrato inicial?
8. DuckDB-WASM deve ser totalmente adiado?
9. Qual limiar de supressão eleitoral é defensável metodologicamente?
10. Qual estratégia de spatial join/crosswalk deve ser preferida quando o cadastro TSE não tiver coordenada confiável?
11. É melhor expor `polling-place` como camada pública desde v1?
12. Qual formato de changelog de dataset deve ser adotado?
13. O schema de `Metric` deve ser um AST declarativo próprio ou usar uma DSL existente?
14. Devemos versionar config e dataset juntos ou separadamente?
15. Vale manter GitHub Pages até qual tamanho de artefato/uso?

---

# 47. Matriz de evidência do GeoJaraguá

| Item | Estado | Evidência |
|---|---|---|
| GeoMapView público | confirmado | URL PMJS |
| acesso anônimo | confirmado | página oficial de zoneamento escolar |
| PHP entry point | confirmado pela URL | `index.php` |
| sistema interno PMJS | confirmado | página oficial de serviços |
| OpenStreetMap no ecossistema | confirmado | PMJS/OSM community records |
| ortomosaico 2020 | confirmado | registro de geoprocessamento |
| TMS/XYZ | confirmado | URL `{z}/{x}/{y}.png` |
| 38 bairros / 15 localidades rurais | registrado em fonte técnica comunitária | OSM diary |
| GeoPortal 2 / integração | confirmado em documento municipal | governança TI |
| Leaflet | não confirmado | não afirmar |
| OpenLayers | não confirmado | não afirmar |
| MapLibre | não confirmado no PMJS | não afirmar |
| Adianti | não confirmado | não afirmar |
| PostGIS | não confirmado | não afirmar |
| GeoServer | não confirmado | não afirmar |

---

# 48. Catálogo completo de fontes e links

## Projeto atual

1. API Lab  
   https://github.com/alldevitone-maker/api-lab-faculdade

2. Atlas publicado  
   https://alldevitone-maker.github.io/api-lab-faculdade/jaragua-atlas/

3. PR #6  
   https://github.com/alldevitone-maker/api-lab-faculdade/pull/6

4. Deploy validado  
   https://github.com/alldevitone-maker/api-lab-faculdade/actions/runs/37598037149

5. Commit baseline  
   https://github.com/alldevitone-maker/api-lab-faculdade/commit/da595c03d2ecb28645c23b5948d8a1c362810e94

## Prefeitura / GeoJaraguá

6. GeoMapView  
   https://sistemas.jaraguadosul.sc.gov.br/index.php?class=GeoMapView

7. GeoWelcomeView  
   https://sistemas.jaraguadosul.sc.gov.br/index.php?class=GeoWelcomeView

8. Instruções oficiais de acesso público/anônimo via zoneamento escolar  
   https://www.jaraguadosul.sc.gov.br/educacao/zoneamento-escolar

9. Sistemas internos PMJS / Geoportal  
   https://www.jaraguadosul.sc.gov.br/servicos/criacao-de-conta-para-acesso-aos-sistemas-internos-pmjs

10. Gestão e Governança de TI / GeoPortal 2  
    https://wordpress.jaraguadosul.sc.gov.br/wp-content/plugins/pmjs-paginas/downloads/29756/Gestao-e-Governanca-de-Tecnologia-da-Informacao.pdf

11. Ortofoto/TMS + relato de geoprocessamento  
    https://www.openstreetmap.org/user/geomir/diary/399145

12. Endpoint ortomosaico municipal 2020  
    https://www.jaraguadosul.sc.gov.br/geo/ortomosaico2020/{z}/{x}/{y}.png

13. OSM Wiki Jaraguá do Sul  
    https://wiki.openstreetmap.org/wiki/Jaragu%C3%A1_do_Sul

14. OSM Wiki — uso governamental pela Prefeitura  
    https://wiki.openstreetmap.org/wiki/Brazil/SC/Jaragu%C3%A1_do_Sul/Prefeitura

## Eleições

15. TSE — BU 2022  
    https://dadosabertos.tse.jus.br/dataset/resultados-2022-boletim-de-urna

16. TSE — Calendário 2026  
    https://www.tse.jus.br/eleicoes/eleicoes-2026/calendario-eleitoral

17. TSE — Resolução 23.751/2026  
    https://www.tse.jus.br/legislacao/compilada/res/2026/resolucao-no-23-751-de-26-de-fevereiro-de-2026

18. TSE — principais datas 2026  
    https://www.tse.jus.br/comunicacao/noticias/2026/Marco/eleicoes-2026-confira-as-principais-datas-do-calendario-eleitoral

## Geografia

19. IBGE — malhas de setores e divisões intramunicipais  
    https://www.ibge.gov.br/geociencias/organizacao-do-territorio/estrutura-territorial/26565malhas-de-setores-censitarios-divisoes-intramunicipais.html

20. OpenStreetMap — licença  
    https://www.openstreetmap.org/copyright

21. OpenStreetMap — Tile Usage Policy  
    https://operations.osmfoundation.org/policies/tiles/

## Stack

22. TypeScript  
    https://www.typescriptlang.org/docs/

23. React  
    https://react.dev/

24. Vite  
    https://vite.dev/guide/

25. MapLibre GL JS  
    https://maplibre.org/maplibre-gl-js/docs/

26. MapLibre Map API  
    https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/

27. Zod  
    https://zod.dev/

28. Vitest  
    https://vitest.dev/guide/

29. Playwright  
    https://playwright.dev/docs/browsers

30. GitHub Actions  
    https://docs.github.com/en/actions/get-started/quickstart

31. GitHub Pages workflows  
    https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

32. GitHub Pages limits  
    https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

33. WCAG 2.2  
    https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/

## Escala futura / cloud-native geospatial

34. PMTiles docs  
    https://docs.protomaps.com/pmtiles/

35. PMTiles repo  
    https://github.com/protomaps/PMTiles

36. GeoParquet  
    https://geoparquet.org/

37. GeoParquet 1.1  
    https://geoparquet.org/releases/v1.1.0/

38. DuckDB-WASM extensions  
    https://duckdb.org/docs/current/clients/wasm/extensions

39. CarbonPlan Open Climate Risk data  
    https://docs.carbonplan.org/ocr/en/latest/access-data.html

40. MapLibre Martin — DuckDB support roadmap  
    https://maplibre.org/roadmap/martin-tile-server/data-duckdb/

---

# 49. Recomendação v3

Criar o novo repositório **somente depois** de aprovar:

1. contratos;
2. modelo territorial;
3. crosswalk;
4. stack inicial;
5. estrutura do repo;
6. regras de CI.

Primeiro commit recomendado:

```text
docs + schemas + config skeleton + CI
```

Não migrar o Atlas no primeiro commit.

Segundo marco:

```text
pipeline 2022 reproduzível
```

Só depois:

```text
core + UI + migração
```

---

# 50. Definição de sucesso

O Projeto Atlas v1 está arquiteturalmente pronto quando:

- trocar um período não exige alteração no core;
- trocar candidaturas não exige alteração no core;
- inserir um período sintético funciona por config;
- o mapa não sabe o que é eleição;
- o KPI Engine não sabe quem é candidato;
- o Router compartilha qualquer estado;
- cada dataset tem proveniência;
- cada geometria tem safra;
- cada comparação tem regra metodológica;
- hover é opcional;
- mobile funciona por tap;
- fontes e estado do dado são visíveis;
- 2022 é reproduzível;
- 2026 pode ser atualizado sem release de domínio;
- o Atlas atual continua intacto até a nova versão superar os testes de regressão.

---

## Fim do Roadmap v3
