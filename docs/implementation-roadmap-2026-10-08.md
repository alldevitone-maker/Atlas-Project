# Implementação das pendências do roadmap v3.2 — 2026-10-08

Esta entrega implementa as pendências técnicas reproduzíveis da auditoria. Não declara a versão v0.3.0 concluída nem autoriza resultados por bairro.

| Área | Alteração e evidência |
|---|---|
| Proveniência | Migrações legadas geram `sourceStatus: unverified-legacy`, nunca `official`; input ausente não cria saída. |
| Fonte 2026 | ZIP estadual revalidado com SHA-256 e SHA-512; pipeline por seção; recorte municipal comprimido persistido no Git com manifesto; teste reproduz o payload e catálogo. |
| Divergência | BU nominal 108.638 versus legado 108.628. Número 28 tem dez votos no BU e está ausente do legado. Demais candidatos coincidem. Estado jurídico/final não inferido; métricas distintas não se comparam. |
| Revisões | Registro mantém id/revisão e rejeita reutilização com checksum diferente. Links fixos e cópias de revisões são preservados; geradores arquivam saídas. |
| Integridade | DataLoader valida os bytes antes do JSON; Zod valida descritores, estrutura, unicidade e reconciliação. Dataset adulterado falha sem exibir totais. |
| Contratos | Fonte/derivação tipadas; `official` exige evidência e reconciliação; associação revisada exige evidenceRef e não pode ser ambígua. |
| Core/web | Runtime, Registry, DataLoader, MetricEngine, MapEngine, LayerManager, InteractionManager, Router e i18n integrados. Agregação/ranking de candidatos movidos para domain-elections. Fixture não eleitoral validada no frontend, mapa/KPI/URL e E2E. |
| Análise | Métrica municipal, filtro de candidato, reset, brancos/nulos/aptos/comparecimento e denominador explícito. 2022 mostra números de urna quando falta catálogo nominal. BU tem inspector de seção e identificador de local. |
| Estado | Dataset, revisão, comparação, métrica, candidato, seleção territorial, tema e painel preservados em URL. |
| Acessibilidade | Temas claro/escuro; contraste do tema claro corrigido com axe; seleção por teclado, menu inert e ausência de WebGL mantidos. |
| Publicação | CSP compatível com workers, lint AST com allowlist documentada e budgets automatizados; Pages passa a depender da fundação, contratos, payloads, Vitest e E2E. WebKit desktop/iPhone adicionado ao gate. |

Validação local concluída até o envio: build de produção; fundação e 16 testes core; 15 testes Vitest; contratos com 10 válidos e 4 inválidos. E2E Chromium em desktop/mobile: 28 testes. WebKit não executa neste ambiente por bibliotecas de sistema ausentes; execução obrigatória no Actions antes de publicar. Links e conclusões dos Actions serão registrados após execução.

Budgets: JS inicial gzip <=110.000 bytes; chunk de mapa gzip <=300.000 bytes; worker <=520.000 bytes. São limites de artefatos medidos, não alegação de desempenho em campo.

## Pendências que permanecem explícitas

- Fontes brutas de 2022 e catálogo nominal não foram capturados independentemente nesta entrega. Números do legado continuam identificados como não verificados.
- A licença e a precisão da geometria legada, coordenadas de locais de votação e crosswalk espacial não foram comprovados. Malha permanece exploratória e sem votos.
- Explicação oficial para classificação dos dez votos do número 28 e resultado final homologado ainda depende de fonte adequada. BU não ganha selo de resultado oficial final.
- Preservação permanente do ZIP estadual integral fora de artefatos temporários; o recorte municipal e manifesto estão no Git.
- Controle completo de camadas/basemaps, regressão visual comparada, desempenho de campo e exercício real de rollback ainda não foram concluídos. Os testes de core existentes não substituem evidência desses itens.
- Não há dados inventados para segundo turno 2026, bairros ou partidos ausentes do catálogo.

A auditoria anterior é histórica. Este documento e os links de execução posteriores representam o estado desta entrega. [Reconciliação da fonte](bu-source-reconciliation.md).
