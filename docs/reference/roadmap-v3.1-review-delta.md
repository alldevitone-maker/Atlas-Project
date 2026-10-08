# Projeto Atlas · Jaraguá do Sul
## Roadmap v3.1 — Delta de revisão sobre o v3

**Data:** 07/10/2026
**Base:** `roadmap_projeto_atlas_v3_jaragua_do_sul.md`
**Natureza:** este documento NÃO substitui o v3. Ele lista apenas o que deve mudar, o que acrescentar e as respostas às 15 perguntas do §46. Itens marcados com 💡 são sugestões (decisão sua); os demais são correções.

---

## 1. Parecer

**Nota do v3: 9/10 como arquitetura** (v1: 7/10; v2 proposto: 7 → 8,8).

O v3 absorveu as correções anteriores: crosswalk versionado, estado do dataset, safra territorial, `Candidate` sem hardcode, permalink no core, gate de CI e matriz de evidência do GeoJaraguá (o melhor trecho do documento). O risco restante é de **execução**, não de desenho.

---

## 2. Mudanças propostas

### M1 · Corte vertical fino logo após a Fase 2 (corrige §36)
**Problema:** só a Fase 6 mostra algo na tela. Contratos escritos sem rodar costumam sair errados.
**Mudança:** inserir **Fase 2.5 · Slice vertical**: 2022 1º turno, um mapa, tap/clique, um KPI, tudo por config, usando dados do pipeline mínimo.
**Aceite:** o slice roda ponta a ponta e qualquer ajuste de contrato descoberto nele é aplicado antes da Fase 3.

### M2 · Módulo sintético NÃO eleitoral (corrige §13.2)
**Problema:** o Metric Engine do §11 usa `candidateVotes` e `rankedCandidateShare`, conceitos de eleição dentro de um motor "genérico". O teste do período sintético não detectaria isso.
**Mudança:** além do período sintético, criar um **módulo sintético não eleitoral** (um campo numérico por unidade territorial, sem candidatos, sem rounds).
**Aceite:** o módulo sintético aparece no menu, serializa na URL, resolve dataset, renderiza mapa/legenda/KPI e comparação, **sem alterar nenhum arquivo do core**. Conceitos de ranking/candidato ficam em um pacote de domínio (`@atlas/domain-elections`), nunca no `MetricEngine`.

### M3 · Revisão imutável de dataset (corrige §8, §9 e §14)
**Problema:** o 2026 muda até o 2º turno (25/10/2026). Um permalink salvo hoje exibiria números diferentes amanhã.
**Mudança:** acrescentar ao contrato de dataset:
```json
{
  "revision": "<id-imutável>",
  "supersedes": "<revision-anterior | null>"
}
```
- Cada ingestão gera uma revisão imutável (snapshot com checksum).
- A URL aceita `revision=<id>`; sem ele, resolve para a revisão mais recente e a UI mostra "esta é a versão de DD/MM; há versão mais nova".
- 💡 **Ação imediata:** arquivar agora os brutos do TSE de 2026 (e de 2022) com checksum e data de coleta, antes que a fonte seja atualizada ou reorganizada.

### M4 · Fonte oficial de bairros (corrige §26/§47)
**Problema:** "38 bairros / 15 localidades rurais" está registrado a partir de um diário da comunidade OSM, que não é fonte oficial.
**Mudança:** decidir e registrar em ADR a fonte da malha de bairros, em ordem de preferência: (1) legislação/cadastro municipal, (2) malha de bairros do IBGE, (3) OSM como apoio. Cada unidade guarda `source`, `license` e `vintage`. Divergências entre fontes entram no relatório de crosswalk.

### M5 · Gate no-hardcode com allowlist (corrige §13.1)
**Problema:** bloquear "anos eleitorais" gera falso positivo (ano de copyright, versões, datas de log).
**Mudança:** o lint AST usa regras por contexto (literais em chamadas de domínio, objetos de config embutidos, strings de UI) e um **allowlist versionado** com justificativa por exceção. Falso positivo vira entrada no allowlist via PR revisado, nunca `eslint-disable` solto.

### M6 · Estimativa e ordem de valor (corrige §36)
**Problema:** 10 fases sem esforço estimado nem prioridade.
**Mudança:** 💡 acrescentar a cada fase: esforço relativo (P/M/G), dependências e o "valor entregue" visível. Se o projeto for conduzido por uma pessoa, considerar fundir Fases 7 e 8 (UX desktop/mobile) em uma única entrega responsiva (mobile-first) e adiar visual regression para a Fase 9.

### M7 · Dividir o documento (corrige estrutura)
**Problema:** 2.177 linhas e 50 seções num só arquivo dificultam revisão e manutenção.
**Mudança:** 💡 quebrar em:
```text
docs/
├── roadmap.md              # 2–3 páginas: objetivo, fases, critérios, riscos
├── architecture.md         # §4, §5, §24, §33
├── data-contracts.md       # §6–§12, §14
├── methodology.md          # §6.3, §21, §22
├── ux.md                   # §15–§20, §23
├── stack.md                # §31–§32
├── evidence/geojaragua.md  # §26, §27, §47
└── adr/                    # §44, uma decisão por arquivo
```
O roadmap passa a só referenciar os demais.

---

## 3. Respostas às perguntas do §46

Todas são recomendações, não fatos verificados.

| # | Pergunta | Resposta |
|---|---|---|
| 1 | `sourceGrain` × `analysisUnit` resolve a tensão? | Sim. Mantém fidelidade ao TSE e legibilidade sem substituir silenciosamente a fonte. |
| 2 | Crosswalk precisa de N:N na v1? | Não. Use N:1 com `confidence`. Reserve um campo `weight` opcional para o caso futuro de interpolação por área. |
| 3 | Onde vive a regra de comparabilidade? | Em um `ComparisonPolicy` separado, referenciado por `Metric` e `Dataset`. Evita duplicar regra e permite testar isoladamente. |
| 4 | React + Vite ou Svelte? | React + Vite é adequado. Como o core fica em pacotes independentes de framework, a troca futura tem custo baixo. Escolha pela familiaridade da equipe e registre em ADR. |
| 5 | Zustand/nanostores ou store própria? | Zustand ou nanostores, com uma camada fina própria de sincronização com a URL e validação por schema. |
| 6 | GeoJSON + JSON na v1? | Sim. Escala municipal não justifica mais. |
| 7 | PMTiles já no contrato inicial? | Só como adapter futuro. O enum `format` do contrato já o prevê. |
| 8 | Adiar DuckDB-WASM? | Sim, totalmente, até haver necessidade medida. |
| 9 | Limiar de supressão defensável? | Não existe número único defensável. O TSE já publica o boletim de urna por seção, então o Atlas não revela dado novo. Trate o mínimo de votos como regra de **confiabilidade estatística** (exibir "dados insuficientes" abaixo de N votos válidos), configurável por `Metric`/território, e não como regra de privacidade. 💡 Documente a justificativa em ADR. |
| 10 | Crosswalk sem coordenada confiável? | Ordem: (1) campo oficial de bairro/endereço do cadastro do local de votação; (2) geocodificação com revisão manual (`reviewed-alias`); (3) spatial join. Verifique os termos do geocodificador: alguns proíbem armazenar ou redistribuir resultados. |
| 11 | `polling-place` como camada pública desde a v1? | Sim. É a camada mais fiel à fonte e barata de oferecer. |
| 12 | Formato de changelog de dataset? | Arquivo legível por máquina por dataset (`CHANGELOG.json`) com `revision`, `asOf`, `checksum`, cobertura e resumo da mudança, mais um `CHANGELOG.md` gerado a partir dele. |
| 13 | AST próprio ou DSL existente? | AST próprio e mínimo, como união discriminada em Zod, com poucas operações (`ratio`, `difference`, `sum`, `rank`, `coalesce`). Não adote DSL externa sem necessidade. |
| 14 | Versionar config e dataset juntos? | Separados, ligados por um `manifest.json` que fixa os checksums dos datasets usados por cada versão de config. |
| 15 | Até que tamanho manter GitHub Pages? | Confirme os limites atuais na página oficial de limites do GitHub Pages (o v3 já a cita). Para este porte, é improvável atingi-los; defina um orçamento de tamanho de artefato no CI e migre de hospedagem só se estourar. |

---

## 4. Ajustes de fases (resumo)

| Fase v3 | Ajuste v3.1 |
|---|---|
| 0 Evidência | + arquivar brutos TSE 2022/2026 com checksum (M3); + fonte oficial de bairros (M4) |
| 1 Contratos | + `revision`/`supersedes`; + `ComparisonPolicy`; + `weight` opcional no crosswalk |
| 2 Repo e CI | + allowlist do gate no-hardcode (M5); + módulo sintético não eleitoral (M2) |
| **2.5 Slice vertical (nova)** | 2022 1º turno ponta a ponta por config (M1) |
| 3–4 Pipelines | idempotência por revisão imutável (M3) |
| 5 Core | `MetricEngine` sem conceitos de eleição; ranking/candidato em pacote de domínio (M2) |
| 6 Eleições | pacote `@atlas/domain-elections` |
| 7–8 UX | 💡 considerar entrega única responsiva (M6) |
| 9 Hardening | orçamento de tamanho de artefato no CI |

---

## 5. Decisões pendentes (suas)

1. Fonte oficial da malha de bairros (M4): legislação municipal, IBGE ou outra?
2. Adotar o slice vertical (M1) e o módulo sintético não eleitoral (M2)?
3. Dividir o documento em `docs/` (M7)?
4. Limiar de confiabilidade estatística: qual N inicial (valor a definir após olhar a distribuição real de votos válidos por local de votação)?
5. Projeto conduzido por uma pessoa? Isso decide se vale fundir as Fases 7 e 8 (M6).
