# Implementação das pendências do roadmap v3.2 — 2026-10-08

Esta entrega implementa as pendências técnicas reproduzíveis da auditoria. Não declara a versão v0.3.0 concluída nem autoriza resultados por bairro.

| Área | Alteração e evidência |
|---|---|
| Proveniência | Migrações legadas geram `sourceStatus: unverified-legacy`, nunca `official`; input ausente não cria saída. |
| Fontes 2022/2026 | Três ZIPs estaduais capturados; hashes revalidados antes da extração; recortes municipais comprimidos e manifestos persistidos no Git. Em 2022 os hashes são da captura, sem digest oficial independente confirmado. Testes reproduzem payloads e catálogos dos três recortes. |
| Divergência | BU nominal 108.638 versus legado 108.628. Número 28 tem dez votos no BU e está ausente do legado. Demais candidatos coincidem. Estado jurídico/final não inferido; métricas distintas não se comparam. |
| Revisões | Registro mantém id/revisão e rejeita reutilização com checksum diferente. Links fixos e cópias de revisões são preservados; geradores arquivam saídas. |
| Integridade | DataLoader valida os bytes antes do JSON, incluindo catálogos; Zod valida registry, AST de métricas, descritores, estrutura, unicidade e reconciliação. Dataset ou catálogo adulterado falha sem exibir totais. |
| Contratos | Fonte/derivação tipadas; `official` exige evidência e reconciliação; associação revisada exige evidenceRef e não pode ser ambígua. |
| Core/web | Runtime, Registry, DataLoader, MetricEngine, MapEngine, LayerManager, InteractionManager, Router e i18n integrados. Agregação/ranking de candidatos movidos para domain-elections. Fixture não eleitoral validada no frontend, mapa/KPI/URL e E2E. |
| Análise | Métrica municipal, filtro de candidato, reset, brancos/nulos/aptos/comparecimento e denominador explícito. Catálogos 2022 capturados e vinculados separadamente dos votos legados. BU tem inspector de seção e identificador de local. Catálogo parcial não oculta votos sem nome. Comparador distingue estágio e votos nominais. |
| Estado | AtlasStore integra o estado. Dataset, revisão, comparação, métrica, candidato, seleção territorial, tema, painel, fundo neutro e camada preservados em URL. Teste verifica mudança da revisão antiga para a atual do mesmo dataset. |
| Mapa | Fundo neutro claro/escuro, visibilidade da malha, reset da vista, zoom, seleção com mouse/toque/teclado e baselines visuais desktop/mobile. Controles alterados durante o carregamento são aplicados ao mapa. |
| Acessibilidade | Temas claro/escuro; contraste do tema claro corrigido com axe; seleção por teclado, menu inert e ausência de WebGL mantidos. |
| Publicação | CSP compatível com workers, lint AST com allowlist documentada e budgets automatizados; Pages passa a depender da fundação, contratos, payloads, Vitest e E2E. WebKit desktop/iPhone adicionado ao gate. |

Validação local: build de produção; fundação, contratos com 10 válidos e 4 inválidos; 21 testes core, 20 testes Vitest e 40 E2E Chromium desktop/mobile. Contagens e links finais dos Actions constarão da evidência de publicação abaixo. WebKit não executa neste ambiente por bibliotecas de sistema ausentes; é obrigatório no Actions antes de publicar e passou no primeiro deploy desta implementação.

Budgets: JS inicial gzip <=110.000 bytes; chunk de mapa gzip <=300.000 bytes; worker <=520.000 bytes. São limites de artefatos medidos, não alegação de desempenho em campo.

## Pendências que permanecem explícitas

- A licença e a precisão da geometria legada, coordenadas de locais de votação e crosswalk espacial não foram comprovados. Malha permanece exploratória e sem votos.
- Explicação oficial para classificação dos dez votos do número 28 e resultado final homologado ainda depende de fonte adequada. BU não ganha selo de resultado oficial final.
- Preservação permanente do ZIP estadual integral fora de artefatos temporários; o recorte municipal e manifesto estão no Git.
- Desempenho de campo e exercício real de rollback não foram concluídos. As camadas/fundos disponíveis e a regressão visual são testados; novas fontes de cartografia dependem de licença e validação geoespacial.
- Não há dados inventados para segundo turno 2026, bairros ou partidos ausentes do catálogo.

A auditoria anterior é histórica. Este documento e os links de execução posteriores representam o estado desta entrega. [Reconciliação da fonte](bu-source-reconciliation.md).
