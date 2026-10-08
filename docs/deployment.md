> Estado atual (2026-10-08): GitHub Pages está habilitado e publicado. Consulte [a implementação validada](implementation-roadmap-2026-10-08.md). O conteúdo anterior abaixo permanece como histórico e não descreve os gates atuais.

# Publicação do Atlas

O build do frontend é gerado a partir de `apps/web` com Vite, e a página é enviada ao GitHub Pages pelo workflow [pages-deploy.yml](../.github/workflows/pages-deploy.yml).

## Ativação administrativa necessária

**Settings → Pages → Build and deployment → Source: GitHub Actions**

https://github.com/alldevitone-maker/Atlas-Project/settings/pages

O conector GitHub desta sessão pode escrever no repositório, mas não dispõe de permissões para alterar as configurações administrativas do GitHub Pages. O workflow de deploy poderá falhar no passo `configure-pages` enquanto a origem não for habilitada pela conta proprietária. Não usar token pessoal em arquivos públicos.

## URL planejada (não é atestação de deploy)

https://alldevitone-maker.github.io/Atlas-Project/

Esta URL só deve ser divulgada como funcional após `deploy` = SUCCESS e inspeção HTTP/navegador.

## Garantias desta fase

- Município, período e turno decorrem de registry versionado.
- Comparação entre 2022 e 2026 autorizada somente no agregado municipal pelo contrato `municipality-aggregate-v1` e para o mesmo turno.
- Não há comparações cruzadas por bairro sem crosswalk auditado.
- Fontes derivadas do legado mantêm seus rótulos de revisão, estágio e proveniência.
- A versão pinada por URL não deve ser silenciosamente trocada.
- O frontend passa por build TypeScript, testes Vitest, envio de artefato e deploy Pages.

## Operações após habilitar Pages

1. Reexecutar o workflow `Publish Atlas to GitHub Pages` via Actions → Run workflow (ou enviar novo commit em `apps/web`).
2. Conferir `build` e `deploy` em estado `success`.
3. Abrir o endereço publicado e testar Android/desktop, seleção de período, comparação e URL com revisão fixa.
