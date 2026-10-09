# Seleção no mapa: dados por rótulo de origem

O clique destacava o polígono e atualizava o nome selecionado, mas o painel mantinha somente os totais municipais. A seleção numérica nula era uma guarda metodológica; faltava uma consulta separada ao registro do legado, claramente identificada.

`SourceLabelResolver<Row>` define a consulta genérica por rótulo normalizado. `ElectionSourceLabelResolver<Row>` herda a consulta e fornece `sourceUnitId`. `ElectionPairPresentation` continua responsável somente pelas cores. `sourceUnitCandidates` calcula participações com os votos válidos do registro, enquanto `municipalCandidates` mantém o escopo municipal. Não há condicionais por ano, candidato ou número de urna.

Um registro único do legado abre o painel selecionado com contagens e candidatos do próprio rótulo. Os totais municipais ficam em seção distinta. Por exemplo, o legado 2026 de CZERNIEWICZ registra 2.655 válidos, incluindo 1.982 e 435 votos dos dois candidatos do par padrão; 108.628 continua sendo o total municipal. Esses valores não constituem verificação oficial de resultados por bairro.

Rótulos ausentes ou ambíguos não recebem contagens. Campos ausentes não são convertidos em zero. Fontes BU por seção não recebem associação nominal com bairros. A proveniência, revisão e rótulo de origem acompanham o painel; a seleção cartográfica continua com valor numérico nulo. Não foram modificados dados eleitorais ou catálogos.

A mesma implementação atende 2022 nos dois turnos, 2026 e suas revisões registradas. Novos períodos compatíveis usam o mesmo contrato; fontes incompatíveis exigem um adaptador e uma associação auditada, não uma condição hardcoded por ano.

Validação: teste de herança/normalização, ambiguidades e denominador do registro; E2E percorre todos os períodos e revisões legadas registrados, compara cada contagem ao payload carregado e confere reload e acessibilidade. Smoke público confere a seleção e a separação de escopos após o deploy. Resultado final e links serão registrados após os gates.
