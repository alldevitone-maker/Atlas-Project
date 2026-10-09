# ADR-016 — Apresentação herdada de pares

Status: aceito para o protótipo exploratório; coloração territorial oficial continua bloqueada.

## Decisão

`PairPresentation<Row>` define o método de comparação de duas medidas e recebe a paleta. `ElectionPairPresentation` herda essa implementação e fornece rótulos e contagens válidas. O renderer MapLibre recebe estilos calculados, sem identificar candidatos por tags, nomes ou números de urna. A configuração declara paleta, par inicial, datasets elegíveis, mensagens e referência histórica; o catálogo do dataset fornece os nomes.

O usuário solicitou restaurar duas cores do mapa antigo. O modo explícito `mapMode=legacy-pair` compara somente os dois candidatos escolhidos nos rótulos do legado. Azul e vermelho são posições configuráveis do par, não identidade partidária nem vencedor global. Empates, zero, ausência, valores inválidos e rótulos ambíguos ficam neutros. O modo padrão continua neutro.

## Limites e proveniência

A associação nominal não auditada NÃO demonstra residência de eleitores nem resultados oficiais por bairro. O aviso e a legenda acompanham a visualização. A seleção territorial continua com valor numérico nulo; nenhum KPI de bairro foi criado. Os BU por seção não recebem cores de bairro. Dados, hashes e catálogos eleitorais não são alterados por essa apresentação.

Paleta recuperada do [mapa histórico](https://github.com/alldevitone-maker/api-lab-faculdade/blob/da595c03d2ecb28645c23b5948d8a1c362810e94/public/jaragua-atlas/app.js): azul `#2f6fff`, vermelho `#ef445d`, neutro `#192631`. Sem intensidade inferida. Um mapa integralmente azul é válido se o primeiro candidato superar o segundo em todos os rótulos; não fabricamos áreas vermelhas.

## Validação

Testes de herança com domínio não eleitoral e chaves arbitrárias; guardas de contagens e ambiguidades; contrato de cores distintas; snapshots das duas posições em desktop/mobile; URL e seleção após reload; axe; bloqueio para BU; smoke pós-deploy. A promoção para produção exige geometria licenciada e auditada, fonte georreferenciada, crosswalk revisado e metodologia publicada conforme roadmap v3.2.
