# Auditoria de aderência ao roadmap v3.2

Data: 08/10/2026. Árvore auditada: `1261d602792c69b239959f0b4e2f5de0644a861f`, confirmada como main pela API do GitHub. Referência: [roadmap integral v3.2](reference/roadmap-v3.2-execution.md).

## Conclusão

A publicação e o hardening inicial estão entregues. O roadmap e o aceite da v0.3.0 ainda NÃO estão concluídos. O produto permanece em v0.2.1, com dados derivados do legado e cartografia exploratória. Os testes existentes verificam esse escopo; não comprovam ingestão oficial completa, integração do core no frontend nem conclusão da experiência analítica.

Auditoria por leitura de código, contratos, fixtures, pipelines, configuração e documentação. Reutilizada a evidência de testes/build/deploy da release funcional `02986a5`; não foi executada uma nova suíte nem modificada a aplicação neste trabalho. Revalidada no GitHub a existência do snapshot bruto de 2026. Não foi baixado nem recalculado seu hash nesta auditoria.

## Situação por fase

| Fase v3.2 | Estado | Evidência e falta concreta |
|---|---|---|
| F0 Evidências | Parcial | Catálogo, hashes e snapshot 2026 existem. Falta cadeia completa bruto → transformação → dados exibidos, fonte cartográfica oficial e licenças verificadas. |
| F1 Contratos | Parcial | TypeScript, JSON Schema e fixtures existem. Zod está instalado, mas não há schemas/parsing Zod em uso. Falta validação dos payloads eleitorais e do registry ao carregar, alinhamento de tipos e contrato completo de crosswalk. |
| F2 Scaffold/CI | Entregue no escopo atual | React/Vite, lockfiles, testes e Pages funcionam. Falta lint declarado e gates de ingestão oficial e governança previstos para produção. |
| F2.5 Slice | Parcial | Mapa e seleção funcionam. Seleção exploratória retorna valor nulo: ainda não há inspector de unidade auditada que recalcule KPI a partir de dados oficiais vinculados. |
| F3 Ingestão 2022 | Pendente para produção | O pipeline transforma baseline legado; não há ingestão do bruto TSE 2022 no fluxo atual. Falta conciliação independente por seção/local e município. |
| F4 Ingestão 2026 | Parcial | Existe snapshot bruto com metadados de integridade e artifact disponível. Dataset publicado continua derivado do legado; falta extração municipal e conciliação a partir do snapshot, encadeamento de revisões e retenção durável. |
| F5 Core | Parcial na aplicação | Pacotes genéricos compilam e têm teste sintético. `apps/web` não integra AtlasRuntime/DataLoader/MetricEngine/MapEngine/AtlasStore; implementa caminhos próprios e lógica eleitoral no App. |
| F6 Eleições | Parcial | Períodos configurados, KPIs municipais e comparador entregues. Faltam adaptador completo, candidatos 2022, brancos/nulos na UI, inspector, legendas, metadados métricos, revisões históricas e conciliação oficial. |
| F7 UX responsiva | Parcial | Sidebar, bottom sheet, teclado, seleção, desktop e mobile Chromium emulado testados. Faltam tema claro/escuro, inspector, filtros analíticos, persistência completa na URL e validação Safari/aparelhos. |
| F8 Cartografia avançada | Pendente | Camada exploratória vetorial existe. Faltam malha oficial/licenciada, locais de votação georreferenciados, seletor de camadas/basemap, atribuição e crosswalk auditado. |
| F9 Hardening/publicação | Parcial | Build, Pages, E2E e axe básico entregues. Faltam CSP, budget obrigatório, regressão visual, smoke automatizado do site publicado, rollback exercitado e cobertura WCAG/browser mais ampla. |

## F6: auditoria dos dez itens do backlog

| Item | Estado | O que falta para aceite |
|---|---|---|
| Registry eleitoral | Parcial | `apps/web/public/registry.json` gera períodos; os catálogos 2022 são nulos. Completar identidade/partido/cores por candidatura e hashes de configuração. O nome do arquivo não é o problema. |
| DatasetResolver | Parcial | Core resolve por id ou module/period/round; web usa id. Falta resolução integrada por territory/domain/revision e catálogo de revisões anteriores. |
| ElectionAdapter | Parcial | Pacote de domínio oferece ranking/margem; App ainda calcula votos/percentuais e ordenação. Integrar adaptador com totais/abstenção/brancos/nulos e comparação. |
| MetricDefinition | Parcial | AST genérico existe. Web usa campo único e KPIs próprios; faltam unidade, denominador e tratamento explícito de ausência. `?? 0` pode apresentar métrica ausente como zero. |
| Inspector | Pendente | Existe nome da área e proveniência geral. Falta painel por seção/local com unidade, fonte, confiança, método e KPI reconciliado. Não inventar contagem de bairro para preencher essa lacuna. |
| ElectionLegend | Pendente | Sem legenda eleitoral configurável. Manter a malha neutra até existir método espacial auditado; cores futuras devem vir do domínio/tema. |
| ComparisonPolicy | Parcial, funcional no município | Bloqueia município/cargo/turno/granularidade/qualidade incompatíveis. ADR-015 justifica dispensar vintage de bairro no agregado municipal. Falta validar identidade/versionamento do método e denominador no contrato, não só normalizar números. |
| Revisões | Parcial | `asOf` e pin por URL existem; revisão desconhecida gera aviso. Falta seletor, arquivo de revisões antigas e permalink que realmente carregue a revisão histórica, inclusive comparação pinada dos dois lados. |
| Fixture não eleitoral | Parcial | Teste headless cobre registry/métrica/URL. Não prova mapa, KPI e UI web para outro domínio sem editar App. |
| Reconciliação | Parcial | Checksum e somas internas dos três arquivos passam. Falta rastrear cada seção/local à extração-base oficial e relatar discrepâncias/não mapeados. |

## Definition of Done v0.3.0

| Critério do roadmap | Avaliação |
|---|---|
| Novo repo e SHA main confirmados | Atendido: árvore auditada acima. |
| App compila e CI executa no SHA da release | Atendido: release funcional 02986a5, com links abaixo. |
| Território como mapa vetorial único | Atendido para geometria exploratória; não atesta malha oficial. |
| Dataset 2022 turno 1 rastreável até origem e revisão | Parcial: revisão/checksum e origem legada, sem cadeia independente do bruto TSE. |
| Clique/tap abre inspector e recalcula KPI correto | Não atendido: nome da área apenas, contagem territorial suprimida corretamente. |
| Navegação registry/URL sem listas fixas | Parcial: períodos no registry; seleção/camada/métrica/tema não persistem na UI publicada, domínio ainda acoplado. |
| Dataset 2026 expõe estado/data | Atendido na interface, com datas herdadas do legado; falta demonstrar timestamps da transformação oficial. |
| Comparação incompatível bloqueada com motivo | Atendido no escopo municipal configurado; contrato de método ainda incompleto. |
| Fixture não eleitoral sem alteração do core | Atendido no teste headless; o backlog mais exigente de mapa/KPI/browser permanece parcial. |
| Sumários reconciliados e cobertura territorial visível | Parcial: somas internas e cobertura da extração; cobertura espacial oficial inexistente. |
| Testes/build/acessibilidade básica/deploy verificáveis | Atendido no escopo Chromium/axe atual. Não certifica WCAG completa nem Safari/iOS. |

## Riscos prioritários encontrados

### P0: regeneração pode desfazer a política de proveniência

`pipelines/elections/migrate_legacy_2022.py` continua gerando `status: official` e datas fixas. Os descritores atuais foram corrigidos para `totalized` e `sourceStatus: unverified-legacy`, mas o gerador não foi atualizado. O gerador 2026 também não preserva os novos campos sourceStatus/derivedStatus. Corrigir os geradores antes de reexecutá-los e testar que regeneração nunca promove dado legado a oficial.

Os scripts dependem de `data/raw/legacy-baseline/jaragua-atlas/...`; na árvore Git atual existem apenas manifest e README do baseline. Falta uma etapa documentada/testada de materialização dessa entrada ou, preferencialmente, substituição pelo fluxo oficial. Não reexecutados nesta auditoria para evitar sobrescrever descritores.

### P0: snapshot oficial ainda não alimenta o site

A captura TSE 2026 NÃO está ausente. A API confirmou artifact `11522563296`, nome `tse-source-snapshot-37714629693`, `expired: false`, expiração em `2027-01-06T01:47:00Z`. O snapshot registra SHA-256/SHA-512 e uma verificação anterior. Falta ligar o dataset exibido a esse bruto por transformação reproduzível e conciliação independente. Disponibilidade do artifact não autentica novamente seus bytes nesta auditoria.

### P1: revisão imutável e governança não estão fechadas

O Registry usa Map por dataset id e armazena um descriptor por id; não há coleção efetiva de revisões antigas. Migrações sobrescrevem caminhos fixos; todos os datasets atuais têm supersedes nulo. Falta catálogo de revisões, changelog por dataset, URI/hash imutáveis de configuração e retenção que não dependa só de Actions com 90 dias.

### P1: core está presente, mas frontend segue em caminho próprio

`apps/web/src/App.tsx` usa fetch genérico com cast TypeScript e cálculos eleitorais próprios. `AtlasMap` opera MapLibre diretamente. Não importa os pacotes core nem o adaptador eleitoral. Os tipos web duplicam os contratos e não incluem os campos novos sourceStatus/derivedStatus. Falta integração progressiva e um teste web não eleitoral para provar o desacoplamento.

### P1: contratos ainda não garantem a metodologia

Crosswalk tem confiança numérica e reviewed, mas falta evidência por associação (`evidenceRef`), regra de ambiguidade e política explícita de não mapeados. A confiança numérica não é defeito por si; falta documentar a equivalência com as categorias previstas e justificar limiares. Fail-closed de official precisa de regra condicional/teste vinculando fonte verificada e derivação; enum isolado não comprova oficialidade.

### P2: controles e experiência analítica

Faltam candidatos 2022 na UI, brancos/nulos, filtros por unidade/candidato/métrica, legendas, temas, reset explícito, seleção e estado completos em URL, locais de votação e inspector. Não considerar segundo turno 2026 como dado obrigatório agora: ele deve entrar apenas quando aplicável e sustentado por fonte.

### P2: hardening e documentação

`no_hardcode.py` usa regex e não AST/allowlist efetiva como previsto. Não há script lint. Falta budget que falhe CI e medição de campo de desempenho. Axe roda no estado inicial, não prova todos os estados/fluxos. Faltam Safari/WebKit, teste de tap/drag real do mapa com assertion semântica, regressão visual comparada, CSP e rollback exercitado.

`docs/build-status.md`, `docs/deployment.md` e partes do roadmap ainda dizem Pages não habilitado/build pendente, contrariando a release atual. `CHANGELOG.json`/versão ainda descrevem 0.2.1 e estados históricos. Consolidar status atual e separar histórico; os checkboxes antigos não são prova de ausência ou conclusão.

## Ordem recomendada e critérios de aceite

1. **Proveniência e pipelines:** corrigir geradores, garantir inputs reproduzíveis, derivar e reconciliar dados TSE 2022/2026, arquivar brutos e transformações duravelmente. Aceite: execução do zero, hashes iguais, totais por seção/local/município conferidos e nenhum official sem evidência.
2. **Revisões e contratos:** catálogo histórico, supersedes/changelog, hashes de config, parsing de payload/registry, status de fonte/derivação tipados. Aceite: link antigo carrega a revisão antiga; dado inválido é rejeitado sem zero fictício.
3. **Integração core/domínio:** ligar runtime, loader, métricas, estado, mapas e adaptador ao frontend. Aceite: fixture não eleitoral roda mapa/KPI/URL/E2E sem modificar o core nem inserir lógica eleitoral na UI genérica.
4. **F6 e cartografia segura:** completar catálogos, inspector, brancos/nulos, denominadores, locais de votação; verificar licença/malha/crosswalk antes de qualquer bairro eleitoral. Aceite: confiança, fontes e não mapeados visíveis, agregados reconciliados e sem inferência de residência.
5. **F7/F8/F9:** filtros/URL/temas/camadas, atribuição, mobile/Safari, estados axe, regressão visual, budget/CSP/rollback/smoke público. Aceite: gates automatizados e evidência dos fluxos completos.
6. **Release v0.3.0:** atualizar documentação/changelog e promover somente após os critérios efetivamente comprovados. Não alterar o nome da versão para esconder pendências.

PMTiles/GeoParquet, DuckDB-WASM, backend/banco e outros módulos NÃO são bloqueadores do v0.3.0: o roadmap os adia ou condiciona à necessidade. GeoPandas/DuckDB offline são ferramentas possíveis, não substitutos dos critérios de qualidade.

## Evidências

- [Auditoria funcional e release](audit-2026-10-08.md)
- [Release funcional 02986a5](https://github.com/alldevitone-maker/Atlas-Project/commit/02986a5b964479d80b750ac858e9cb3439810037)
- [Foundation CI](https://github.com/alldevitone-maker/Atlas-Project/actions/runs/37841542996)
- [Web build](https://github.com/alldevitone-maker/Atlas-Project/actions/runs/37841543138)
- [18 E2E Chromium](https://github.com/alldevitone-maker/Atlas-Project/actions/runs/37841543154)
- [Deploy Pages](https://github.com/alldevitone-maker/Atlas-Project/actions/runs/37841543155)
- [Snapshot TSE 2026](https://github.com/alldevitone-maker/Atlas-Project/actions/runs/37714629693)
- [Manifest de snapshot](../data/snapshots/tse/2026-sc-r1.json)
- [Contratos](../packages/contracts/src/index.ts)
- [Runtime](../packages/runtime/src/index.ts)
- [App](../apps/web/src/App.tsx)
- [Registro web](../apps/web/public/registry.json)
- [Pipeline legado 2022](../pipelines/elections/migrate_legacy_2022.py)
- [Pipeline legado 2026](../pipelines/elections/migrate_legacy_2026.mjs)

As classificações acima distinguem código existente, evidência testada e implementação ainda necessária. Não foi estimado percentual de conclusão porque os itens têm esforços e riscos diferentes.

