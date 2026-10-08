# ADR-015 · Comparação de resultados no nível municipal

**Status:** aprovado para F6, com restrições metodológicas.
**Data:** 08/10/2026.
**Referência:** roadmap v3.2.

## Decisão

O Atlas pode calcular `delta` de votos válidos e de taxa de comparecimento entre revisões eleitorais de períodos distintos **somente no município como um todo**, condicionado a política de comparabilidade registrada no dataset/registry.

A política `municipality-aggregate-v1` exige:

- mesmo município, domínio/cargo e turno;
- granularidade de origem compatível;
- cobertura integral e reconciliação explicitamente registradas;
- estados `totalized` ou `official`;
- totais municipais finitos e consistentes: válidos ≤ comparecimento ≤ aptos;
- períodos diferentes; revisão imutável registrada.

Safras territoriais diferentes não impedem a comparação **municipal**, porque nenhuma operação de comparação por feição de bairro é efetuada. Nenhuma diferença de totais pode ser descrita como migração individual de votos.

## Não permitido

- Concluir resultados do bairro de residência usando endereço de local de votação.
- Calcular swing de candidatos equiparando pessoas apenas pelo número de urna.
- Apresentar a aproximação de rótulo `normalized-exact-label` como crosswalk oficial.
- Considerar a revisão derivada do legado TSE 2026 automaticamente oficial apenas por ter status `totalized`.
- Comparar turnos diferentes mesmo que o ano coincida.
- Alterar revision no permalink sem aviso de que a revisão solicitada está indisponível.

## Proveniência e limites

Datasets 2022 e 2026 do scaffold têm procedência de transformação do repositório acadêmico. Até o pipeline novo demonstrar reprodução independente a partir de brutos TSE arquivados, o selo deve explicitar essa origem.

## Aceite

Testes unitários bloqueiam comparações entre turnos/municípios/domínios distintos, validam totais municipais e verificam o delta das revisões do protótipo. CI e build web verdes não substituem QA de interface, acessibilidade ou auditoria final dos dados.
