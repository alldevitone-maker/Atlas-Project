# @atlas/web

Aplicação web do Projeto Atlas com React, Vite e MapLibre, incluindo comparação municipal de pleitos presidenciais.

## Build validado

- TypeScript e Vite: build aprovado no GitHub Actions.
- Vitest: 7 testes F6 aprovados.
- Playwright Chromium: 8 testes para desktop e mobile aprovados.
- Os dados por bairro exibem uma associação nominal experimental de locais de votação. Não são dados oficiais do bairro de residência do eleitor.
- Compare apenas totais municipais quando as políticas de comparabilidade permitirem.

## Instalação e validação

```bash
npm install
npm run build
npm test
npm run test:e2e
```

Para rodar testes E2E localmente, instale primeiro os navegadores via `npx playwright install chromium`.

## Implantação

O workflow de publicação é `.github/workflows/pages-deploy.yml`, que executa build, testes F6, empacota `apps/web/dist` e publica no GitHub Pages.

O repositório precisa ter **Settings → Pages → Source → GitHub Actions** habilitado. A URL-alvo é:

https://alldevitone-maker.github.io/Atlas-Project/

**Importante:** o endereço só deve ser considerado ativo depois de um deploy `success` e validação HTTP. Não use templates Jekyll para este frontend Vite.

[Histórico de implantações](https://github.com/alldevitone-maker/Atlas-Project/actions/workflows/pages-deploy.yml)
