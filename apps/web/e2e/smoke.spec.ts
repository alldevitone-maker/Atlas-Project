import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('selected source label displays its own counts for every registered legacy period and revision',async({page})=>{
 const registry=await (await page.request.get('/registry.json')).json();
 await page.goto('/?mapMode=legacy-pair');
 await expect(page.getByText('108.628',{exact:true})).toBeVisible();
 const canvas=page.locator('.atlas-map canvas');
 await expect(canvas).toBeVisible();
 await page.getByRole('button',{name:'Redefinir enquadramento do mapa'}).click();
 const mobile=test.info().project.name.startsWith('mobile');
 await expect.poll(async()=>{
  if(!await page.getByLabel('Selecionar território').inputValue()){
   if(mobile)await canvas.tap({position:{x:250,y:270}});else await canvas.click({position:{x:550,y:220}});
  }
  return page.getByLabel('Selecionar território').inputValue();
 }).not.toBe('');
 await expect(page.getByRole('region',{name:'Dados do rótulo selecionado'})).toBeVisible();
 await expect(page.getByRole('region',{name:'Dados do rótulo selecionado'}).locator('table')).toBeVisible();
 for(const ref of [...registry.datasets,...registry.revisions].filter((item:any)=>registry.candidateMapPresentation.eligibleDatasets.includes(item.id))){
  const data=await (await page.request.get('/'+ref.dataUri)).json();
  const row=data.rows.find((item:any)=>item.sourceUnitId==='CZERNIEWICZ');expect(row).toBeTruthy();
  await page.goto('/?dataset='+ref.id+(ref.revision ? '&revision='+ref.revision : ''));
  await expect(page.locator('.candidate-row')).not.toHaveCount(0);
  await page.getByLabel('Selecionar território').selectOption('Czerniewicz');
  const panel=page.getByRole('region',{name:'Dados do rótulo selecionado'});
  await expect(panel).toContainText(new Intl.NumberFormat('pt-BR').format(row.validVotes));
  await expect(panel).toContainText(/sem resultado oficial por bairro/);
  const shown=await panel.locator('tbody tr td:first-of-type').allTextContents();
  expect(shown.map(text=>Number(text.replaceAll('.',''))).sort((a,b)=>a-b)).toEqual(Object.values(row.candidateVotes).sort((a:any,b:any)=>a-b));
  await expect(page.getByText('Resumo municipal ·',{exact:false})).toBeVisible();
  await page.reload();await expect(panel).toContainText(new Intl.NumberFormat('pt-BR').format(row.validVotes));
 }
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(axe.violations).toEqual([]);
});

test('config-driven exploratory pair paints both candidate roles and preserves shared state',async({page},testInfo)=>{
 await page.goto('/?mapMode=legacy-pair');
 await expect(page.getByText('108.628')).toBeVisible();
 await expect(page.getByLabel('Legenda exploratória do par')).toContainText('Flávio Bolsonaro');
 await expect(page.getByText(/Cores de rótulos do legado: não são resultados oficiais/)).toBeVisible();
 await page.getByRole('button',{name:'Redefinir enquadramento do mapa'}).click();
 await expect(page.locator('.atlas-map canvas')).toHaveScreenshot('pair-primary.png',{animations:'disabled',maxDiffPixelRatio:.015,threshold:.2});
 await testInfo.attach('colored-map',{body:await page.screenshot(),contentType:'image/png'});
 await page.getByLabel('Selecionar território').selectOption('Centro');
 await expect(page.locator('.summary-grid article').last().locator('small')).toBeEmpty();
 await page.reload();await expect(page).toHaveURL(/mapMode=legacy-pair/);
 await expect(page.getByLabel('Selecionar território')).toHaveValue('Centro');
 if(test.info().project.name.startsWith('mobile'))await page.getByRole('button',{name:'Abrir ou fechar navegação'}).click();
 await page.getByRole('button',{name:'Trocar cores do par'}).click();
 await expect(page).toHaveURL(/mapA=ballot-13/);
 await expect(page.getByLabel('Candidato azul',{exact:true})).toHaveValue('ballot-13');
 await expect(page.getByLabel('Candidato vermelho',{exact:true})).toHaveValue('ballot-22');
 await page.getByRole('checkbox',{name:'Cores do legado (exploratório)'}).uncheck();
 await expect(page.getByLabel('Legenda exploratória do par')).toHaveCount(0);
 await page.getByRole('checkbox',{name:'Cores do legado (exploratório)'}).check();
 if(test.info().project.name.startsWith('mobile'))await page.getByRole('button',{name:'Abrir ou fechar navegação'}).click();
 if(await page.locator('.sheet-handle').getAttribute('aria-expanded')==='true')await page.locator('.sheet-handle').click();
 await page.getByLabel('Selecionar território').selectOption('');
 if(await page.locator('.sheet-handle').getAttribute('aria-expanded')==='true')await page.locator('.sheet-handle').click();
 await expect(page.getByLabel('Legenda exploratória do par')).toContainText('Lula');
 await page.getByRole('button',{name:'Redefinir enquadramento do mapa'}).click();
 await expect(page.locator('.atlas-map canvas')).toHaveScreenshot('pair-secondary.png',{animations:'disabled',maxDiffPixelRatio:.015,threshold:.2});
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(axe.violations).toEqual([]);
});

test('source sections never inherit the exploratory neighborhood color association',async({page})=>{
 await page.goto('/?dataset=elections-presidential-2026-r1-bu&mapMode=legacy-pair');
 await expect(page.getByText('108.638')).toBeVisible();
 if(test.info().project.name.startsWith('mobile'))await page.getByRole('button',{name:'Abrir ou fechar navegação'}).click();
 await expect(page.getByRole('checkbox',{name:'Cores do legado (exploratório)'})).toBeDisabled();
 await expect(page.getByLabel('Legenda exploratória do par')).toHaveCount(0);
 await expect(page.getByText(/Cores indisponíveis: sem associação territorial/)).toBeVisible();
});

test('registry, map and electoral data render without a fake landing page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Projeto Atlas · Jaraguá do Sul')).toBeVisible();
  await expect(page.locator('.atlas-map')).toBeVisible();
  await expect(page.getByText('108.628')).toBeVisible();
  await expect(page.getByText(/Crosswalk nominal provisório/i)).toBeVisible();
  await expect(page.locator('.data-status')).toContainText(/totalizado/i);
});

test('municipal comparison is available without representing neighborhood votes as residence', async ({ page }) => {
  await page.goto('/');
  if (test.info().project.name.startsWith('mobile')) {
    await page.getByRole('button', { name: 'Abrir ou fechar navegação' }).click();
  }
  await page.getByRole('checkbox', { name: 'Comparar municípios' }).check();
  await expect(page.locator('.comparison-panel')).toContainText('Comparável');
  await expect(page.locator('.comparison-panel')).toContainText('6.065');
  await expect(page.locator('.comparison-panel')).toContainText(/não representa residência dos eleitores/i);
  await expect(page).toHaveURL(/compare=/);
  expect(await page.locator('#atlas-sidebar').evaluate(node=>node.scrollWidth)).toBe(await page.locator('#atlas-sidebar').evaluate(node=>node.clientWidth));
});

test('changing period does not falsely flag an old immutable revision', async ({ page }) => {
  await page.goto('/');
  if (test.info().project.name.startsWith('mobile')) {
    await page.getByRole('button', { name: 'Abrir ou fechar navegação' }).click();
  }
  await page.locator('.period-list button').first().click();
  await expect(page).toHaveURL(/dataset=elections-presidential-2022-r1/);
  await expect(page.getByText('102.563')).toBeVisible();
  await expect(page.getByText('A revisão fixa solicitada não está disponível')).toHaveCount(0);
});

test('unknown pinned revision is not silently replaced', async ({ page }) => {
  await page.goto('/?dataset=elections-presidential-2022-r1&revision=unknown-immutable-revision');
  await expect(page.getByText(/A revisão fixa solicitada não está disponível/)).toBeVisible();
  await expect(page).toHaveURL(/revision=unknown-immutable-revision/);
  await page.getByRole('button', { name: 'Usar revisão disponível' }).click();
  await expect(page.getByText(/A revisão fixa solicitada não está disponível/)).toHaveCount(0);
  await expect(page).not.toHaveURL(/revision=unknown-immutable-revision/);
});

 test('territory selection is accessible and never fabricates neighborhood counts', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const select = page.getByLabel('Selecionar território');
  await expect(select).toBeVisible();
  await select.selectOption({ index: 1 });
  await expect(page.locator('.summary-grid article').last()).not.toContainText('NaN');
  await expect(page.locator('.summary-grid article').last().locator('small')).toBeEmpty();
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', await page.evaluate(() => document.documentElement.clientWidth));
  expect(errors).toEqual([]);
 });
 test('WebGL failure leaves municipal data usable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type: any, ...args: any[]) {
      if (String(type).includes('webgl')) return null;
      return (original as any).call(this, type, ...args);
    } as any;
  });
  await page.goto('/?mapMode=legacy-pair');
  await expect(page.getByText('O mapa não está disponível neste navegador.', { exact: false })).toBeVisible();
  await expect(page.getByText('108.628')).toBeVisible();
  await expect(page.getByLabel('Selecionar território')).toBeVisible();
  const legend=await page.locator('.method-badge').boundingBox();
  const fallback=await page.locator('.map-unavailable').boundingBox();
  const selector=await page.locator('.territory-selector').boundingBox();
  expect(legend).not.toBeNull();expect(fallback).not.toBeNull();expect(selector).not.toBeNull();
  expect(legend!.y+legend!.height).toBeLessThanOrEqual(fallback!.y);
  expect(fallback!.y+fallback!.height).toBeLessThanOrEqual(selector!.y);
 });

 test('navigation, zoom controls and keyboard selection remain usable', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.locator('.maplibregl-canvas')).toBeVisible();
  await page.locator('.maplibregl-ctrl-zoom-in').click();
  await page.locator('.maplibregl-ctrl-zoom-out').click();
  const select = page.getByLabel('Selecionar território');
  await select.selectOption({ index: 1 });
  await select.press('Tab');
  const toggle = page.getByRole('button', { name: 'Abrir ou fechar navegação' });
  if (await toggle.getAttribute('aria-expanded') === 'true') await toggle.click();
  await expect(page.locator('#atlas-sidebar')).toHaveAttribute('inert', '');
  await page.screenshot({ path: testInfo.outputPath('atlas-audit.png'), fullPage: true });
  await expect(page.locator('.map-unavailable')).toHaveCount(0);
  expect(errors).toEqual([]);
  const timing = await page.evaluate(() => performance.getEntriesByType('navigation').map(entry => entry.toJSON()));
  await testInfo.attach('navigation-timing', { body: JSON.stringify(timing), contentType: 'application/json' });
 });

 test('WCAG automated scan of loaded interface', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('Selecionar território')).toBeVisible();
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  console.log(JSON.stringify(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target:n.target, summary:n.failureSummary })) })), null, 2));
  expect(result.violations).toEqual([]);
 });

 test('changing round with comparison open fails closed without crashing', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByLabel('Selecionar território').selectOption('Centro');
  if (test.info().project.name.startsWith('mobile')) await page.getByRole('button', { name: 'Abrir ou fechar navegação' }).click();
  await page.getByRole('checkbox', { name: 'Comparar municípios' }).check();
  await expect(page.locator('.comparison-panel')).toBeVisible();
  await page.getByRole('button', { name: '2022 2º turno', exact: true }).click();
  await expect(page.getByText('Não há outro período do mesmo turno disponível para a comparação.')).toBeVisible();
  await expect(page.getByText('104.007')).toBeVisible();
  await expect(page.getByLabel('Selecionar território')).toHaveValue('');
  await expect(page.locator('.comparison-panel')).toHaveCount(0);
  expect(errors).toEqual([]);
 });

test('theme and territorial selection survive a shared link',async({page})=>{
 await page.goto('/');
 await page.getByLabel('Selecionar território').selectOption({index:1});
 const label=await page.getByLabel('Selecionar território').inputValue();
 await page.getByRole('button',{name:'Alternar tema claro e escuro'}).click();
 await expect(page).toHaveURL(/theme=light/);
 await expect(page).toHaveURL(/feature=/);
 await page.reload();
 await expect(page.getByLabel('Selecionar território')).toHaveValue(label);
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
 expect(axe.violations).toEqual([]);
});

test('verified BU retains source semantics and blocks incomparable legacy metric',async({page})=>{
 await page.goto('/?dataset=elections-presidential-2026-r1-bu');
 await expect(page.getByText('108.638')).toBeVisible();
 await expect(page.locator('.summary-grid article').first()).toContainText('Votos nominais nos boletins');
 await page.getByText('Inspecionar seções da fonte').click();
 await page.getByLabel('Seção eleitoral').selectOption({index:1});
 await expect(page.getByText(/Local de votação:/)).toBeVisible();
 if(test.info().project.name.startsWith('mobile')) await page.getByRole('button',{name:'Abrir ou fechar navegação'}).click();
 await page.getByRole('checkbox',{name:'Comparar municípios'}).check();
 await page.getByLabel('Comparar com').selectOption('elections-presidential-2022-r1');
 await expect(page.locator('.comparison-panel')).toContainText('Métricas de origem distintas');
});

test('altered dataset bytes fail closed before rendering totals',async({page})=>{
 await page.route('**/data/presidential-2026-r1.json',async route=>route.fulfill({contentType:'application/json',body:'{"rows":[],"summary":{"validVotes":999999}}'}));
 await page.goto('/');
 await expect(page.getByText(/dataset-checksum-mismatch/)).toBeVisible();
 await expect(page.getByText('999.999')).toHaveCount(0);
});

test('metric and candidate filters are explicit and reset preserves municipal scope',async({page})=>{
 await page.goto('/');
 if(test.info().project.name.startsWith('mobile'))await page.getByRole('button',{name:'Abrir ou fechar navegação'}).click();
 await page.getByLabel('Selecionar métrica municipal').selectOption('blank-votes');
 await expect(page.locator('.summary-grid article').first()).toContainText('1.262');
 await page.getByLabel('Filtrar candidato').selectOption({index:1});
 await expect(page.locator('.candidate-row')).toHaveCount(1);
 await expect(page).toHaveURL(/metric=blank-votes/);
 await expect(page).toHaveURL(/candidate=/);
 await page.getByRole('button',{name:'Limpar filtros e seleção'}).click();
 await expect(page.locator('.summary-grid article').first()).toContainText('108.628');
 await expect(page.locator('.candidate-row')).toHaveCount(12);
});

test('a non-electoral module renders map, metric and immutable permalink through the core',async({page})=>{
 await page.goto('/?module=module-synthetic');
 await expect(page.getByRole('heading',{name:'Módulo sintético'})).toBeVisible();
 await expect(page.getByText('Valores: 10, 20, 30 · Total: 60')).toBeVisible();
 await expect(page.locator('.atlas-map')).toBeVisible();
 await page.getByLabel('Selecionar território').selectOption('Unidade B');
 await expect(page.getByText('Selecionado: Unidade B · Valor: 20')).toBeVisible();
 const canvas=page.locator('.atlas-map canvas');const box=(await canvas.boundingBox())!;
 const mobile=test.info().project.name.startsWith('mobile');
 const position={x:box.width/2,y:box.height/2-(mobile?85:0)};
 await page.getByLabel('Selecionar território').selectOption('Unidade A');
 await expect.poll(async()=>{if(mobile)await canvas.tap({position});else await canvas.click({position});return page.locator('.bottom-sheet').innerText();}).toContain('Selecionado: Unidade B');
 await expect(page).toHaveURL(/revision=rev-001/);
 await page.reload();
 await expect(page.getByLabel('Selecionar território')).toHaveValue('Unidade B');
});

test('light-theme comparison preserves BU labels and passes accessibility scan',async({page})=>{
 await page.goto('/?dataset=elections-presidential-2026-r1-bu&compare=elections-presidential-2022-r1&theme=light&panel=expanded');
 await expect(page.locator('.comparison-panel')).toContainText('votos nominais nos boletins');
 await expect(page.locator('.comparison-panel')).toContainText('Extração provisória');
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
 expect(axe.violations).toEqual([]);
});

test('provisional BU comparison remains blocked even when both metrics are nominal',async({page})=>{
 await page.goto('/?dataset=elections-presidential-2026-r1-bu&compare=elections-presidential-2022-r1-bu&panel=expanded');
 await expect(page.locator('.comparison-panel')).toContainText('Consolidação insuficiente');
 await expect(page.locator('.comparison-panel')).toContainText('votos nominais nos boletins');
 await expect(page.locator('.comparison-panel')).not.toContainText('+6.075');
});

test('neutral basemap and territorial layer controls preserve shared state',async({page})=>{
 await page.goto('/');
 if(test.info().project.name.startsWith('mobile'))await page.getByRole('button',{name:'Abrir ou fechar navegação'}).click();
 await page.getByLabel('Fundo do mapa').selectOption('neutral-light');
 await page.getByLabel('Exibir malha exploratória').uncheck();
 await expect(page).toHaveURL(/basemap=neutral-light/);await expect(page).toHaveURL(/layers=none/);
 await page.reload();
 if(test.info().project.name.startsWith('mobile'))await page.getByRole('button',{name:'Abrir ou fechar navegação'}).click();
 await expect(page.getByLabel('Fundo do mapa')).toHaveValue('neutral-light');await expect(page.getByLabel('Exibir malha exploratória')).not.toBeChecked();
 await page.getByLabel('Exibir malha exploratória').check();
 if(test.info().project.name.startsWith('mobile'))await page.getByRole('button',{name:'Abrir ou fechar navegação'}).click();
 await page.getByRole('button',{name:'Redefinir enquadramento do mapa'}).click();
 await expect(page).toHaveURL(/layers=territory/);
});

test('selecting the current dataset exits an older pin for the same id',async({page})=>{
 await page.route('**/registry.json',async route=>{
  const response=await route.fetch();const registry=await response.json();
  const ref=registry.datasets.find((item:any)=>item.id==='elections-presidential-2026-r1');
  registry.revisions.push({...ref,revision:'historical-test',descriptorUri:'./data/historical-test.dataset.json'});
  await route.fulfill({json:registry});
 });
 await page.route('**/data/historical-test.dataset.json',async route=>{
  const response=await page.request.get('/data/presidential-2026-r1.dataset.json');const descriptor=await response.json();
  await route.fulfill({json:{...descriptor,revision:'historical-test',publishedAt:'2000-01-01T00:00:00Z'}});
 });
 await page.goto('/?dataset=elections-presidential-2026-r1&revision=historical-test');
 await expect(page.getByText('108.628')).toBeVisible();await expect(page).toHaveURL(/revision=historical-test/);
 if(test.info().project.name.startsWith('mobile'))await page.getByRole('button',{name:'Abrir ou fechar navegação'}).click();
 await page.locator('.period-list button.active').click();
 await expect(page).toHaveURL(/revision=legacy-6f965e3f3c00/);
 if(test.info().project.name.startsWith('mobile'))await page.getByRole('button',{name:'Abrir ou fechar navegação'}).click();
 await page.getByLabel('Revisão do dataset',{exact:true}).selectOption('historical-test');
 await expect(page).toHaveURL(/revision=historical-test/);
 await expect(page.getByText('108.628')).toBeVisible();
});

test('exploratory cartography retains its neutral visual baseline',async({page})=>{
 await page.goto('/');
 await page.getByLabel('Selecionar território').selectOption('Centro');
 await page.getByRole('button',{name:'Recolher dados selecionados'}).click();
 await page.getByRole('button',{name:'Redefinir enquadramento do mapa'}).click();
 await expect(page.locator('.atlas-map canvas')).toHaveScreenshot('neutral-map.png',{animations:'disabled',maxDiffPixelRatio:.015,threshold:.2});
});

test('altered candidate catalog cannot replace source-backed candidate names',async({page})=>{
 await page.route('**/data/presidential-2026-candidates.json',route=>route.fulfill({contentType:'application/json',body:'[{"id":"tampered","officialName":"Adulterated catalog","ballotNumber":"x"}]'}));
 await page.goto('/');
 await expect(page.getByText(/dataset-checksum-mismatch/)).toBeVisible();
 await expect(page.getByText('Adulterated catalog')).toHaveCount(0);
});

test('comparison independently loads a historical pin and rejects an unavailable revision',async({page})=>{
 await page.route('**/registry.json',async route=>{
  const response=await route.fetch();const registry=await response.json();
  const ref=registry.datasets.find((item:any)=>item.id==='elections-presidential-2022-r1');
  registry.revisions.push({...ref,revision:'comparison-history-test',descriptorUri:'./data/comparison-history-test.dataset.json'});
  await route.fulfill({json:registry});
 });
 await page.route('**/data/comparison-history-test.dataset.json',async route=>{
  const response=await page.request.get('/data/presidential-2022-r1.dataset.json');const descriptor=await response.json();
  await route.fulfill({json:{...descriptor,revision:'comparison-history-test',publishedAt:'2000-01-01T00:00:00Z'}});
 });
 await page.goto('/?dataset=elections-presidential-2026-r1&compare=elections-presidential-2022-r1&compareRevision=comparison-history-test&panel=expanded');
 await expect(page.locator('.comparison-panel')).toContainText('comparison-history-test');
 await page.reload();await expect(page.locator('.comparison-panel')).toContainText('comparison-history-test');
 if(test.info().project.name.startsWith('mobile'))await page.getByRole('button',{name:'Abrir ou fechar navegação'}).click();
 await page.getByLabel('Revisão da comparação').selectOption('legacy-1b7f4f116ed7');
 await expect(page).toHaveURL(/compareRevision=legacy-1b7f4f116ed7/);
 await expect(page.locator('.comparison-panel')).not.toContainText('comparison-history-test');
 await page.goto('/?dataset=elections-presidential-2026-r1&compare=elections-presidential-2022-r1&compareRevision=missing-comparison-revision');
 await expect(page.getByText(/comparison-revision-unavailable:missing-comparison-revision/)).toBeVisible();
 await expect(page.locator('.comparison-panel')).toHaveCount(0);
 await expect(page).toHaveURL(/compareRevision=missing-comparison-revision/);
});
