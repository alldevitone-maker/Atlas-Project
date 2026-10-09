# Roadmap — cores de candidatos por apresentação herdada

Referência: roadmap v3.2 e [ADR-016](adr/ADR-016-candidate-presentation.md). Esta entrega habilita um protótipo exploratório explícito; não encerra as pendências de cartografia e proveniência espacial.

| Etapa | Entrega e aceite | Situação |
|---|---|---|
| 1 | Classe base genérica, adaptador eleitoral por herança, paleta/rótulos/par inicial configuráveis; renderer sem tags de candidatos | Implementado |
| 2 | Duas cores históricas, seletores do par, legenda textual e URL compartilhável; empate/ausência/ambiguidade neutros | Implementado |
| 3 | Aviso permanente de legado exploratório, nenhum total oficial de bairro, BU por seção sem associação territorial | Implementado |
| 4 | Testes de domínio, contratos, desktop/mobile, regressão visual, acessibilidade, build e budgets; deploy e smoke público | Validação registrada após execução |
| 5 | Auditar licença, geometria, vintage e correspondência territorial; publicar fonte georreferenciada e crosswalk com cobertura/erros | Pendente; requisito de promoção |
| 6 | Revisar metodologia espacial e aprovar comparação territorial com incerteza/supressão; atualizar gates e documentação antes de habilitar modo territorial oficial | Pendente; depende da etapa 5 |

## Uso e regra

Ative “Cores do legado (exploratório)” e escolha os candidatos azul/vermelho. A cor representa qual dos dois possui mais votos no rótulo legado. Não significa vitória sobre todos os candidatos nem residência dos eleitores. As identidades vêm do catálogo de cada eleição, sem continuidade presumida entre períodos. O mapa permanece neutro para fontes BU sem associação espacial auditada.

Link do protótipo: https://alldevitone-maker.github.io/Atlas-Project/?mapMode=legacy-pair

Os snapshots também invertem as posições do mesmo par para verificar ambas as cores sem alterar os dados. Seleção e reload devem preservar o modo e manter o valor territorial nulo. Não há nova ingestão ou modificação dos arquivos eleitorais nesta entrega.

## Evidências

Resultados locais, commit e execução do GitHub Actions serão registrados após concluir os gates. Acessibilidade automatizada não equivale a certificação WCAG completa.
