# Boletins de urna: extração vinculada à fonte

Em 2026-10-08 o artefato Actions 11522563296 foi baixado novamente. O ZIP bruto de 153.178.332 bytes correspondeu ao SHA-256 `af9e03f17cefe6f4a0be48093a920974d61feb9b07d3ea69b1b84fb7c9a7599f` e ao SHA-512 publicado no snapshot `data/snapshots/tse/2026-sc-r1.json`.

O pipeline `pipelines/elections/ingest_verified_bu.py` lê CSV Latin-1 por streaming, filtra município TSE 81752, eleição 2026, turno 1 e cargo 1. Ele rejeita linhas duplicadas, totais conflitantes por seção e categorias desconhecidas. Aptos, comparecimento e abstenções são contados uma única vez por zona/seção. Votos nominais, brancos e nulos devem reconciliar por seção. Nenhum endereço ou bairro é inferido.

| Medida | Legado | BU capturado |
|---|---:|---:|
| Seções | 384 | 384 |
| Aptos | 131.454 | 131.454 |
| Comparecimento | 111.510 | 111.510 |
| Abstenções | 19.944 | 19.944 |
| Votos válidos legados / nominais BU | 108.628 | 108.638 |
| Brancos | 1.262 | 1.262 |
| Nulos | 1.620 | 1.610 |

A diferença de dez votos corresponde exatamente à ausência do número de urna 28 no legado: todos os demais totais por candidato coincidem com o BU. A causa dessa classificação e o eventual estado jurídico da candidatura não foram confirmados; não se inferem decisões de homologação. Não se presume erro do legado nem homologação final do BU. A extração tem status derivado `provisional`, preserva `validVotesMeaning: nominal-bu` e bloqueia comparação com métricas legadas sem a mesma semântica. O rótulo na interface é **Votos nominais nos boletins**. O catálogo vem dos próprios campos NR_VOTAVEL/NM_VOTAVEL/SG_PARTIDO da fonte.

A revisão imutável é `bu-7b347d87beb7`; payload SHA-256 `7b347d87beb7` como prefixo, digest completo no descritor. Há 384 seções reconciliadas internamente. Isso não certifica completude contra universo externo, geolocalização de locais ou resultado final homologado.

O recorte CSV de presidência municipal e seu manifesto são preservados em `data/raw/tse/`, com normalização documentada e checksum próprio. O arquivo estadual completo continua no artefato Actions, que expira em 2027-01-06; sua preservação permanente fora dos artefatos continua pendente. A URL de origem e os dois hashes permanecem no snapshot.

Reprodução a partir do ZIP integral:

```sh
python pipelines/elections/ingest_verified_bu.py --archive /caminho/bweb_1t_SC_051020261403.zip --snapshot data/snapshots/tse/2026-sc-r1.json --output /tmp/atlas-derived --capture /tmp/atlas-source.csv
```

O pipeline confere os dois hashes antes de derivar, e rejeita alteração de conteúdo em um caminho de revisão já existente. O mapa exploratório permanece neutro: não existe crosswalk espacial aprovado.
