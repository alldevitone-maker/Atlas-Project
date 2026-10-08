# Publicação do Atlas — estado atual

GitHub Pages está habilitado com origem GitHub Actions. URL: https://alldevitone-maker.github.io/Atlas-Project/.

O workflow [pages-deploy.yml](../.github/workflows/pages-deploy.yml) executa, em ordem:

1. Fundação: TypeScript, contratos, lint AST, checksums dos datasets e testes core.
2. Build React/Vite, budget dos assets e Vitest.
3. E2E Chromium e WebKit, desktop/mobile, com axe e baselines visuais.
4. Upload do artefato e deploy Pages.
5. Smoke da URL retornada pelo deploy, em desktop/mobile, com screenshots e traces preservados por 30 dias.

Falha antes do upload impede publicar. Falha no smoke após publicação torna o workflow vermelho; não aciona rollback automático. O gate exige a URL real e não substitui o teste público por preview local.

## Revisões e recuperação

Payloads têm revisão imutável, checksum e cópias em `apps/web/public/data/revisions/`. URL fixa `revision` e `compareRevision`; revisões desconhecidas são sinalizadas e a comparação não troca silenciosamente a referência. Fontes BU e votos legados com semântica distinta têm ids próprios; uma captura não promove votos legados a oficiais.

Para recuperar a aplicação, use um commit conhecido e reexecute o workflow sobre o código desse commit, verificando todos os gates e o smoke. Retenha os artefatos e fontes antes de sua expiração. **Não foi exercitado rollback real no site nesta entrega.**

[Resultado e evidências atuais](build-status.md) · [Limites metodológicos e roadmap](implementation-roadmap-2026-10-08.md) · [Histórico anterior](history/pre-implementation-deployment.md).
